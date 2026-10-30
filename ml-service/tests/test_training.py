import json

import pandas as pd
import pytest

from app.features import build_training_dataset
from app.training import TrainingError, ks_statistic, run_training, train_models

from .conftest import REFERENCE_DATE


def test_ks_statistic():
    assert ks_statistic([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]) == pytest.approx(1.0)
    assert ks_statistic([0, 1, 0, 1], [0.5, 0.5, 0.5, 0.5]) == pytest.approx(0.0)


def test_train_models_compares_three_models(synthetic_data):
    clients, receivables = synthetic_data
    X, y, _ = build_training_dataset(clients, receivables, REFERENCE_DATE)
    pipeline, report = train_models(X, y)

    assert set(report["models"]) == {"logistic_regression", "decision_tree", "random_forest"}
    for metrics in report["models"].values():
        assert {"accuracy", "precision", "recall", "f1", "rocAuc", "ks", "gini"} <= set(metrics)
        assert metrics["gini"] == pytest.approx(2 * metrics["rocAuc"] - 1, abs=1e-3)
    best = report["models"][report["bestModel"]]
    assert best["rocAuc"] == max(m["rocAuc"] for m in report["models"].values())
    assert best["rocAuc"] > 0.7
    assert pipeline.predict_proba(X.head(3)).shape == (3, 2)


def test_train_models_requires_both_classes():
    X = pd.DataFrame({"purchase_count": range(100)})
    with pytest.raises(TrainingError):
        train_models(X, pd.Series([0] * 100))


def test_run_training_saves_model_and_metrics(repository, settings):
    bundle, report = run_training(repository, settings, reference_date=REFERENCE_DATE)
    assert settings.model_path.exists()
    saved = json.loads(settings.metrics_path.read_text())
    assert saved["bestModel"] == report["bestModel"] == bundle["modelName"]
    assert saved["thresholds"] == {"high": 0.6, "medium": 0.3}
