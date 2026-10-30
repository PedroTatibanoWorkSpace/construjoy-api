# ConstruControl 4.0 — Serviço de ML (Credit Scoring)

Serviço Python que estima a **probabilidade de inadimplência** de cada cliente do crediário
("fiado") e a converte em **score (0–100)**, **faixa de risco** e **limite de crédito sugerido**.
Lê diretamente o Postgres da API NestJS (tabelas do Prisma) e expõe uma API FastAPI na porta **8001**.

Stack: Python 3.11, FastAPI, Pandas, Scikit-Learn, SQLAlchemy + psycopg 3, joblib.

## Estrutura

```
ml-service/
├── app/
│   ├── config.py       # variáveis de ambiente (DATABASE_URL, cortes de faixa, limites)
│   ├── repository.py   # leitura de "Clients" e "AccountsReceivable" (só status = 'Active')
│   ├── features.py     # engenharia de features e montagem do dataset de treino
│   ├── training.py     # comparação de modelos, métricas, calibração e persistência
│   ├── scoring.py      # probabilidade -> score, faixa e limite sugerido
│   ├── synthetic.py    # gerador de dados sintéticos
│   └── main.py         # API FastAPI
├── scripts/seed_synthetic.py
├── train.py
├── models/             # model.joblib (gerado, ignorado no git) e metrics.json
└── tests/
```

## Como rodar localmente

Pré-requisitos: Python 3.11 e o Postgres do projeto rodando com as migrations aplicadas.

```sh
# na raiz do repositório
docker compose up -d postgres
yarn prisma migrate deploy

# no serviço
cd ml-service
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt     # ou requirements.txt, sem as libs de teste

python scripts/seed_synthetic.py         # 1. dados sintéticos
python train.py                          # 2. treino e comparação dos modelos
uvicorn app.main:app --port 8001         # 3. API (docs em http://localhost:8001/docs)
```

O `DATABASE_URL` é lido do ambiente, de `ml-service/.env` ou, por fim, do `.env` da raiz
(o mesmo da API). O formato do Prisma (`postgresql://...?schema=public`) é aceito.
Veja `.env.example` para todas as variáveis.

### Dados sintéticos

```sh
python scripts/seed_synthetic.py                       # ~300 clientes e ~5000 contas em 24 meses
python scripts/seed_synthetic.py --reset               # apaga os sintéticos e recria
python scripts/seed_synthetic.py --reset --only-reset  # só apaga
python scripts/seed_synthetic.py --clients 500 --receivables 8000 --months 36 --seed 7
```

Os clientes sintéticos têm e-mail `@sintetico.local`; o `--reset` apaga **apenas** esses
clientes e suas contas (e pagamentos, se houver). Sem `--reset`, o script se recusa a
duplicar a carga.

Cada cliente recebe um perfil — **bom** (55%), **oscilante** (30%) ou **mau pagador** (15%) — e
um risco latente sorteado de uma distribuição Beta própria do perfil. A chance de atrasar uma
conta cresce se o cliente já tem contas vencidas na data da compra, e os oscilantes têm
sazonalidade (fases boas e ruins). Valores seguem uma log-normal (mediana ≈ R$ 320) e os
prazos variam entre 15 e 60 dias.

## Modelagem

### Unidade de treino, rótulo e vazamento

Cada **conta a receber** é um exemplo de treino. As features são calculadas **como na data da
compra**: usam apenas contas compradas antes dela, e um pagamento feito depois dessa data conta
como "em aberto". Assim o modelo aprende a prever uma compra nova a partir do histórico
disponível no momento — sem vazamento de informação futura.

Rótulo `inadimplente = 1` quando a conta foi **paga depois do vencimento** ou **ainda está em aberto
com vencimento passado**. Contas em aberto que ainda não venceram ficam fora do treino.

### Features

| Feature | Descrição |
|---|---|
| `purchaseCount` | nº de compras anteriores |
| `purchaseFrequency` | compras por mês de relacionamento |
| `avgPurchaseValue` | valor médio das compras |
| `relationshipDays` | dias desde o cadastro / primeira compra |
| `daysSinceLastPurchase` | dias desde a última compra |
| `avgDaysLate` / `maxDaysLate` | dias de atraso médio / máximo das contas já vencidas |
| `onTimeRate` | taxa de quitação no prazo (contas vencidas pagas até o vencimento) |
| `openBalance` | saldo em aberto |
| `overdueBalance` / `overdueCount` | valor e quantidade de contas vencidas em aberto |

Valores ausentes (ex.: `onTimeRate` sem nenhuma conta vencida) são imputados pela mediana,
com uma coluna indicadora.

### Modelos e métricas

`train.py` (ou `POST /train`) compara **Regressão Logística**, **Árvore de Decisão** e
**Random Forest**, todos com `class_weight="balanced"`, num holdout **estratificado 75/25**,
além de validação cruzada estratificada (5 folds) no treino. Métricas: acurácia, precisão,
recall, F1, ROC-AUC, **KS** (máx. TPR − FPR) e **Gini** (2·AUC − 1).

O melhor modelo (maior ROC-AUC, F1 como desempate) é **calibrado** (sigmoid/Platt, 5 folds) e
re-treinado com todos os dados. A calibração é necessária porque o `class_weight` infla as
probabilidades; depois dela, a probabilidade média prevista coincide com a taxa real de
inadimplência. O resultado vai para `models/model.joblib` e todas as métricas para
`models/metrics.json`.

Resultado com os dados sintéticos padrão (seed 42, 4.637 contas rotuladas, 27,6% inadimplentes):

| Modelo | Acurácia | Precisão | Recall | F1 | ROC-AUC | KS | Gini |
|---|---|---|---|---|---|---|---|
| Regressão Logística | 0,814 | 0,656 | 0,684 | 0,670 | 0,852 | 0,567 | 0,703 |
| Árvore de Decisão | 0,798 | 0,622 | 0,684 | 0,652 | 0,850 | 0,542 | 0,700 |
| **Random Forest** | 0,808 | 0,637 | 0,703 | 0,669 | **0,863** | 0,564 | **0,726** |

Features mais importantes: taxa de quitação no prazo, dias médios de atraso e saldo vencido.

> Observação: um mesmo cliente pode ter contas no treino e no teste (o split é por conta,
> como pedido). As features não vazam o futuro, mas isso tende a deixar as métricas um pouco
> otimistas em relação a clientes totalmente novos.

### Score, faixa e limite

- `score = round(100 × (1 − probabilidade))` — maior é melhor.
- Faixa: **Alto** se `probabilidade ≥ HIGH_RISK_THRESHOLD` (0,6), **Medio** se
  `≥ MEDIUM_RISK_THRESHOLD` (0,3), senão **Baixo**.
- Limite sugerido (limite total, não disponível):
  `max(volume mensal × CREDIT_LIMIT_MONTHS, ticket médio) × (1 − probabilidade) × fator da faixa`
  (Baixo 1,0 · Medio 0,6 · Alto 0,25), limitado a `[MIN_CREDIT_LIMIT, MAX_CREDIT_LIMIT]` e
  arredondado para múltiplos de R$ 50.
- **Cliente sem histórico**: faixa **Medio** por regra (probabilidade mantida dentro da faixa)
  e limite `NEW_CLIENT_CREDIT_LIMIT` (R$ 500).

## API

| Método | Rota | Resposta |
|---|---|---|
| GET | `/health` | `{status, modelLoaded}` |
| GET | `/score/{client_id}` | objeto de score; **404** se o cliente não existe ou está inativo |
| POST | `/score/batch` | body `{clientIds?: string[]}` (vazio = todos os ativos) → `{results: [score]}`; ids inexistentes são ignorados |
| POST | `/train` | métricas (mesmo conteúdo de `metrics.json`); **422** se faltar dados |
| GET | `/metrics` | métricas do último treino |

Objeto de score:

```json
{
  "clientId": "01a9c41b-ce31-45e8-a3ea-53f268b15e1c",
  "probability": 0.5904,
  "score": 41,
  "level": "Medio",
  "suggestedCreditLimit": 600.0,
  "features": {
    "purchaseCount": 51, "purchaseFrequency": 2.77, "avgPurchaseValue": 426.35,
    "relationshipDays": 552.17, "daysSinceLastPurchase": 15.81, "avgDaysLate": 20.61,
    "maxDaysLate": 498.0, "onTimeRate": 0.4565, "openBalance": 2149.02,
    "overdueBalance": 523.63, "overdueCount": 1
  }
}
```

Se não houver modelo salvo, a primeira chamada de score treina automaticamente
(`AUTO_TRAIN=true`); com `AUTO_TRAIN=false` a API responde **503** até que `POST /train` seja chamado.
Erros de conexão com o banco também resultam em **503**.

## Docker

```sh
docker build -t construjoy-ml-service .
docker run -p 8001:8001 \
  -e DATABASE_URL=postgresql://construjoy:construjoy123@host.docker.internal:5435/construjoy_db \
  construjoy-ml-service
```

Para manter o modelo entre reinícios, monte um volume em `/app/models`. O seed e o treino
também rodam dentro do container:
`docker exec <container> python scripts/seed_synthetic.py` e `docker exec <container> python train.py`.

## Testes

```sh
pytest
```

Os testes não precisam de banco: usam um repositório em memória com dados gerados por
`app/synthetic.py`. Cobrem cálculo das features (incluindo ausência de vazamento e rótulos),
treino/métricas e o contrato dos endpoints.
