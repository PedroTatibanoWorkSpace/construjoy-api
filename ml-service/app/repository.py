"""Acesso aos dados do Postgres da API (tabelas criadas pelo Prisma).

As tabelas e colunas do Prisma usam nomes entre aspas e camelCase. Aqui elas são
normalizadas para DataFrames com colunas snake_case:

- clients:      id, created_at
- receivables:  id, client_id, value, purchase_date, due_date, payment_date, payment_status

Apenas registros com status = 'Active' são considerados.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional, Protocol, Sequence

import pandas as pd
from sqlalchemy import bindparam, create_engine, text
from sqlalchemy.engine import Engine

CLIENT_COLUMNS = ["id", "created_at"]
RECEIVABLE_COLUMNS = [
    "id",
    "client_id",
    "value",
    "purchase_date",
    "due_date",
    "payment_date",
    "payment_status",
]


class Repository(Protocol):
    def get_active_clients(self, client_ids: Optional[Sequence[str]] = None) -> pd.DataFrame: ...

    def get_receivables(self, client_ids: Optional[Sequence[str]] = None) -> pd.DataFrame: ...


def _normalize_clients(df: pd.DataFrame) -> pd.DataFrame:
    df = df.reindex(columns=CLIENT_COLUMNS).copy()
    df["id"] = df["id"].astype(str)
    df["created_at"] = pd.to_datetime(df["created_at"])
    return df.reset_index(drop=True)


def _normalize_receivables(df: pd.DataFrame) -> pd.DataFrame:
    df = df.reindex(columns=RECEIVABLE_COLUMNS).copy()
    df["id"] = df["id"].astype(str)
    df["client_id"] = df["client_id"].astype(str)
    df["value"] = df["value"].astype(float)
    for col in ("purchase_date", "due_date", "payment_date"):
        df[col] = pd.to_datetime(df[col])
    return df.reset_index(drop=True)


class PostgresRepository:
    def __init__(self, engine: Engine):
        self.engine = engine

    def get_active_clients(self, client_ids: Optional[Sequence[str]] = None) -> pd.DataFrame:
        sql = 'SELECT c."id", c."createdAt" AS created_at FROM "Clients" c WHERE c."status" = \'Active\''
        params: dict = {}
        if client_ids is not None:
            if not client_ids:
                return _normalize_clients(pd.DataFrame(columns=CLIENT_COLUMNS))
            sql += ' AND c."id" IN :ids'
            params["ids"] = list(client_ids)
        stmt = text(sql)
        if client_ids is not None:
            stmt = stmt.bindparams(bindparam("ids", expanding=True))
        with self.engine.connect() as conn:
            df = pd.read_sql(stmt, conn, params=params)
        return _normalize_clients(df)

    def get_receivables(self, client_ids: Optional[Sequence[str]] = None) -> pd.DataFrame:
        sql = """
            SELECT r."id",
                   r."id_client"     AS client_id,
                   r."value",
                   r."purchaseDate"  AS purchase_date,
                   r."validate"      AS due_date,
                   r."paymentDate"   AS payment_date,
                   r."paymentStatus" AS payment_status
              FROM "AccountsReceivable" r
              JOIN "Clients" c ON c."id" = r."id_client"
             WHERE r."status" = 'Active'
               AND c."status" = 'Active'
        """
        params: dict = {}
        if client_ids is not None:
            if not client_ids:
                return _normalize_receivables(pd.DataFrame(columns=RECEIVABLE_COLUMNS))
            sql += ' AND r."id_client" IN :ids'
            params["ids"] = list(client_ids)
        stmt = text(sql)
        if client_ids is not None:
            stmt = stmt.bindparams(bindparam("ids", expanding=True))
        with self.engine.connect() as conn:
            df = pd.read_sql(stmt, conn, params=params)
        # Contas antigas, anteriores à coluna purchaseDate, podem tê-la nula.
        df = df.dropna(subset=["purchase_date", "due_date"])
        return _normalize_receivables(df)


class InMemoryRepository:
    """Implementação em memória, usada nos testes e para avaliar dados sintéticos sem banco."""

    def __init__(self, clients: pd.DataFrame, receivables: pd.DataFrame):
        self.clients = _normalize_clients(clients)
        receivables = receivables[receivables["client_id"].isin(self.clients["id"])]
        self.receivables = _normalize_receivables(receivables)

    def get_active_clients(self, client_ids: Optional[Sequence[str]] = None) -> pd.DataFrame:
        if client_ids is None:
            return self.clients.copy()
        return self.clients[self.clients["id"].isin(list(client_ids))].reset_index(drop=True)

    def get_receivables(self, client_ids: Optional[Sequence[str]] = None) -> pd.DataFrame:
        if client_ids is None:
            return self.receivables.copy()
        mask = self.receivables["client_id"].isin(list(client_ids))
        return self.receivables[mask].reset_index(drop=True)


@lru_cache(maxsize=4)
def create_db_engine(database_url: str) -> Engine:
    if not database_url:
        raise RuntimeError("DATABASE_URL não configurada")
    return create_engine(database_url, pool_pre_ping=True)
