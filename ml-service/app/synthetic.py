"""Gerador de dados sintéticos de crediário (clientes e contas a receber).

Cada cliente recebe um perfil (bom, oscilante ou mau pagador) e um risco latente.
A chance de atrasar uma conta depende desse risco, de sazonalidade (para os oscilantes)
e de o cliente já estar com contas vencidas no momento da compra — o que gera
o tipo de padrão que as features de histórico conseguem capturar.
"""

from __future__ import annotations

import unicodedata
import uuid
from typing import Optional

import numpy as np
import pandas as pd

SYNTHETIC_EMAIL_DOMAIN = "sintetico.local"

PROFILES = {
    # nome: (proporção, Beta(a, b) do risco latente, média de dias de atraso, chance de nunca pagar)
    "bom": (0.55, (1.0, 18.0), 4.0, 0.0),
    "oscilante": (0.30, (3.0, 6.0), 15.0, 0.03),
    "mau": (0.15, (6.0, 3.0), 40.0, 0.30),
}

FIRST_NAMES = [
    "Ana", "Bruno", "Carla", "Daniel", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor",
    "Juliana", "Lucas", "Mariana", "Nicolas", "Otávio", "Patrícia", "Rafael", "Sabrina",
    "Thiago", "Vanessa", "William", "José", "João", "Antônio", "Francisco", "Paulo",
    "Marcos", "Luiz", "Pedro", "Sebastião", "Raimundo", "Maria", "Aparecida", "Rosângela",
    "Cláudia", "Sandra", "Márcia", "Luciana", "Adriana", "Edson", "Valdir",
]
LAST_NAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
    "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
    "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade",
    "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas",
]
MATERIALS = [
    "Cimento CP-II 50kg", "Areia média (m³)", "Brita 1 (m³)", "Tijolo baiano 8 furos",
    "Bloco de concreto 14x19x39", "Vergalhão CA-50 10mm", "Telha cerâmica", "Telha de fibrocimento",
    "Argamassa AC-II", "Rejunte", "Piso cerâmico (m²)", "Porcelanato (m²)", "Tinta acrílica 18L",
    "Massa corrida", "Tubo PVC 100mm", "Conexões PVC", "Fio elétrico 2,5mm (rolo)",
    "Disjuntores", "Caixa d'água 1000L", "Madeira para caixaria", "Cal hidratada",
    "Impermeabilizante", "Porta de madeira", "Janela de alumínio", "Ferramentas diversas",
]
PAYMENT_TERMS_DAYS = [15, 30, 30, 30, 30, 45, 60]


def _slug(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return ascii_text.lower().replace(" ", ".")


def _cpf(rng: np.random.Generator) -> str:
    digits = list(rng.integers(0, 10, size=9))
    for length in (9, 10):
        total = sum(d * w for d, w in zip(digits, range(length + 1, 1, -1)))
        check = (total * 10) % 11
        digits.append(0 if check == 10 else check)
    return "".join(str(d) for d in digits)


def _description(rng: np.random.Generator) -> str:
    items = rng.choice(MATERIALS, size=int(rng.integers(1, 4)), replace=False)
    return ", ".join(f"{item} x{int(rng.integers(1, 20))}" for item in items)


def generate(
    n_clients: int = 300,
    n_receivables: int = 5000,
    months: int = 24,
    seed: int = 42,
    end_date: Optional[pd.Timestamp] = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Retorna (clients, receivables) prontos para inserir no banco.

    clients:     id, name, email, phone, document, created_at, profile
    receivables: id, client_id, value, description, purchase_date, due_date,
                 payment_date, payment_status
    """
    rng = np.random.default_rng(seed)
    end = pd.Timestamp(end_date) if end_date is not None else pd.Timestamp.now(tz="UTC").tz_localize(None)
    end = end.floor("s")
    start = end - pd.Timedelta(days=round(months * 30.44))
    span_days = (end - start).days

    profile_names = list(PROFILES)
    proportions = np.array([PROFILES[p][0] for p in profile_names])
    profiles = [str(p) for p in rng.choice(profile_names, size=n_clients, p=proportions / proportions.sum())]

    # Clientes mais antigos são mais comuns; ao menos 30 dias de relacionamento.
    created_offsets = rng.beta(1.2, 2.5, size=n_clients) * max(span_days - 30, 1)
    created_at = [(start + pd.Timedelta(days=float(o))).floor("s") for o in created_offsets]
    active_days = np.array([(end - c).days for c in created_at], dtype=float)
    activity = rng.lognormal(0.0, 0.6, size=n_clients) * active_days
    expected = n_receivables * activity / activity.sum()
    counts = np.maximum(rng.poisson(expected), 1)

    client_rows, receivable_rows = [], []
    for i in range(n_clients):
        client_id = str(uuid.UUID(int=int(rng.integers(0, 2**63)) << 64 | int(rng.integers(0, 2**63)), version=4))
        first, last1, last2 = rng.choice(FIRST_NAMES), rng.choice(LAST_NAMES), rng.choice(LAST_NAMES)
        name = f"{first} {last1} {last2}"
        profile = profiles[i]
        _, (a, b), mean_late, never_pay = PROFILES[profile]
        risk = rng.beta(a, b)
        phase = rng.uniform(0, 2 * np.pi)
        client_rows.append(
            {
                "id": client_id,
                "name": name,
                "email": f"{_slug(first)}.{_slug(last1)}.{i}@{SYNTHETIC_EMAIL_DOMAIN}",
                "phone": f"119{rng.integers(10_000_000, 99_999_999)}",
                "document": _cpf(rng),
                "created_at": created_at[i],
                "profile": profile,
            }
        )

        window = max((end - created_at[i]).total_seconds(), 1.0)
        offsets = np.sort(rng.uniform(0, window, size=counts[i]))
        history: list[tuple[pd.Timestamp, Optional[pd.Timestamp]]] = []  # (vencimento, pagamento)
        for offset in offsets:
            purchase = (created_at[i] + pd.Timedelta(seconds=float(offset))).floor("s")
            term = int(rng.choice(PAYMENT_TERMS_DAYS))
            due = (purchase + pd.Timedelta(days=term)).normalize() + pd.Timedelta(hours=12)
            value = float(np.clip(round(rng.lognormal(np.log(320), 0.8), 2), 20, 15000))

            has_overdue = any(d < purchase and (p is None or p > purchase) for d, p in history)
            p_late = risk
            if profile == "oscilante":
                p_late *= 1 + 0.7 * np.sin(2 * np.pi * (purchase - start).days / 180 + phase)
            if has_overdue:
                p_late += 0.25
            p_late = float(np.clip(p_late, 0.01, 0.97))

            if rng.random() < p_late:
                if rng.random() < never_pay:
                    payment = None
                else:
                    days_late = 1 + rng.exponential(mean_late)
                    payment = due + pd.Timedelta(days=float(days_late))
            else:
                early = rng.uniform(0, max(term - 1, 1)) * rng.beta(1, 3)
                payment = due - pd.Timedelta(days=float(early))
            if payment is not None:
                payment = max(payment, purchase + pd.Timedelta(hours=1)).floor("s")
                if payment > end:
                    payment = None
            history.append((due, payment))

            if payment is not None:
                status = "Pago"
            elif due < end:
                status = "Atrasado"
            else:
                status = "Pendente"
            receivable_rows.append(
                {
                    "id": str(uuid.UUID(int=int(rng.integers(0, 2**63)) << 64 | int(rng.integers(0, 2**63)), version=4)),
                    "client_id": client_id,
                    "value": value,
                    "description": _description(rng),
                    "purchase_date": purchase,
                    "due_date": due,
                    "payment_date": payment,
                    "payment_status": status,
                }
            )

    clients = pd.DataFrame(client_rows)
    receivables = pd.DataFrame(receivable_rows)
    receivables["payment_date"] = pd.to_datetime(receivables["payment_date"])
    return clients, receivables
