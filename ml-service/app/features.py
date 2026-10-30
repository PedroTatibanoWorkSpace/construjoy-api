"""Engenharia de features de crédito.

Todas as features de um cliente são calculadas "como em" uma data de corte (`as_of`),
usando apenas contas com `purchase_date < as_of` e apenas o que já era conhecido
naquela data (um pagamento feito depois do corte conta como "em aberto").

- Para o score atual, `as_of` = agora.
- Para o treino, cada conta a receber vira um exemplo com `as_of` = sua data de compra,
  o que evita vazamento: o modelo só vê o histórico ANTERIOR à compra que está prevendo.

Rótulo (inadimplência) de uma conta: paga depois do vencimento ou ainda em aberto
com vencimento já passado. Contas em aberto que ainda não venceram não têm rótulo.
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd

FEATURE_NAMES = [
    "purchase_count",
    "purchase_frequency",
    "avg_purchase_value",
    "relationship_days",
    "days_since_last_purchase",
    "avg_days_late",
    "max_days_late",
    "on_time_rate",
    "open_balance",
    "overdue_balance",
    "overdue_count",
]

# Nomes expostos na API (camelCase, como no restante do sistema).
FEATURE_API_NAMES = {
    "purchase_count": "purchaseCount",
    "purchase_frequency": "purchaseFrequency",
    "avg_purchase_value": "avgPurchaseValue",
    "relationship_days": "relationshipDays",
    "days_since_last_purchase": "daysSinceLastPurchase",
    "avg_days_late": "avgDaysLate",
    "max_days_late": "maxDaysLate",
    "on_time_rate": "onTimeRate",
    "open_balance": "openBalance",
    "overdue_balance": "overdueBalance",
    "overdue_count": "overdueCount",
}

_NS_PER_DAY = 86_400 * 10**9
_DAYS_PER_MONTH = 30.0


def _ns(series: pd.Series) -> np.ndarray:
    """Datas como int64 em nanossegundos; NaT vira o menor int64."""
    return pd.to_datetime(series).to_numpy(dtype="datetime64[ns]").astype(np.int64)


def _day(ns: np.ndarray | int) -> np.ndarray | int:
    return np.floor_divide(ns, _NS_PER_DAY)


_NAT = np.iinfo(np.int64).min


class _ClientHistory:
    """Arrays de um cliente, ordenados por data de compra, para cálculo rápido de features."""

    def __init__(self, receivables: pd.DataFrame, created_at: Optional[pd.Timestamp]):
        df = receivables.sort_values("purchase_date", kind="stable")
        self.purchase_ns = _ns(df["purchase_date"])
        self.due_day = _day(_ns(df["due_date"]))
        payment_ns = _ns(df["payment_date"])
        self.paid_known = payment_ns != _NAT
        # Status 'Pago' sem data de pagamento: assume pagamento no vencimento.
        status_paid = (df["payment_status"].to_numpy() == "Pago") & ~self.paid_known
        due_ns = _ns(df["due_date"])
        self.payment_ns = np.where(status_paid, due_ns, payment_ns)
        self.is_paid = self.paid_known | status_paid
        self.payment_day = np.where(self.is_paid, _day(self.payment_ns), 0)
        self.value = df["value"].to_numpy(dtype=float)
        self.ids = df["id"].to_numpy() if "id" in df else None
        self.created_ns = (
            int(pd.Timestamp(created_at).value) if created_at is not None and not pd.isna(created_at) else None
        )

    def features(self, as_of_ns: int) -> dict:
        as_of_day = int(_day(as_of_ns))
        prior = self.purchase_ns < as_of_ns
        n = int(prior.sum())

        start_candidates = []
        if self.created_ns is not None and self.created_ns <= as_of_ns:
            start_candidates.append(self.created_ns)
        if n:
            start_candidates.append(int(self.purchase_ns[prior].min()))
        relationship_days = (as_of_ns - min(start_candidates)) / _NS_PER_DAY if start_candidates else 0.0

        if n == 0:
            return {
                "purchase_count": 0,
                "purchase_frequency": 0.0,
                "avg_purchase_value": 0.0,
                "relationship_days": float(relationship_days),
                "days_since_last_purchase": np.nan,
                "avg_days_late": 0.0,
                "max_days_late": 0.0,
                "on_time_rate": np.nan,
                "open_balance": 0.0,
                "overdue_balance": 0.0,
                "overdue_count": 0,
            }

        value = self.value[prior]
        due_day = self.due_day[prior]
        # Pagamento só é conhecido se aconteceu antes do corte.
        paid = self.is_paid[prior] & (self.payment_ns[prior] < as_of_ns)
        payment_day = self.payment_day[prior]

        matured = due_day < as_of_day
        open_ = ~paid
        overdue = open_ & matured

        if matured.any():
            settle_day = np.where(paid, payment_day, as_of_day)[matured]
            days_late = np.clip(settle_day - due_day[matured], 0, None)
            on_time = paid[matured] & (payment_day[matured] <= due_day[matured])
            avg_days_late = float(days_late.mean())
            max_days_late = float(days_late.max())
            on_time_rate = float(on_time.mean())
        else:
            avg_days_late = 0.0
            max_days_late = 0.0
            on_time_rate = np.nan

        months = max(relationship_days / _DAYS_PER_MONTH, 1.0)
        last_purchase_ns = int(self.purchase_ns[prior].max())
        return {
            "purchase_count": n,
            "purchase_frequency": float(n / months),
            "avg_purchase_value": float(value.mean()),
            "relationship_days": float(relationship_days),
            "days_since_last_purchase": float((as_of_ns - last_purchase_ns) / _NS_PER_DAY),
            "avg_days_late": avg_days_late,
            "max_days_late": max_days_late,
            "on_time_rate": on_time_rate,
            "open_balance": float(value[open_].sum()),
            "overdue_balance": float(value[overdue].sum()),
            "overdue_count": int(overdue.sum()),
        }

    def labels(self, reference_ns: int) -> np.ndarray:
        """1 = inadimplente, 0 = pago em dia, NaN = ainda não vencida (sem rótulo)."""
        reference_day = int(_day(reference_ns))
        paid = self.is_paid & (self.payment_ns <= reference_ns)
        labels = np.full(len(self.value), np.nan)
        labels[paid] = (self.payment_day[paid] > self.due_day[paid]).astype(float)
        overdue = ~paid & (self.due_day < reference_day)
        labels[overdue] = 1.0
        return labels


def _created_at_map(clients: pd.DataFrame) -> dict:
    return dict(zip(clients["id"], pd.to_datetime(clients["created_at"])))


def _now() -> pd.Timestamp:
    return pd.Timestamp.now(tz="UTC").tz_localize(None)


def compute_client_features(
    clients: pd.DataFrame,
    receivables: pd.DataFrame,
    as_of: Optional[pd.Timestamp] = None,
) -> pd.DataFrame:
    """Features atuais de cada cliente (uma linha por cliente, indexada pelo id)."""
    as_of_ns = int(pd.Timestamp(as_of if as_of is not None else _now()).value)
    created = _created_at_map(clients)
    grouped = dict(tuple(receivables.groupby("client_id"))) if len(receivables) else {}
    empty = receivables.iloc[0:0]
    rows = []
    for client_id in clients["id"]:
        history = _ClientHistory(grouped.get(client_id, empty), created.get(client_id))
        rows.append({"client_id": client_id, **history.features(as_of_ns)})
    df = pd.DataFrame(rows, columns=["client_id", *FEATURE_NAMES])
    return df.set_index("client_id")


def build_training_dataset(
    clients: pd.DataFrame,
    receivables: pd.DataFrame,
    reference_date: Optional[pd.Timestamp] = None,
) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """Uma linha por conta a receber rotulada.

    Retorna (X, y, meta), onde meta traz receivable_id, client_id e purchase_date.
    """
    reference_ns = int(pd.Timestamp(reference_date if reference_date is not None else _now()).value)
    created = _created_at_map(clients)
    feature_rows, labels, meta = [], [], []
    for client_id, group in receivables.groupby("client_id"):
        if client_id not in created:
            continue
        history = _ClientHistory(group, created[client_id])
        client_labels = history.labels(reference_ns)
        for i, purchase_ns in enumerate(history.purchase_ns):
            if np.isnan(client_labels[i]) or purchase_ns >= reference_ns:
                continue
            feature_rows.append(history.features(int(purchase_ns)))
            labels.append(int(client_labels[i]))
            meta.append(
                {
                    "receivable_id": history.ids[i] if history.ids is not None else None,
                    "client_id": client_id,
                    "purchase_date": pd.Timestamp(int(purchase_ns)),
                }
            )
    X = pd.DataFrame(feature_rows, columns=FEATURE_NAMES)
    y = pd.Series(labels, name="defaulted", dtype=int)
    return X, y, pd.DataFrame(meta, columns=["receivable_id", "client_id", "purchase_date"])


def to_api_features(row: pd.Series | dict) -> dict:
    """Converte uma linha de features para o formato JSON da API (camelCase, NaN -> null)."""
    out = {}
    for name in FEATURE_NAMES:
        value = row[name]
        if value is None or (isinstance(value, float) and np.isnan(value)):
            out[FEATURE_API_NAMES[name]] = None
        elif name in ("purchase_count", "overdue_count"):
            out[FEATURE_API_NAMES[name]] = int(value)
        else:
            out[FEATURE_API_NAMES[name]] = round(float(value), 4)
    return out
