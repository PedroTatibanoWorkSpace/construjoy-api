import pandas as pd
import pytest

from app.config import Settings
from app.repository import InMemoryRepository
from app.synthetic import generate

REFERENCE_DATE = pd.Timestamp("2026-06-30 12:00:00")


@pytest.fixture(scope="session")
def synthetic_data():
    return generate(n_clients=80, n_receivables=1200, months=18, seed=7, end_date=REFERENCE_DATE)


@pytest.fixture
def settings(tmp_path):
    return Settings(database_url="", model_dir=tmp_path, auto_train=True)


@pytest.fixture
def repository(synthetic_data):
    clients, receivables = synthetic_data
    return InMemoryRepository(clients, receivables)
