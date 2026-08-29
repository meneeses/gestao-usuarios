# Documentação acadêmica — Sentinela

## 1. Objetivo e arquitetura

O Sentinela demonstra a construção de uma API REST segura para gestão de usuários. A interface React consome exclusivamente endpoints JSON do Express. O Prisma é a única camada de acesso ao SQLite e as migrations tornam o banco reproduzível.

```text
Navegador (React)
       │ JSON + Authorization: Bearer
       ▼
Express 5 ── Helmet/CORS/limites ── autenticação ── RBAC/Zod
       │
       ▼
Prisma ORM ── SQLite
```

Em desenvolvimento, o Vite executa na porta 5173 e encaminha `/api` à porta 3000. No build, o Express serve tanto o frontend quanto a API na porta 3000.

## 2. Modelo de dados

`Usuario` possui os campos abaixo:

| Campo | Tipo | Regra |
|---|---|---|
| `id` | inteiro | chave primária autoincremental |
| `nome` | texto | 2 a 100 caracteres |
| `email` | texto | normalizado, válido e único |
| `senhaHash` | texto | bcrypt; nunca integra uma resposta pública |
| `perfil` | enum textual | `administrador`, `operador` ou `cliente` |
| `criadoEm` | data/hora | preenchido automaticamente |
| `atualizadoEm` | data/hora | atualizado automaticamente |

A representação pública é:

```json
{
  "id": 1,
  "nome": "Administrador do Sistema",
  "email": "admin@sistema.com",
  "perfil": "administrador",
  "criadoEm": "2026-08-29T03:00:00.000Z",
  "atualizadoEm": "2026-08-29T03:00:00.000Z"
}
```

## 3. Contrato HTTP

| Método e endpoint | Permissão | Respostas relevantes |
|---|---|---|
| `GET /api/health` | Público | `200` |
| `POST /api/auth/login` | Público | `200`, `400`, `401`, `429` |
| `GET /api/auth/me` | Autenticado | `200`, `401` |
| `GET /api/usuarios` | Administrador/operador | `200`, `401`, `403` |
| `GET /api/usuarios/:id` | Admin/operador ou próprio cliente | `200`, `400`, `401`, `403`, `404` |
| `POST /api/usuarios` | Administrador | `201`, `400`, `401`, `403`, `409` |
| `PUT /api/usuarios/:id` | Conforme RBAC | `200`, `400`, `401`, `403`, `404`, `409` |
| `DELETE /api/usuarios/:id` | Administrador | `204`, `400`, `401`, `403`, `404` |
| `GET /api/docs` | Público | `200`, Swagger UI |
| `GET /api/openapi.json` | Público | `200`, OpenAPI 3.1 |

### Login

Requisição:

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@sistema.com","senha":"Admin@123"}
```

Resposta `200`:

```json
{
  "token": "eyJ...",
  "tipo": "Bearer",
  "expiraEm": 3600,
  "usuario": {
    "id": 1,
    "nome": "Administrador do Sistema",
    "email": "admin@sistema.com",
    "perfil": "administrador",
    "criadoEm": "2026-08-29T03:00:00.000Z",
    "atualizadoEm": "2026-08-29T03:00:00.000Z"
  }
}
```

### Listagem

`GET /api/usuarios` responde `{"usuarios": [UsuarioPublico]}`. Hashes de senha nunca são selecionados para o contrato público.

### Criação

`POST /api/usuarios` recebe todos os campos abaixo. Somente um administrador pode executar a operação.

```json
{
  "nome": "Maria Cliente",
  "email": "maria@example.com",
  "senha": "Senha@123",
  "perfil": "cliente"
}
```

Uma criação válida responde `201` com `{"mensagem":"Usuário criado com sucesso","usuario":UsuarioPublico}`. E-mail duplicado responde `409`.

### Atualização

`PUT /api/usuarios/:id` recebe `nome` e `email`; `perfil` é opcional e aceito somente para administradores. Campos extras são recusados.

```json
{"nome":"Maria Silva","email":"maria.silva@example.com","perfil":"operador"}
```

A resposta válida é `200` com `mensagem` e `usuario`. Operadores e clientes que enviarem `perfil` recebem `403`, inclusive ao tentar manter ou elevar o próprio perfil.

### Exclusão

`DELETE /api/usuarios/:id` é exclusivo do administrador e responde `204` sem corpo. A API recusa autoexclusão e preserva pelo menos um administrador.

### Formato de erro

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Dados inválidos",
    "campos": {
      "email": ["Invalid email address"]
    }
  }
}
```

`campos` existe somente quando há detalhes úteis de validação. Nunca são retornados stack trace, SQL, hash ou segredo.

## 4. Validação

A validação é executada pelo Zod antes das operações de banco:

- `nome`: texto sem espaços externos, entre 2 e 100 caracteres;
- `email`: formato válido, máximo de 254 caracteres, minúsculas e unicidade;
- `senha`: 8 a 72 caracteres, com letra maiúscula, minúscula e número;
- `perfil`: um dos três valores cadastrados;
- `id`: inteiro positivo;
- objetos: modo estrito, rejeitando propriedades desconhecidas.

## 5. Autenticação JWT

O login compara a senha informada ao hash bcrypt. Em caso de sucesso, a API assina um JWT usando somente HS256 e um segredo de no mínimo 32 caracteres. Não existe segredo padrão no código.

O payload possui:

- `sub`: ID do usuário;
- `nome` e `perfil`: contexto da emissão;
- `iat` e `exp`: emissão e expiração;
- `iss` e `aud`: emissor e público esperados.

O token expira em uma hora e é enviado como `Authorization: Bearer <token>`. A interface o mantém no `sessionStorage`, portanto ele é descartado ao encerrar a sessão do navegador. Essa escolha reduz persistência, mas não elimina o risco de XSS; por isso o React não usa HTML injetado e a CSP restringe as origens.

O JWT não é tratado como fonte permanente de autorização. Após validar assinatura e claims, o middleware lê o usuário atual no SQLite. Assim, uma conta excluída recebe `401` e uma alteração de perfil vale imediatamente, mesmo com um token anterior.

## 6. Matriz RBAC

| Ação | Administrador | Operador | Cliente |
|---|:---:|:---:|:---:|
| Listar todos | ✅ | ✅ | ❌ |
| Consultar qualquer cadastro | ✅ | ✅ | ❌ |
| Consultar o próprio cadastro | ✅ | ✅ | ✅ |
| Criar | ✅ | ❌ | ❌ |
| Editar admin | ✅ | ❌ | ❌ |
| Editar nome/e-mail de operador ou cliente | ✅ | ✅ | apenas o próprio |
| Alterar qualquer perfil | ✅ | ❌ | ❌ |
| Excluir | ✅ | ❌ | ❌ |

Além da permissão da rota, a API verifica o recurso de destino. Essa autorização em nível de objeto fecha a falha anterior na qual um operador conseguia enviar `perfil: "administrador"` ao editar a própria conta.

## 7. Riscos e mitigações

| Risco | Mitigação implementada | Risco residual |
|---|---|---|
| Força bruta no login | bcrypt e 5 falhas por IP/15 min | ataques distribuídos exigiriam proteção de borda |
| Senha exposta | hash bcrypt com 12 rounds; hash nunca sai da API | credenciais demo não servem para produção |
| Injeção SQL | acesso exclusivamente pelo Prisma | dependências e consultas futuras devem ser revisadas |
| Elevação de privilégio | perfil aceito apenas de administradores e usuário atual relido | conta admin comprometida mantém alto impacto |
| IDOR/acesso a terceiros | RBAC por rota e por ID do recurso | novas rotas devem repetir a verificação de objeto |
| XSS armazenado | escaping do React, sem `dangerouslySetInnerHTML`, CSP | extensões ou dependências comprometidas ainda são risco |
| Roubo de JWT | `sessionStorage`, validade de 1 h, CSP e logout em `401` | JavaScript malicioso na mesma origem poderia lê-lo |
| CSRF | autenticação no cabeçalho, sem cookie automático | um futuro uso de cookies exigiria token CSRF/SameSite |
| Vazamento de detalhes | erros padronizados sem stack/SQL | logs do servidor devem ter acesso restrito |
| CORS permissivo | allowlist configurável | origem precisa ser revisada em cada ambiente |
| DoS por payload | JSON limitado a 32 KiB | proteção de infraestrutura seria necessária na internet |

O projeto é deliberadamente local e acadêmico. Uma implantação real também exigiria HTTPS, gestão centralizada de segredos, logs de auditoria, backup, monitoramento e política de recuperação de conta.

## 8. OAuth 2.0 — proposta, não implementação

OAuth 2.0 não está implementado. Para autorizar aplicações parceiras, a evolução indicada é **Authorization Code com PKCE**, inclusive para clientes públicos:

1. o cliente gera `code_verifier` aleatório e deriva `code_challenge` com SHA-256;
2. redireciona o usuário ao servidor de autorização com `client_id`, `redirect_uri`, `state`, `code_challenge` e `code_challenge_method=S256`;
3. após login e consentimento, recebe um código curto na URI previamente cadastrada;
4. troca o código por access token enviando também o `code_verifier`;
5. o servidor confirma que o verifier corresponde ao challenge e emite token limitado por escopos;
6. a API valida emissor, público, expiração e escopos, por exemplo `usuarios:read` e `usuarios:write`.

`state` reduz ataques de redirecionamento/CSRF e PKCE impede que um código interceptado seja trocado sem o segredo efêmero do cliente. Redirect URIs devem usar comparação exata. Refresh tokens, caso adotados, devem ter rotação e detecção de reutilização.

## 9. Verificação e rastreabilidade

- testes de integração: autenticação, tokens, validação, duplicidade, matriz RBAC e invariantes administrativas;
- testes de componentes: login, ações por perfil e conteúdo semelhante a HTML renderizado como texto;
- E2E: login e dashboard de administrador, operador e cliente, Swagger e resposta `403`;
- contrato executável: `/api/openapi.json` e `/api/docs`;
- coleção reproduzível: `docs/gestao-usuarios.postman_collection.json`;
- verificação local: `npm run verify`, `npm run test:e2e` e `npm audit`.
