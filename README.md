# Sentinela — Gestão Segura de Usuários

Aplicação acadêmica full-stack para demonstrar uma API REST segura, autenticação JWT e autorização por perfis (RBAC). O projeto usa um único monorepo npm, TypeScript estrito no frontend e no backend e banco SQLite reproduzível com Prisma.

## Tecnologias

- Node.js 24 LTS e npm workspaces;
- React 19 + Vite 8;
- Express 5 + Zod;
- Prisma + SQLite;
- JWT HS256, bcrypt (12 rounds), Helmet, CORS e rate limit;
- Vitest, Supertest, Testing Library e Playwright;
- Biome para lint e formatação.

## Execução rápida

Pré-requisito: Node.js 24 (a versão esperada está em `.nvmrc`).

```bash
nvm use
npm install
npm run setup
npm run dev
```

No desenvolvimento:

- frontend: `http://localhost:5173`;
- API: `http://localhost:3000/api`;
- Swagger: `http://localhost:3000/api/docs`.

O `setup` cria `backend/.env` com um segredo JWT aleatório, aplica as migrations e recria as credenciais das contas de demonstração. O arquivo existente nunca é sobrescrito.

Para simular produção, o Express serve o build do React e a API na mesma porta:

```bash
npm run build
npm start
```

Acesse `http://localhost:3000`.

## Contas de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@sistema.com` | `Admin@123` |
| Operador | `operador@sistema.com` | `Operador@123` |
| Cliente | `cliente@sistema.com` | `Cliente@123` |

Essas credenciais existem somente para a apresentação local e não devem ser reutilizadas em produção.

## Scripts

| Comando | Finalidade |
|---|---|
| `npm run setup` | Gera ambiente local, aplica migrations e executa o seed |
| `npm run dev` | Inicia API e interface com recarga automática |
| `npm run build` | Compila frontend e backend |
| `npm start` | Serve o build completo na porta configurada |
| `npm run verify` | Executa lint, tipagem, testes e build |
| `npm run test:e2e` | Valida no navegador os três perfis e gera evidências locais |
| `npm audit` | Audita as dependências instaladas |

Se o Chromium do Playwright ainda não estiver instalado, execute uma vez `npx playwright install chromium`.

## Perfis e permissões

| Operação | Administrador | Operador | Cliente |
|---|:---:|:---:|:---:|
| Listar todos | Sim | Sim | Não |
| Consultar outro usuário | Sim | Sim | Não |
| Consultar o próprio cadastro | Sim | Sim | Sim |
| Criar usuário | Sim | Não | Não |
| Editar nome/e-mail de admin | Sim | Não | Não |
| Editar nome/e-mail de operador/cliente | Sim | Sim | Apenas o próprio |
| Alterar perfil | Sim | Não | Não |
| Excluir usuário | Sim | Não | Não |

A API impede autoexclusão administrativa e qualquer rebaixamento ou exclusão que deixaria o sistema sem administrador. Em cada requisição protegida, o usuário é consultado novamente no banco; exclusões e mudanças de permissão têm efeito imediato mesmo que o JWT ainda não tenha expirado.

## Segurança implementada

- senhas armazenadas apenas como hash bcrypt, com 12 rounds por padrão;
- JWT de uma hora com `sub`, `nome`, `perfil`, `iat`, `exp`, `iss` e `aud`;
- segredo JWT obrigatório, aleatório e com no mínimo 32 caracteres;
- token mantido em `sessionStorage` e enviado por `Authorization: Bearer`;
- validação Zod estrita, normalização de e-mail e rejeição de campos desconhecidos;
- consultas somente pelo Prisma e respostas sem hash ou stack trace;
- Helmet/CSP, CORS restrito, JSON limitado a 32 KiB;
- até cinco logins malsucedidos por IP a cada 15 minutos;
- renderização segura do React, sem `dangerouslySetInnerHTML`;
- logout automático diante de uma resposta `401`.

## Estrutura

```text
gestao-usuarios/
├── backend/
│   ├── prisma/             # Schema, migration e seed
│   └── src/                # API, autenticação, RBAC e testes
├── frontend/
│   ├── public/             # Assets estáticos
│   └── src/                # React, cliente HTTP e testes
├── e2e/                    # Fluxos reais no navegador
├── docs/                   # Contrato, Postman e roteiro acadêmico
├── scripts/setup.mjs       # Preparação reproduzível
└── package.json            # Comandos e workspaces
```

## Documentos da entrega

- [Documentação acadêmica e da API](docs/documentacao-api.md)
- [Coleção Postman](docs/gestao-usuarios.postman_collection.json)
- [Roteiro de demonstração](docs/roteiro-demonstracao.md)
- [Guia das evidências](docs/evidencias/README.md)

O contrato executável também está disponível em `/api/openapi.json` e no Swagger UI em `/api/docs`.
