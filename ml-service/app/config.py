"""Configuração do serviço, lida de variáveis de ambiente.

Ordem de carga do .env: `ml-service/.env` e depois o `.env` da raiz do repositório
(as variáveis já definidas no ambiente nunca são sobrescritas).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv

SERVICE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(SERVICE_DIR / ".env")
load_dotenv(SERVICE_DIR.parent / ".env")


def _float(name: str, default: float) -> float:
    value = os.getenv(name)
    return float(value) if value not in (None, "") else default


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value in (None, ""):
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def normalize_database_url(url: str) -> str:
    """Converte a URL no formato do Prisma para o dialeto SQLAlchemy + psycopg 3.

    O Prisma aceita `?schema=public`, que o libpq rejeita; esse parâmetro é removido.
    """
    if not url:
        return url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    parts = urlsplit(url)
    query = [(k, v) for k, v in parse_qsl(parts.query) if k != "schema"]
    return urlunsplit(parts._replace(query=urlencode(query)))


@dataclass(frozen=True)
class Settings:
    database_url: str = field(
        default_factory=lambda: normalize_database_url(os.getenv("DATABASE_URL", ""))
    )
    model_dir: Path = field(
        default_factory=lambda: Path(os.getenv("MODEL_DIR", str(SERVICE_DIR / "models")))
    )
    # Cortes de faixa sobre a probabilidade de inadimplência.
    high_risk_threshold: float = field(default_factory=lambda: _float("HIGH_RISK_THRESHOLD", 0.6))
    medium_risk_threshold: float = field(default_factory=lambda: _float("MEDIUM_RISK_THRESHOLD", 0.3))
    # Limite de crédito sugerido.
    new_client_credit_limit: float = field(
        default_factory=lambda: _float("NEW_CLIENT_CREDIT_LIMIT", 500.0)
    )
    min_credit_limit: float = field(default_factory=lambda: _float("MIN_CREDIT_LIMIT", 0.0))
    max_credit_limit: float = field(default_factory=lambda: _float("MAX_CREDIT_LIMIT", 20000.0))
    credit_limit_months: float = field(default_factory=lambda: _float("CREDIT_LIMIT_MONTHS", 2.0))
    # Treina automaticamente na primeira requisição de score se não houver modelo salvo.
    auto_train: bool = field(default_factory=lambda: _bool("AUTO_TRAIN", True))
    random_state: int = field(default_factory=lambda: int(_float("RANDOM_STATE", 42)))

    @property
    def model_path(self) -> Path:
        return self.model_dir / "model.joblib"

    @property
    def metrics_path(self) -> Path:
        return self.model_dir / "metrics.json"


def get_settings() -> Settings:
    return Settings()
