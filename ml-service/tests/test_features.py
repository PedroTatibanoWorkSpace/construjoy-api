import math

import pandas as pd
import pytest

from app.config import normalize_database_url
from app.features import FEATURE_NAMES, build_training_dataset, compute_client_features, to_api_features
from app.repository import RECEIVABLE_COLUMNS

T = pd.Timestamp


def _clients(created_at="2025-01-01"):
    return pd.DataFrame([{"id": "c1", "created_at": T(created_at)}])


def _receivables(rows):
    base = {"client_id": "c1", "payment_date": None, "payment_status": "Pendente"}
    df = pd.DataFrame([{**base, **row} for row in rows], columns=RECEIVABLE_COLUMNS)
    for col in ("purchase_date", "due_date", "payment_date"):
        df[col] = pd.to_datetime(df[col])
    return df


HISTORY = _receivables(
    [
        # paga 1 dia antes do vencimento
        {"id": "r1", "value": 100.0, "purchase_date": "2025-02-01", "due_date": "2025-03-03",
         "payment_date": "2025-03-02", "payment_status": "Pago"},
        # paga com 10 dias de atraso
        {"id": "r2", "value": 200.0, "purchase_date": "2025-03-01", "due_date": "2025-03-31",
         "payment_date": "2025-04-10", "payment_status": "Pago"},
        # nunca paga, vencida
        {"id": "r3", "value": 300.0, "purchase_date": "2025-04-01", "due_date": "2025-05-01",
         "payment_status": "Atrasado"},
        # em aberto, ainda não venceu (em relação a 2025-05-21)
        {"id": "r4", "value": 400.0, "purchase_date": "2025-05-10", "due_date": "2025-06-09"},
    ]
)


def test_client_without_history():
    features = compute_client_features(_clients(), _receivables([]), as_of=T("2025-01-31"))
    row = features.loc["c1"]
    assert row["purchase_count"] == 0
    assert row["open_balance"] == 0
    assert math.isnan(row["on_time_rate"])
    assert row["relationship_days"] == pytest.approx(30)


def test_features_from_history():
    row = compute_client_features(_clients(), HISTORY, as_of=T("2025-05-21")).loc["c1"]
    assert row["purchase_count"] == 4
    assert row["avg_purchase_value"] == pytest.approx(250)
    # vencidas: r1 (0 dias), r2 (10 dias), r3 (20 dias em aberto até o corte)
    assert row["avg_days_late"] == pytest.approx(10)
    assert row["max_days_late"] == 20
    assert row["on_time_rate"] == pytest.approx(1 / 3)
    assert row["open_balance"] == pytest.approx(700)
    assert row["overdue_balance"] == pytest.approx(300)
    assert row["overdue_count"] == 1
    assert row["relationship_days"] == pytest.approx(140)
    assert row["purchase_frequency"] == pytest.approx(4 / (140 / 30))


def test_payment_after_cutoff_is_still_open():
    # Em 2025-04-05, r2 venceu e só será paga em 2025-04-10: deve contar como em aberto e atrasada.
    row = compute_client_features(_clients(), HISTORY, as_of=T("2025-04-05")).loc["c1"]
    assert row["purchase_count"] == 3
    assert row["open_balance"] == pytest.approx(500)
    assert row["overdue_balance"] == pytest.approx(200)
    assert row["on_time_rate"] == pytest.approx(0.5)


def test_labels_and_unmatured_exclusion():
    X, y, meta = build_training_dataset(_clients(), HISTORY, reference_date=T("2025-05-21"))
    labels = dict(zip(meta["receivable_id"], y))
    assert labels == {"r1": 0, "r2": 1, "r3": 1}  # r4 ainda não venceu: sem rótulo
    assert list(X.columns) == FEATURE_NAMES


def test_training_features_use_only_prior_history():
    X, _, meta = build_training_dataset(_clients(), HISTORY, reference_date=T("2025-05-21"))
    by_id = X.set_index(meta["receivable_id"])
    assert by_id.loc["r1", "purchase_count"] == 0
    assert by_id.loc["r3", "purchase_count"] == 2

    # Alterar o desfecho de uma conta posterior não pode mudar as features das anteriores.
    changed = HISTORY.copy()
    changed.loc[changed["id"] == "r3", ["payment_date", "payment_status"]] = [T("2025-04-20"), "Pago"]
    X2, _, meta2 = build_training_dataset(_clients(), changed, reference_date=T("2025-05-21"))
    by_id2 = X2.set_index(meta2["receivable_id"])
    pd.testing.assert_series_equal(by_id.loc["r2"], by_id2.loc["r2"])


def test_to_api_features_uses_camel_case_and_null():
    row = compute_client_features(_clients(), _receivables([]), as_of=T("2025-01-31")).loc["c1"]
    api = to_api_features(row)
    assert api["purchaseCount"] == 0
    assert api["onTimeRate"] is None
    assert set(api) >= {"avgPurchaseValue", "relationshipDays", "avgDaysLate", "openBalance"}


def test_synthetic_profiles_are_separable(synthetic_data):
    clients, receivables = synthetic_data
    features = compute_client_features(clients, receivables, as_of=T("2026-06-30 12:00:00"))
    rate = features.join(clients.set_index("id")["profile"]).groupby("profile")["on_time_rate"].mean()
    assert rate["bom"] > rate["oscilante"] > rate["mau"]


@pytest.mark.parametrize(
    "url, expected",
    [
        ("postgresql://u:p@localhost:5435/db", "postgresql+psycopg://u:p@localhost:5435/db"),
        ("postgresql://u:p@h:5432/db?schema=public", "postgresql+psycopg://u:p@h:5432/db"),
        ("postgres://u:p@h/db?sslmode=require", "postgresql+psycopg://u:p@h/db?sslmode=require"),
    ],
)
def test_normalize_database_url(url, expected):
    assert normalize_database_url(url) == expected
