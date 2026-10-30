"""Treina e compara os modelos de credit scoring a partir do Postgres.

Uso (a partir de ml-service/):
    python train.py

Salva o melhor modelo em models/model.joblib e as métricas em models/metrics.json.
"""

from __future__ import annotations

import sys

from app.config import get_settings
from app.repository import PostgresRepository, create_db_engine
from app.training import TrainingError, run_training


def main() -> None:
    settings = get_settings()
    repository = PostgresRepository(create_db_engine(settings.database_url))
    try:
        _, report = run_training(repository, settings)
    except TrainingError as exc:
        sys.exit(f"Falha no treino: {exc}")

    dataset = report["dataset"]
    print(
        f"Amostras: {dataset['samples']} (treino {dataset['trainSamples']}, teste {dataset['testSamples']}), "
        f"taxa de inadimplência: {dataset['defaultRate']:.1%}"
    )
    header = f"{'modelo':<22}{'acc':>7}{'prec':>7}{'rec':>7}{'f1':>7}{'auc':>7}{'ks':>7}{'gini':>7}{'cvAuc':>8}"
    print(header)
    print("-" * len(header))
    for name, m in report["models"].items():
        print(
            f"{name:<22}{m['accuracy']:>7.3f}{m['precision']:>7.3f}{m['recall']:>7.3f}{m['f1']:>7.3f}"
            f"{m['rocAuc']:>7.3f}{m['ks']:>7.3f}{m['gini']:>7.3f}{m['cvRocAucMean']:>8.3f}"
        )
    print(f"\nMelhor modelo ({report['selectionMetric']}): {report['bestModel']}")
    print(f"Salvo em {settings.model_path} e {settings.metrics_path}")


if __name__ == "__main__":
    main()
