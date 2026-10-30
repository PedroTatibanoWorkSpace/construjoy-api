"""Treino e comparação dos modelos de credit scoring."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, clone
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from .config import Settings
from .features import FEATURE_NAMES, build_training_dataset
from .repository import Repository

MIN_SAMPLES = 50
MIN_SAMPLES_PER_CLASS = 10
SELECTION_METRIC = "rocAuc"


class TrainingError(Exception):
    pass


def build_candidates(random_state: int = 42) -> dict[str, Pipeline]:
    impute = ("imputer", SimpleImputer(strategy="median", add_indicator=True, keep_empty_features=True))
    return {
        "logistic_regression": Pipeline(
            [
                impute,
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(class_weight="balanced", max_iter=2000, random_state=random_state),
                ),
            ]
        ),
        "decision_tree": Pipeline(
            [
                impute,
                (
                    "model",
                    DecisionTreeClassifier(
                        max_depth=5,
                        min_samples_leaf=20,
                        class_weight="balanced",
                        random_state=random_state,
                    ),
                ),
            ]
        ),
        "random_forest": Pipeline(
            [
                impute,
                (
                    "model",
                    RandomForestClassifier(
                        n_estimators=300,
                        max_depth=8,
                        min_samples_leaf=5,
                        class_weight="balanced",
                        n_jobs=-1,
                        random_state=random_state,
                    ),
                ),
            ]
        ),
    }


def ks_statistic(y_true, y_score) -> float:
    """Kolmogorov-Smirnov: maior distância entre as distribuições acumuladas de bons e maus."""
    fpr, tpr, _ = roc_curve(y_true, y_score)
    return float(np.max(tpr - fpr))


def evaluate(y_true, y_pred, y_score) -> dict:
    auc = float(roc_auc_score(y_true, y_score))
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "rocAuc": auc,
        "ks": ks_statistic(y_true, y_score),
        "gini": 2 * auc - 1,
        "confusionMatrix": confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist(),
    }


def _feature_importance(pipeline: Pipeline) -> dict:
    model = pipeline.named_steps["model"]
    names = list(pipeline.named_steps["imputer"].get_feature_names_out(FEATURE_NAMES))
    if hasattr(model, "feature_importances_"):
        values = model.feature_importances_
    elif hasattr(model, "coef_"):
        values = model.coef_[0]
    else:
        return {}
    pairs = sorted(zip(names, values), key=lambda p: abs(p[1]), reverse=True)
    return {name: round(float(v), 6) for name, v in pairs}


def calibrated(pipeline: Pipeline) -> CalibratedClassifierCV:
    """class_weight='balanced' infla as probabilidades; a calibração sigmoid (Platt)
    as traz de volta à frequência real de inadimplência, que é o que a API expõe."""
    return CalibratedClassifierCV(clone(pipeline), method="sigmoid", cv=5)


def train_models(
    X: pd.DataFrame, y: pd.Series, random_state: int = 42, test_size: float = 0.25
) -> tuple[BaseEstimator, dict]:
    """Compara os candidatos num holdout estratificado e devolve (melhor modelo, métricas).

    O melhor modelo (maior ROC-AUC no teste, F1 como desempate) é calibrado e
    re-treinado com todos os dados.
    """
    if len(X) < MIN_SAMPLES:
        raise TrainingError(f"Dados insuficientes para treino: {len(X)} contas rotuladas (mínimo {MIN_SAMPLES}).")
    counts = y.value_counts()
    if len(counts) < 2 or counts.min() < MIN_SAMPLES_PER_CLASS:
        raise TrainingError(
            "É preciso ter contas pagas em dia e inadimplentes "
            f"(mínimo {MIN_SAMPLES_PER_CLASS} de cada); distribuição atual: {counts.to_dict()}."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)

    results: dict[str, dict] = {}
    for name, pipeline in build_candidates(random_state).items():
        fitted = clone(pipeline).fit(X_train, y_train)
        y_score = fitted.predict_proba(X_test)[:, 1]
        y_pred = (y_score >= 0.5).astype(int)
        metrics = evaluate(y_test, y_pred, y_score)
        cv_auc = cross_val_score(clone(pipeline), X_train, y_train, cv=cv, scoring="roc_auc")
        metrics["cvRocAucMean"] = float(cv_auc.mean())
        metrics["cvRocAucStd"] = float(cv_auc.std())
        results[name] = metrics

    best_name = max(results, key=lambda n: (results[n][SELECTION_METRIC], results[n]["f1"]))
    best_pipeline = build_candidates(random_state)[best_name]

    raw_score = clone(best_pipeline).fit(X_train, y_train).predict_proba(X_test)[:, 1]
    calibrated_score = calibrated(best_pipeline).fit(X_train, y_train).predict_proba(X_test)[:, 1]
    calibration = {
        "method": "sigmoid (Platt), 5 folds",
        "observedDefaultRate": float(y_test.mean()),
        "meanProbabilityBefore": float(raw_score.mean()),
        "meanProbabilityAfter": float(calibrated_score.mean()),
        "brierBefore": float(brier_score_loss(y_test, raw_score)),
        "brierAfter": float(brier_score_loss(y_test, calibrated_score)),
    }

    final = calibrated(best_pipeline).fit(X, y)

    report = {
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "bestModel": best_name,
        "selectionMetric": SELECTION_METRIC,
        "decisionThreshold": 0.5,
        "dataset": {
            "samples": int(len(X)),
            "trainSamples": int(len(X_train)),
            "testSamples": int(len(X_test)),
            "defaultRate": float(y.mean()),
            "split": f"holdout estratificado {int((1 - test_size) * 100)}/{int(test_size * 100)}",
            "unit": "conta a receber, com features do histórico anterior à compra",
        },
        "features": FEATURE_NAMES,
        "models": {name: _round(m) for name, m in results.items()},
        "calibration": _round(calibration),
        "featureImportance": _feature_importance(clone(best_pipeline).fit(X, y)),
    }
    return final, report


def _round(metrics: dict) -> dict:
    return {k: round(v, 4) if isinstance(v, float) else v for k, v in metrics.items()}


def save_model(pipeline: BaseEstimator, report: dict, settings: Settings) -> dict:
    settings.model_dir.mkdir(parents=True, exist_ok=True)
    bundle = {
        "pipeline": pipeline,
        "features": FEATURE_NAMES,
        "modelName": report["bestModel"],
        "trainedAt": report["trainedAt"],
    }
    joblib.dump(bundle, settings.model_path)
    Path(settings.metrics_path).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    return bundle


def run_training(repository: Repository, settings: Settings, reference_date: Optional[pd.Timestamp] = None) -> tuple[dict, dict]:
    """Carrega dados, treina, salva em disco. Retorna (bundle, métricas)."""
    clients = repository.get_active_clients()
    receivables = repository.get_receivables()
    X, y, _ = build_training_dataset(clients, receivables, reference_date)
    pipeline, report = train_models(X, y, random_state=settings.random_state)
    report["thresholds"] = {
        "high": settings.high_risk_threshold,
        "medium": settings.medium_risk_threshold,
    }
    return save_model(pipeline, report, settings), report
