# Roteiro de demonstração (6–8 minutos)

## 1. Contexto — 40 segundos

Apresente o Sentinela como uma aplicação full-stack local para demonstrar autenticação, autorização e mitigação de riscos em uma API REST. Mostre rapidamente a separação `frontend`, `backend`, Prisma e testes.

## 2. Contrato público — 50 segundos

Abra `http://localhost:3000/api/docs`. Destaque o login público, o endpoint `/api/auth/me`, o CRUD de usuários, o esquema `bearerAuth` e os códigos `401`, `403` e `409`.

## 3. Administrador — 90 segundos

Na tela inicial, selecione a conta Administrador e entre. Mostre os indicadores, a tabela, o filtro e o console acadêmico. Crie um cliente com senha forte, edite seu perfil e abra a confirmação de exclusão. Explique por que o administrador não pode excluir a si mesmo nem remover o último administrador.

## 4. Operador e a falha corrigida — 90 segundos

Entre como Operador. Mostre que ele lista todos e edita clientes/operadores, mas não vê ação de criação/exclusão nem edição em administradores. No Postman, tente atualizar a própria conta enviando `perfil: "administrador"`; destaque a resposta `403 PERFIL_PROTEGIDO`.

## 5. Cliente — 60 segundos

Entre como Cliente. Mostre apenas “Meu perfil” e o console da API. Edite nome/e-mail e explique que `GET /api/usuarios` e o cadastro de terceiros são negados.

## 6. Segurança e qualidade — 70 segundos

Explique o JWT de uma hora, a releitura do usuário no banco a cada requisição, bcrypt com 12 rounds, Zod estrito, Prisma, Helmet/CSP, CORS, limite de JSON e rate limit. Execute ou apresente o resultado de:

```bash
npm run verify
npm run test:e2e
npm audit
```

Finalize esclarecendo que OAuth 2.0 com Authorization Code + PKCE está documentado como evolução, não implementado.
