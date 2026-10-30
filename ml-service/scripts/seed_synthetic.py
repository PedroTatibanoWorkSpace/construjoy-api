"""Popula o Postgres da API com clientes e contas a receber sintéticos.

Os clientes sintéticos usam e-mails @sintetico.local, o que permite removê-los
com segurança sem tocar em dados reais.

Uso (a partir de ml-service/):
    python scripts/seed_synthetic.py                 # insere (falha se já houver sintéticos)
    python scripts/seed_synthetic.py --reset         # apaga os sintéticos e insere de novo
    python scripts/seed_synthetic.py --reset --only-reset   # apenas apaga
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_settings  # noqa: E402
from app.repository import create_db_engine  # noqa: E402
from app.synthetic import SYNTHETIC_EMAIL_DOMAIN, generate  # noqa: E402

EMAIL_PATTERN = f"%@{SYNTHETIC_EMAIL_DOMAIN}"

SYNTHETIC_CLIENTS = 'SELECT "id" FROM "Clients" WHERE "email" LIKE :pattern'
SYNTHETIC_RECEIVABLES = f'SELECT "id" FROM "AccountsReceivable" WHERE "id_client" IN ({SYNTHETIC_CLIENTS})'

INSERT_CLIENT = text(
    """
    INSERT INTO "Clients" ("id", "name", "email", "phone", "document", "status", "createdAt", "updateAt")
    VALUES (:id, :name, :email, :phone, :document, 'Active', :created_at, :created_at)
    """
)
INSERT_RECEIVABLE = text(
    """
    INSERT INTO "AccountsReceivable"
        ("id", "id_client", "value", "description", "validate", "purchaseDate",
         "paymentDate", "paymentStatus", "status", "createdAt", "updateAt")
    VALUES (:id, :client_id, :value, :description, :due_date, :purchase_date,
            :payment_date, :payment_status, 'Active', :purchase_date, :updated_at)
    """
)


def _records(df: pd.DataFrame) -> list[dict]:
    records = df.to_dict("records")
    for row in records:
        for key, value in row.items():
            if isinstance(value, pd.Timestamp):
                row[key] = value.to_pydatetime()
            elif value is pd.NaT or (isinstance(value, float) and pd.isna(value)):
                row[key] = None
    return records


def reset(conn) -> tuple[int, int, int]:
    params = {"pattern": EMAIL_PATTERN}
    payments = conn.execute(
        text(f'DELETE FROM "Payments" WHERE "id_receivable" IN ({SYNTHETIC_RECEIVABLES})'), params
    ).rowcount
    receivables = conn.execute(
        text(f'DELETE FROM "AccountsReceivable" WHERE "id_client" IN ({SYNTHETIC_CLIENTS})'), params
    ).rowcount
    clients = conn.execute(text('DELETE FROM "Clients" WHERE "email" LIKE :pattern'), params).rowcount
    return clients, receivables, payments


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--clients", type=int, default=300)
    parser.add_argument("--receivables", type=int, default=5000, help="quantidade aproximada de contas")
    parser.add_argument("--months", type=int, default=24)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--reset", action="store_true", help=f"apaga os registros @{SYNTHETIC_EMAIL_DOMAIN} antes")
    parser.add_argument("--only-reset", action="store_true", help="com --reset, apenas apaga e sai")
    args = parser.parse_args()

    engine = create_db_engine(get_settings().database_url)
    with engine.begin() as conn:
        if args.reset or args.only_reset:
            clients, receivables, payments = reset(conn)
            print(f"Removidos: {clients} clientes, {receivables} contas, {payments} pagamentos sintéticos.")
            if args.only_reset:
                return
        existing = conn.execute(
            text('SELECT COUNT(*) FROM "Clients" WHERE "email" LIKE :pattern'), {"pattern": EMAIL_PATTERN}
        ).scalar_one()
        if existing:
            sys.exit(f"Já existem {existing} clientes sintéticos. Use --reset para recriá-los.")

        clients, receivables = generate(args.clients, args.receivables, args.months, args.seed)
        receivables["updated_at"] = receivables["payment_date"].fillna(receivables["purchase_date"])
        conn.execute(INSERT_CLIENT, _records(clients.drop(columns=["profile"])))
        conn.execute(INSERT_RECEIVABLE, _records(receivables))

    status = receivables["payment_status"].value_counts().to_dict()
    profiles = clients["profile"].value_counts().to_dict()
    print(f"Inseridos {len(clients)} clientes e {len(receivables)} contas a receber.")
    print(f"Perfis: {profiles}")
    print(f"Status das contas: {status}")


if __name__ == "__main__":
    main()
