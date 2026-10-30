"""Transforma a probabilidade de inadimplência em score, faixa de risco e limite sugerido."""

from __future__ import annotations

import pandas as pd

from .config import Settings
from .features import FEATURE_NAMES, to_api_features

LEVEL_LOW = "Baixo"
LEVEL_MEDIUM = "Medio"
LEVEL_HIGH = "Alto"

# Fração da capacidade de compra liberada como limite em cada faixa.
LEVEL_LIMIT_FACTOR = {LEVEL_LOW: 1.0, LEVEL_MEDIUM: 0.6, LEVEL_HIGH: 0.25}


def risk_level(probability: float, settings: Settings) -> str:
    if probability >= settings.high_risk_threshold:
        return LEVEL_HIGH
    if probability >= settings.medium_risk_threshold:
        return LEVEL_MEDIUM
    return LEVEL_LOW


def probability_to_score(probability: float) -> int:
    """Score 0-100, maior = melhor pagador."""
    return int(round(100 * (1 - probability)))


def _round_to(value: float, step: float = 50.0) -> float:
    return float(round(value / step) * step)


def suggested_credit_limit(features: pd.Series, probability: float, level: str, settings: Settings) -> float:
    """Limite total sugerido: ~N meses do volume médio de compras, ponderado pelo risco."""
    if features["purchase_count"] == 0:
        return float(settings.new_client_credit_limit)
    monthly_volume = features["avg_purchase_value"] * features["purchase_frequency"]
    capacity = max(monthly_volume * settings.credit_limit_months, features["avg_purchase_value"])
    limit = capacity * (1 - probability) * LEVEL_LIMIT_FACTOR[level]
    limit = min(max(limit, settings.min_credit_limit), settings.max_credit_limit)
    return _round_to(limit)


def build_score(client_id: str, features: pd.Series, raw_probability: float, settings: Settings) -> dict:
    probability = float(raw_probability)
    if features["purchase_count"] == 0:
        # Sem histórico: faixa Média por regra, com a probabilidade mantida dentro dessa faixa.
        upper = max(settings.medium_risk_threshold, settings.high_risk_threshold - 0.01)
        probability = min(max(probability, settings.medium_risk_threshold), upper)
        level = LEVEL_MEDIUM
    else:
        level = risk_level(probability, settings)
    return {
        "clientId": client_id,
        "probability": round(probability, 4),
        "score": probability_to_score(probability),
        "level": level,
        "suggestedCreditLimit": suggested_credit_limit(features, probability, level, settings),
        "features": to_api_features(features),
    }


def score_clients(bundle: dict, features: pd.DataFrame, settings: Settings) -> list[dict]:
    """Calcula o score para cada linha de `features` (indexado pelo id do cliente)."""
    if features.empty:
        return []
    pipeline = bundle["pipeline"]
    probabilities = pipeline.predict_proba(features[FEATURE_NAMES])[:, 1]
    return [
        build_score(str(client_id), row, prob, settings)
        for (client_id, row), prob in zip(features.iterrows(), probabilities)
    ]
