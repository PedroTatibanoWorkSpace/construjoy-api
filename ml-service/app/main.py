"""API FastAPI de credit scoring do ConstruControl 4.0 (porta 8001)."""

from __future__ import annotations

import json
import logging
import threading
from typing import Optional

import joblib
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError

from .config import Settings, get_settings
from .features import compute_client_features
from .repository import PostgresRepository, Repository, create_db_engine
from .scoring import score_clients
from .training import TrainingError, run_training

logger = logging.getLogger("ml-service")


class ModelStore:
    """Mantém o modelo em memória; carrega do disco ou treina sob demanda."""

    def __init__(self) -> None:
        self._bundle: Optional[dict] = None
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self._bundle is not None

    def get(self, repository: Repository, settings: Settings) -> dict:
        with self._lock:
            if self._bundle is None and settings.model_path.exists():
                self._bundle = joblib.load(settings.model_path)
            if self._bundle is None:
                if not settings.auto_train:
                    raise HTTPException(503, "Modelo não treinado. Execute POST /train.")
                logger.info("Nenhum modelo salvo; treinando automaticamente.")
                try:
                    self._bundle, _ = run_training(repository, settings)
                except TrainingError as exc:
                    raise HTTPException(503, f"Modelo não treinado: {exc}") from exc
            return self._bundle

    def train(self, repository: Repository, settings: Settings) -> dict:
        with self._lock:
            self._bundle, report = run_training(repository, settings)
            return report


model_store = ModelStore()


def get_model_store() -> ModelStore:
    return model_store


def get_repository(settings: Settings = Depends(get_settings)) -> Repository:
    return PostgresRepository(create_db_engine(settings.database_url))


class BatchRequest(BaseModel):
    clientIds: Optional[list[str]] = None


app = FastAPI(
    title="ConstruControl ML Service",
    description="Credit scoring dos clientes do crediário (probabilidade de inadimplência).",
    version="1.0.0",
)


@app.exception_handler(SQLAlchemyError)
def database_error_handler(_request, exc: SQLAlchemyError):
    logger.exception("Erro de banco de dados", exc_info=exc)
    return JSONResponse(status_code=503, content={"detail": "Banco de dados indisponível."})


def _score(client_ids: Optional[list[str]], repository: Repository, settings: Settings, store: ModelStore) -> list[dict]:
    clients = repository.get_active_clients(client_ids)
    if clients.empty:
        return []
    bundle = store.get(repository, settings)
    receivables = repository.get_receivables(list(clients["id"]))
    features = compute_client_features(clients, receivables)
    return score_clients(bundle, features, settings)


@app.get("/health")
def health(store: ModelStore = Depends(get_model_store)):
    return {"status": "ok", "modelLoaded": store.loaded}


@app.get("/score/{client_id}")
def score_client(
    client_id: str,
    repository: Repository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
    store: ModelStore = Depends(get_model_store),
):
    results = _score([client_id], repository, settings, store)
    if not results:
        raise HTTPException(404, "Cliente não encontrado ou inativo.")
    return results[0]


@app.post("/score/batch")
def score_batch(
    body: Optional[BatchRequest] = None,
    repository: Repository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
    store: ModelStore = Depends(get_model_store),
):
    client_ids = body.clientIds if body and body.clientIds else None
    return {"results": _score(client_ids, repository, settings, store)}


@app.post("/train")
def train(
    repository: Repository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
    store: ModelStore = Depends(get_model_store),
):
    try:
        return store.train(repository, settings)
    except TrainingError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.get("/metrics")
def metrics(settings: Settings = Depends(get_settings)):
    if not settings.metrics_path.exists():
        raise HTTPException(404, "Nenhuma métrica disponível. Execute POST /train.")
    return json.loads(settings.metrics_path.read_text())
