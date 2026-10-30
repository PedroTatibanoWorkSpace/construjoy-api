# ConstruControl - Sistema de Gestão de Crédito

Um sistema backend desenvolvido com NestJS para gerenciamento de crédito para clientes, permitindo o controle eficiente de contas a receber e gestão de clientes.

## 🚀 Tecnologias Utilizadas

- [Node.js](https://nodejs.org/) - Ambiente de execução JavaScript
- [NestJS](https://nestjs.com/) - Framework para construção de aplicações server-side
- [TypeScript](https://www.typescriptlang.org/) - Linguagem de programação
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados relacional
- [Prisma ORM](https://www.prisma.io/) - ORM (Object-Relational Mapping)
- [Jest](https://jestjs.io/) - Framework de testes

## 📋 Pré-requisitos

- Node.js (v18+)
- NPM ou Yarn
- PostgreSQL (v14+)

## 📺 Demonstração da Aplicação

[![ConstruControl - Demonstração](https://img.youtube.com/vi/lAqAmuZaTus/0.jpg)](https://www.youtube.com/watch?v=lAqAmuZaTus)

## 🔧 Instalação

```sh
git clone https://github.com/PedroTatibanoWorkSpace/construjoy-api.git
cd construjoy-api
npm install
# ou
yarn install
```

## 💻 Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis de ambiente:

```sh
DB_USER=contrucontrol
DB_PASSWORD=teste123
DB_NAME=contrucontrol
DB_PORT=5432
APP_PORT=8000
DATABASE_URL=postgresql://contrucontrol:teste123@localhost:5432/contrucontrol
```

## 💻 Executando o projeto

### Ambiente de desenvolvimento:

```sh
npm run start:dev
# ou
yarn start:dev
```

## 🔍 Funcionalidades Principais

### Contas a Receber

- Criação de contas a receber
- Atualização de contas a receber
- Exclusão de contas a receber
- Listagem de contas a receber
- Marcação de contas como pagas
- Pagamento de múltiplas contas

### Pagamentos

- Registro de pagamentos
- Associação de pagamentos a contas a receber
- Diferentes métodos de pagamento

### Clientes

- Cadastro de clientes
- Atualização de dados de clientes
- Associação de clientes a contas a receber

### Usuários

- Gerenciamento de usuários do sistema

## 📦 Executando com Docker

Sobe a stack completa (PostgreSQL, API e serviço de ML):

```sh
cp .env.example .env   # preencha DB_USER, DB_PASSWORD e DB_NAME
docker compose up --build
```

- A API fica em `http://localhost:8000` (ex.: `curl localhost:8000/clients`).
- As migrations do Prisma são aplicadas automaticamente na inicialização da API.
- Dentro do compose, `DATABASE_URL` aponta para o host `postgres` e a API acessa o ML em `http://ml:8001`; o `DATABASE_URL` do `.env` só vale para execução local.
- Para subir só o banco e a API: `docker compose up --build postgres api`.
- Para derrubar: `docker compose down` (adicione `-v` para apagar o volume do banco).

## 📬 Contato

Email: pedrotatibano1900@gmail.com

