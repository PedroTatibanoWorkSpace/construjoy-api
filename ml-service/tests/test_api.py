from dataclasses import replace

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import ModelStore, app, get_model_store, get_repository
from app.repository import InMemoryRepository
from app.scoring import risk_level

SCORE_KEYS = {"clientId", "probability", "score", "level", "suggestedCreditLimit", "features"}


@pytest.fixture
def api_repository(synthetic_data):
    clients, receivables = synthetic_data
    newcomer = pd.DataFrame([{"id": "new-client", "created_at": pd.Timestamp("2026-06-01")}])
    return InMemoryRepository(pd.concat([clients, newcomer], ignore_index=True), receivables)


@pytest.fixture
def client(api_repository, settings):
    store = ModelStore()
    app.dependency_overrides[get_repository] = lambda: api_repository
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_model_store] = lambda: store
    yield TestClient(app)
    app.dependency_overrides.clear()


def _assert_contract(body):
    assert set(body) == SCORE_KEYS
    assert 0 <= body["probability"] <= 1
    assert 0 <= body["score"] <= 100
    assert body["score"] == round(100 * (1 - body["probability"]))
    assert body["level"] in {"Baixo", "Medio", "Alto"}
    assert body["suggestedCreditLimit"] >= 0
    assert isinstance(body["features"], dict)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_score_client_auto_trains_and_follows_contract(client, api_repository, settings):
    client_id = api_repository.clients["id"].iloc[0]
    response = client.get(f"/score/{client_id}")
    assert response.status_code == 200
    body = response.json()
    _assert_contract(body)
    assert body["clientId"] == client_id
    assert body["features"]["purchaseCount"] > 0
    assert settings.model_path.exists()


def test_score_unknown_client_returns_404(client):
    assert client.get("/score/does-not-exist").status_code == 404


def test_client_without_history_is_medium_with_conservative_limit(client, settings):
    body = client.get("/score/new-client").json()
    _assert_contract(body)
    assert body["level"] == "Medio"
    assert body["suggestedCreditLimit"] == settings.new_client_credit_limit
    assert body["features"]["purchaseCount"] == 0


def test_bad_payers_score_worse_than_good_payers(client, synthetic_data):
    clients, _ = synthetic_data
    results = client.post("/score/batch", json={}).json()["results"]
    scores = pd.DataFrame(results).set_index("clientId").join(clients.set_index("id")["profile"])
    by_profile = scores.groupby("profile")["score"].mean()
    assert by_profile["bom"] > by_profile["mau"]


def test_batch_all_and_subset(client, api_repository):
    all_results = client.post("/score/batch", json={}).json()["results"]
    assert len(all_results) == len(api_repository.clients)

    ids = list(api_repository.clients["id"].iloc[:3]) + ["does-not-exist"]
    subset = client.post("/score/batch", json={"clientIds": ids}).json()["results"]
    assert {r["clientId"] for r in subset} == set(ids[:3])
    for result in subset:
        _assert_contract(result)


def test_batch_without_body(client, api_repository):
    response = client.post("/score/batch")
    assert response.status_code == 200
    assert len(response.json()["results"]) == len(api_repository.clients)


def test_train_endpoint_returns_metrics(client):
    response = client.post("/train")
    assert response.status_code == 200
    body = response.json()
    assert body["bestModel"] in body["models"]
    assert client.get("/metrics").json()["bestModel"] == body["bestModel"]
    assert client.get("/health").json()["modelLoaded"] is True


def test_score_without_model_and_auto_train_disabled(client, settings):
    app.dependency_overrides[get_settings] = lambda: replace(settings, auto_train=False)
    response = client.get("/score/new-client")
    assert response.status_code == 503


def test_risk_level_thresholds_are_configurable(settings):
    assert risk_level(0.65, settings) == "Alto"
    assert risk_level(0.35, settings) == "Medio"
    assert risk_level(0.1, settings) == "Baixo"
    strict = replace(settings, high_risk_threshold=0.4, medium_risk_threshold=0.2)
    assert risk_level(0.45, strict) == "Alto"
    assert risk_level(0.25, strict) == "Medio"
