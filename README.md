<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ConstruControl - Sistema de Gestão de Crédito</title>
</head>
<body>
    <h1>ConstruControl - Sistema de Gestão de Crédito</h1>
    <p>Um sistema backend desenvolvido com NestJS para gerenciamento de crédito para clientes, permitindo o controle eficiente de contas a receber e gestão de clientes.</p>
    
    <h2>🚀 Tecnologias Utilizadas</h2>
    <ul>
        <li><a href="https://nodejs.org/">Node.js</a> - Ambiente de execução JavaScript</li>
        <li><a href="https://nestjs.com/">NestJS</a> - Framework para construção de aplicações server-side</li>
        <li><a href="https://www.typescriptlang.org/">TypeScript</a> - Linguagem de programação</li>
        <li><a href="https://www.postgresql.org/">PostgreSQL</a> - Banco de dados relacional</li>
        <li><a href="https://www.prisma.io/">Prisma ORM</a> - ORM (Object-Relational Mapping)</li>
        <li><a href="https://jestjs.io/">Jest</a> - Framework de testes</li>
    </ul>

    <h2>📋 Pré-requisitos</h2>
    <ul>
        <li>Node.js (v18+)</li>
        <li>NPM ou Yarn</li>
        <li>PostgreSQL (v14+)</li>
    </ul>

    <h2>📺 Demonstração da Aplicação</h2>
    <a href="https://www.youtube.com/watch?v=lAqAmuZaTus" target="_blank">
        <img src="https://img.youtube.com/vi/lAqAmuZaTus/0.jpg" alt="ConstruControl - Demonstração">
    </a>
    
    <h2>🔧 Instalação</h2>
    <pre>
        git clone https://github.com/seu-usuario/construjoy-api.git
        cd construjoy-api
        npm install
        # ou
        yarn install
    </pre>

    <h2>💻 Configuração do Ambiente</h2>
    <p>Crie um arquivo <code>.env</code> na raiz do projeto e adicione as seguintes variáveis de ambiente:</p>
    <pre>
        DB_USER=contrucontrol
        DB_PASSWORD=teste123
        DB_NAME=contrucontrol
        DB_PORT=5432
        APP_PORT=8000
        DATABASE_URL=postgresql://contrucontrol:teste123@localhost:5432/contrucontrol
    </pre>

    <h2>💻 Executando o projeto</h2>
    <h3>Ambiente de desenvolvimento:</h3>
    <pre>
        npm run start:dev
        # ou
        yarn start:dev
    </pre>
    
    <h2>🔍 Funcionalidades Principais</h2>
    <h3>Contas a Receber</h3>
    <ul>
        <li>Criação de contas a receber</li>
        <li>Atualização de contas a receber</li>
        <li>Exclusão de contas a receber</li>
        <li>Listagem de contas a receber</li>
        <li>Marcação de contas como pagas</li>
        <li>Pagamento de múltiplas contas</li>
    </ul>
    
    <h3>Pagamentos</h3>
    <ul>
        <li>Registro de pagamentos</li>
        <li>Associação de pagamentos a contas a receber</li>
        <li>Diferentes métodos de pagamento</li>
    </ul>

    <h3>Clientes</h3>
    <ul>
        <li>Cadastro de clientes</li>
        <li>Atualização de dados de clientes</li>
        <li>Associação de clientes a contas a receber</li>
    </ul>

    <h3>Usuários</h3>
    <ul>
        <li>Gerenciamento de usuários do sistema</li>
    </ul>
    
    <h2>Estrutura de Banco de Dados</h2>
    <ul>
        <li><strong>Users</strong>: Armazena informações dos usuários do sistema</li>
        <li><strong>Clients</strong>: Cadastro de clientes</li>
        <li><strong>AccountsReceivable</strong>: Contas a receber</li>
        <li><strong>Payments</strong>: Pagamentos realizados</li>
    </ul>

    <h2>Endpoints da API</h2>
    <h3>Contas a Receber</h3>
    <pre>
        POST /receivables - Criar nova conta a receber
        GET /receivables - Listar todas as contas a receber
        GET /receivables/:id - Buscar conta a receber por ID
        PATCH /receivables/:id - Atualizar conta a receber
        DELETE /receivables/:id - Excluir conta a receber
        PATCH /receivables/paid - Marcar conta como paga
    </pre>
    
    <h3>Pagamentos</h3>
    <pre>
        POST /payments - Registrar novo pagamento
        GET /payments - Listar todos os pagamentos
        GET /payments/:id - Buscar pagamento por ID
        PATCH /payments/:id - Atualizar pagamento
        DELETE /payments/:id - Excluir pagamento
    </pre>
    
    <h2>📦 Executando com Docker</h2>
    <p>Antes de executar, certifique-se de definir as variáveis de ambiente no arquivo <code>.env</code>.</p>
    <pre>
        docker-compose up --build
    </pre>

    <h2>Contato</h2>
    <p>Email: pedrotatibano1900@gmail.com</p>
</body>
</html>
