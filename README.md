# 🔐 Sistema de Gestão de Usuários - API REST Segura

## 📋 Objetivo do Projeto

Aplicação web para gerenciamento de usuários com API REST segura, desenvolvida como projeto acadêmico. A solução implementa autenticação JWT, controle de acesso baseado em perfis (RBAC) e boas práticas de segurança.

## 🛠️ Tecnologias Utilizadas

### Back-end
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
### Back-end
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **sql.js (SQLite WebAssembly)** - Banco de dados relacional sem necessidade de compilação nativa
- **jsonwebtoken** - Geração e validação de tokens JWT
- **bcryptjs** - Hash seguro de senhas
- **cors** - Middleware para Cross-Origin Resource Sharing

### Front-end
- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização e responsividade
- **JavaScript (ES6+)** - Lógica de interação e consumo da API

## 📁 Estrutura do Projeto

```text
gestao-usuarios/
├── backend/
│   ├── config/
│   │   └── database.js           # Inicialização e persistência do SQLite
│   ├── controllers/
│   │   ├── auth.controller.js    # Login e geração de JWT
│   │   └── usuarios.controller.js# CRUD de usuários e regras de negócio
│   ├── middleware/
│   │   ├── auth.js               # Verificação de tokens JWT
│   │   └── rbac.js               # Controle de acesso por perfil
│   ├── routes/
│   │   ├── auth.routes.js        # Rotas de autenticação
│   │   └── usuarios.routes.js    # Rotas de gerenciamento de usuários
│   ├── package.json
│   └── server.js                 # Inicialização do servidor Express
├── frontend/
│   ├── css/
│   │   └── style.css             # Estilização completa e responsiva
│   ├── js/
│   │   ├── api.js                # Cliente HTTP para a API
│   │   ├── auth.js               # Gerenciamento de sessão/login
│   │   └── dashboard.js          # Lógica da interface do dashboard
│   ├── index.html                # Página de login
│   └── dashboard.html            # Painel interativo com console visual
└── docs/
    └── documentacao-api.md       # Documentação acadêmica detalhada da API
```

## 🚀 Como Instalar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm (incluído com o Node.js)

### Passo a passo
1. Clone ou extraia o projeto
2. `cd gestao-usuarios/backend`
3. `npm install`
4. `npm start`
5. Abra `http://localhost:3000` (ou a porta onde servir o frontend) no navegador para acessar a interface.

## 🔑 Credenciais Padrão

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@sistema.com | Admin@123 |

## 🧪 Como Testar

### Via Interface Web
1. Acesse `http://localhost:3000` ou sirva o front-end via um servidor local.
2. Faça login com as credenciais de administrador.
3. Crie usuários com diferentes perfis.
4. Faça logout e login com os novos usuários para testar restrições.

### Via API (curl)

Substitua `<SEU_TOKEN_AQUI>` pelo token JWT obtido no login.

**Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@sistema.com", "senha":"Admin@123"}'
```

**Listar usuários (com token)**
```bash
curl -X GET http://localhost:3000/api/usuarios \
     -H "Authorization: Bearer <SEU_TOKEN_AQUI>"
```

**Criar usuário (com token)**
```bash
curl -X POST http://localhost:3000/api/usuarios \
     -H "Authorization: Bearer <SEU_TOKEN_AQUI>" \
     -H "Content-Type: application/json" \
     -d '{"nome":"Teste", "email":"teste@sistema.com", "senha":"123", "perfil":"cliente"}'
```

**Atualizar usuário (com token)**
```bash
curl -X PUT http://localhost:3000/api/usuarios/2 \
     -H "Authorization: Bearer <SEU_TOKEN_AQUI>" \
     -H "Content-Type: application/json" \
     -d '{"nome":"Nome Alterado"}'
```

**Excluir usuário (com token)**
```bash
curl -X DELETE http://localhost:3000/api/usuarios/2 \
     -H "Authorization: Bearer <SEU_TOKEN_AQUI>"
```

## 📊 Perfis de Acesso

- **Administrador**: Possui acesso total e irrestrito, podendo gerenciar todos os usuários do sistema sem limitações.
- **Operador**: Perfil intermediário que pode listar todos os usuários e editar seus dados, porém bloqueado para exclusão e criação de novos usuários.
- **Cliente**: Acesso mais restritivo. Somente pode ler e editar os seus próprios dados básicos.

## 🔒 Segurança

O projeto utiliza práticas consolidadas de segurança:
- Não armazenamento de senhas em texto puro (Hashes gerados com **bcrypt** e salt dinâmico).
- Sessões protegidas por **JSON Web Tokens (JWT)**.
- Autorização em nível de recurso e endpoint por middleware de checagem (Role-Based Access Control).
- Proteção nativa contra injeção de SQL via consultas parametrizadas com prepared statements.
- Imunidade a ataques clássicos CSRF por via de tokens declarativos enviados no cabeçalho HTTP (não através de cookies).

## 📖 Documentação Completa

O projeto inclui um documento acadêmico em profundidade discutindo modelagem, matriz de acesso RBAC, estratégias futuras como OAuth 2.0 e uma tabela de mitigação de vulnerabilidades comuns:

🔗 [Acesse docs/documentacao-api.md para ler a Documentação Completa de API](docs/documentacao-api.md)
