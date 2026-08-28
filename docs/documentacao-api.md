# Documentação da API - Sistema de Gestão de Usuários

Este documento apresenta a documentação completa da API REST para o Sistema de Gestão de Usuários, abordando modelagem, segurança, controle de acesso e análise de riscos.

## Parte 1 – Modelagem da API

A API segue os princípios RESTful, utilizando métodos HTTP padrão para operações CRUD (Create, Read, Update, Delete).

| Método | Endpoint | Finalidade | Perfis Autorizados | Código de Resposta |
|--------|----------|------------|--------------------|-----------|
| POST | `/api/auth/login` | Autenticar usuário e obter token JWT | Público (sem autenticação) | 200 OK |
| GET | `/api/usuarios` | Listar todos os usuários cadastrados | Administrador, Operador | 200 OK |
| GET | `/api/usuarios/:id` | Consultar um usuário específico | Admin, Operador, ou próprio Cliente | 200 OK |
| POST | `/api/usuarios` | Cadastrar novo usuário no sistema | Administrador | 201 Created |
| PUT | `/api/usuarios/:id` | Atualizar dados de um usuário | Admin, Operador, ou próprio Cliente | 200 OK |
| DELETE | `/api/usuarios/:id` | Excluir um usuário do sistema | Administrador | 204 No Content |

### Detalhamento dos Endpoints

#### 1. Autenticação (Login)
- **POST** `/api/auth/login`
- **Descrição:** Autentica um usuário com base em suas credenciais e retorna um token JWT para acesso aos endpoints protegidos.
- **Corpo da Requisição:**
  ```json
  {
    "email": "admin@sistema.com",
    "senha": "senha_super_secreta"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "mensagem": "Login realizado com sucesso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "nome": "Administrador do Sistema",
      "email": "admin@sistema.com",
      "perfil": "administrador"
    }
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`: Dados ausentes ou inválidos.
  - `401 Unauthorized`: Credenciais incorretas.

#### 2. Listar Usuários
- **GET** `/api/usuarios`
- **Descrição:** Retorna a lista de todos os usuários cadastrados no sistema. A senha não é incluída na resposta.
- **Resposta de Sucesso (200 OK):**
  ```json
  [
    {
      "id": 1,
      "nome": "Administrador",
      "email": "admin@sistema.com",
      "perfil": "administrador",
      "data_criacao": "2023-10-25T10:00:00Z"
    },
    {
      "id": 2,
      "nome": "João Operador",
      "email": "joao@sistema.com",
      "perfil": "operador",
      "data_criacao": "2023-10-25T10:15:00Z"
    }
  ]
  ```
- **Respostas de Erro:**
  - `401 Unauthorized`: Token ausente ou inválido.
  - `403 Forbidden`: Usuário não tem permissão de acesso.

#### 3. Consultar Usuário Específico
- **GET** `/api/usuarios/:id`
- **Descrição:** Retorna os detalhes de um usuário específico pelo seu ID.
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "id": 2,
    "nome": "João Operador",
    "email": "joao@sistema.com",
    "perfil": "operador",
    "data_criacao": "2023-10-25T10:15:00Z"
  }
  ```
- **Respostas de Erro:**
  - `401 Unauthorized`: Token ausente ou inválido.
  - `403 Forbidden`: Usuário não tem permissão para visualizar este registro.
  - `404 Not Found`: Usuário não encontrado.

#### 4. Cadastrar Usuário
- **POST** `/api/usuarios`
- **Descrição:** Cria um novo usuário no sistema. Apenas administradores têm acesso.
- **Corpo da Requisição:**
  ```json
  {
    "nome": "Maria Cliente",
    "email": "maria@cliente.com",
    "senha": "senha_segura123",
    "perfil": "cliente"
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "mensagem": "Usuário criado com sucesso",
    "usuario": {
      "id": 3,
      "nome": "Maria Cliente",
      "email": "maria@cliente.com",
      "perfil": "cliente"
    }
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`: Dados ausentes ou formato inválido (ex: senha muito fraca).
  - `401 Unauthorized`: Token ausente ou inválido.
  - `403 Forbidden`: Usuário não é administrador.
  - `409 Conflict`: E-mail já cadastrado.

#### 5. Atualizar Usuário
- **PUT** `/api/usuarios/:id`
- **Descrição:** Atualiza as informações de um usuário existente. Clientes só podem alterar seus próprios dados básicos.
- **Corpo da Requisição:**
  ```json
  {
    "nome": "Maria Silva Cliente",
    "email": "maria.silva@cliente.com",
    "perfil": "cliente"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "mensagem": "Usuário atualizado com sucesso",
    "usuario": {
      "id": 3,
      "nome": "Maria Silva Cliente",
      "email": "maria.silva@cliente.com",
      "perfil": "cliente"
    }
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`: Dados inválidos.
  - `401 Unauthorized`: Token ausente ou inválido.
  - `403 Forbidden`: Tentativa de alterar outro usuário (se for cliente) ou tentativa de elevar o próprio privilégio.
  - `404 Not Found`: Usuário não encontrado.
  - `409 Conflict`: E-mail já em uso por outro usuário.

#### 6. Excluir Usuário
- **DELETE** `/api/usuarios/:id`
- **Descrição:** Remove um usuário do banco de dados. Apenas administradores.
- **Resposta de Sucesso (204 No Content):** Sem corpo na resposta.
- **Respostas de Erro:**
  - `401 Unauthorized`: Token ausente ou inválido.
  - `403 Forbidden`: Usuário não é administrador ou tenta excluir o próprio usuário admin (prevenção de bloqueio).
  - `404 Not Found`: Usuário não encontrado.

---

## Parte 2 – Segurança com JWT

A API utiliza JSON Web Tokens (JWT) para garantir que apenas usuários autenticados possam acessar recursos protegidos, oferecendo uma comunicação sem estado (stateless) e segura.

### 1. Processo de Login
O processo inicia quando o usuário envia uma requisição `POST` para `/api/auth/login`, contendo seu `email` e `senha` formatados em JSON no corpo da requisição. O servidor recebe estes dados, consulta o banco de dados pelo e-mail informado e, caso encontre, verifica se a senha fornecida corresponde ao hash armazenado (utilizando a biblioteca `bcryptjs`).

### 2. Geração do Token
Após a validação bem-sucedida das credenciais, o servidor utiliza a biblioteca `jsonwebtoken` para assinar digitalmente um JWT. A assinatura emprega o algoritmo HS256 (HMAC com SHA-256) juntamente com uma chave secreta (`JWT_SECRET`) armazenada de forma segura nas variáveis de ambiente do servidor. O token gerado é então retornado ao cliente no corpo da resposta HTTP.

### 3. Informações Armazenadas no Token (Payload)
O payload do JWT não é criptografado, apenas codificado em Base64. Portanto, armazena apenas as informações estritamente necessárias para identificar e autorizar o usuário, sem incluir dados sensíveis como senhas. O payload contém:
- `id`: Identificador único do usuário no banco de dados.
- `nome`: Nome completo do usuário.
- `email`: Endereço de e-mail do usuário.
- `perfil`: Nível de permissão associado ao usuário (administrador, operador ou cliente).
- `iat` (Issued At): Timestamp (data/hora) indicando o momento em que o token foi emitido (gerado automaticamente pela biblioteca).
- `exp` (Expiration Time): Timestamp (data/hora) determinando a validade do token (gerado automaticamente).

### 4. Política de Expiração
A política de expiração define que o token é válido por **1 hora (3600 segundos)**.
- **Justificativa:** Este tempo oferece um excelente equilíbrio entre segurança e usabilidade (experiência do usuário). Tokens com tempo de vida muito curto (por exemplo, 15 minutos) obrigariam a implementação de um sistema de "Refresh Tokens", o que aumentaria consideravelmente a complexidade do projeto. Por outro lado, tokens com longa duração (como 24 horas ou mais) representam um risco de segurança significativo; caso um atacante intercepte um token, ele teria uma grande janela de tempo para explorar os recursos da API. A duração de uma hora permite que o usuário realize suas tarefas durante uma sessão de trabalho contínua de forma confortável, e, simultaneamente, minimiza o período em que o sistema ficaria vulnerável a um token comprometido.

### 5. Utilização do Token
Para realizar requisições a qualquer endpoint protegido da API, o cliente (aplicação front-end, mobile ou Insomnia/Postman) deve incluir o JWT válido no cabeçalho HTTP de cada solicitação, da seguinte forma:
```http
Authorization: Bearer <seu_token_jwt_aqui>
```

### Fluxo JWT (Diagrama Descritivo)
O fluxo de autenticação e autorização via JWT ocorre nos seguintes passos:
1. **Solicitação de Login:** O cliente (navegador/app) envia as credenciais (e-mail e senha) para `/api/auth/login`.
2. **Validação:** O servidor (API) verifica as credenciais no banco de dados.
3. **Geração:** Se válidas, o servidor cria e assina um JWT contendo os dados do usuário.
4. **Entrega:** O JWT é devolvido ao cliente na resposta da API.
5. **Armazenamento (Cliente):** O cliente guarda o JWT (ex: LocalStorage ou SessionStorage).
6. **Requisição Segura:** O cliente tenta acessar uma rota protegida (ex: `/api/usuarios`), enviando o JWT no header `Authorization: Bearer <token>`.
7. **Verificação (Middleware):** O servidor valida a assinatura e a expiração do token usando a chave secreta.
8. **Acesso Concedido/Negado:** Se o token for válido, a API processa o pedido e retorna os dados. Se for inválido ou expirado, retorna erro 401.

---

## Parte 3 – Controle de Acesso (RBAC)

A segurança baseada em funções (Role-Based Access Control - RBAC) é utilizada para restringir o acesso a recursos do sistema baseando-se no perfil atribuído ao usuário.

### 1. Três Perfis de Usuário
O sistema foi modelado para suportar três níveis hierárquicos de privilégios:
- **Administrador:** Possui acesso total e irrestrito. Tem permissão para criar novos usuários, consultar, atualizar os dados e excluir qualquer usuário cadastrado no sistema.
- **Operador:** Perfil de suporte ou backoffice. Tem nível de acesso intermediário, podendo consultar os dados de todos os usuários do sistema e realizar atualizações (correções de dados), mas não possui privilégios para criar novos usuários ou apagá-los do sistema.
- **Cliente:** Perfil de uso comum do sistema com acesso altamente restrito. O cliente apenas pode visualizar as informações do seu próprio perfil e editar os seus próprios dados básicos.

### 2. Matriz de Permissões

A tabela abaixo cruza as operações (endpoints) com os perfis do sistema, estabelecendo o que cada perfil pode realizar:

| Operação | Administrador | Operador | Cliente |
|----------|:---:|:---:|:---:|
| POST `/api/auth/login` | ✅ | ✅ | ✅ |
| GET `/api/usuarios` | ✅ | ✅ | ❌ |
| GET `/api/usuarios/:id` (outro) | ✅ | ✅ | ❌ |
| GET `/api/usuarios/:id` (próprio) | ✅ | ✅ | ✅ |
| POST `/api/usuarios` | ✅ | ❌ | ❌ |
| PUT `/api/usuarios/:id` (outro) | ✅ | ✅ | ❌ |
| PUT `/api/usuarios/:id` (próprio) | ✅ | ✅ | ✅* |
| DELETE `/api/usuarios/:id` | ✅ | ❌ | ❌ |

*(Nota: O perfil 'Cliente' pode atualizar apenas o próprio nome e e-mail; ele não tem permissão para alterar o próprio perfil para 'administrador', o que seria uma falha de segurança de elevação de privilégio).*

### 3. Implementação Técnica

O controle de acesso foi construído utilizando camadas de middlewares no Express.js, que interceptam as requisições antes de chegarem aos controladores (controllers).
- O primeiro middleware, chamado `auth.js`, atua como a porta de entrada. A sua função é unicamente verificar a presença, validade e decodificar o token JWT. Ele extrai os dados do usuário contidos no token (como id e perfil) e os anexa ao objeto de requisição (ex: `req.usuario`).
- O segundo middleware, `rbac.js`, recebe a requisição validada pelo passo anterior e aplica as regras de negócio de autorização. Ele verifica se a propriedade `req.usuario.perfil` possui permissão suficiente para o tipo de operação solicitada na rota. Algumas rotas utilizam RBAC ao nível do middleware para verificações globais (como "apenas administradores"). Outras rotas, que requerem lógicas granulares (como validar se um Cliente está acessando o seu "próprio id"), realizam verificações diretamente na camada do controller, comparando o ID requisitado (`req.params.id`) com o ID que está no token (`req.usuario.id`).

---

## Parte 4 – OAuth 2.0 (Integrações com Terceiros)

*(Nota: Esta seção apresenta um modelo teórico sobre como permitir que aplicações parceiras acessem os dados da API de forma segura, o que não faz parte do código atualmente implementado no projeto).*

### 1. Visão Geral do OAuth 2.0
OAuth 2.0 é um protocolo de autorização padrão da indústria que permite que aplicações de terceiros obtenham acesso limitado a recursos protegidos de um usuário em um servidor HTTP. O princípio central é delegar o acesso: a aplicação parceira acessa a API em nome do usuário, sem nunca ter conhecimento ou precisar manipular a senha daquele usuário.

### 2. Fluxo "Authorization Code"
Para aplicações web de parceiros (Server-Side), o fluxo mais seguro e recomendado é o "Authorization Code Flow". Se implementado na nossa API, funcionaria nos seguintes passos:
- **Passo 1:** A aplicação parceira (App do Parceiro) necessita dos dados do usuário. Ela redireciona o navegador do usuário para o servidor de autorização da nossa API (ex: `GET /oauth/authorize?client_id=PARCEIRO&response_type=code`).
- **Passo 2:** A nossa API pede ao usuário para fazer login (caso não esteja) e exibe uma tela de consentimento perguntando se ele autoriza o "App do Parceiro" a acessar seus dados. O usuário aprova.
- **Passo 3:** O nosso servidor de autorização redireciona o usuário de volta para o "App do Parceiro" enviando junto um código de autorização provisório (Authorization Code).
- **Passo 4:** O servidor do "App do Parceiro" pega esse código e, "por trás dos panos", faz uma requisição direta para a nossa API (`POST /oauth/token`), trocando este código, junto com um segredo do cliente (Client Secret), por um Access Token definitivo.
- **Passo 5:** O "App do Parceiro" agora usa este Access Token (via cabeçalho `Authorization: Bearer`) para consumir os endpoints da nossa API.
- **Passo 6:** A nossa API valida o Access Token e, se for válido e tiver as permissões corretas, devolve os recursos.

### 3. Concessão de Acesso (Scopes)
Durante o Passo 2, o usuário deve dar o seu consentimento explícito, determinando exatamente quais informações o parceiro pode acessar. Isso é gerido através de "Escopos" (Scopes). Por exemplo, um parceiro poderia solicitar o escopo `read:usuarios` (que apenas permite a leitura dos dados) em vez de um escopo mais abrangente como `write:usuarios`.

### 4. Utilização de Tokens
O token de acesso obtido (Access Token) funciona de maneira idêntica ao nosso JWT atual: deve ser enviado no cabeçalho `Authorization`. O OAuth também introduz o conceito de "Refresh Tokens", que são tokens de vida longa utilizados exclusivamente para obter novos Access Tokens quando os antigos expiram, tudo de forma transparente, sem que o usuário precise colocar suas credenciais novamente na tela de autorização.

### 5. Benefícios da Adoção do OAuth 2.0
- **Maior segurança:** As senhas dos usuários nunca, em momento algum, são fornecidas ou compartilhadas com as aplicações de terceiros.
- **Delegação e Controle:** O próprio usuário controla o acesso e decide, conscientemente, o que partilhar.
- **Revogação Simples:** O acesso a um token de um parceiro pode ser revogado remotamente (pelo usuário ou administrador), encerrando o acesso imediatamente, sem exigir a alteração da senha do usuário.
- **Princípio do Menor Privilégio:** A utilização de escopos (scopes) assegura que uma aplicação tem o acesso estritamente necessário para o seu propósito, e nada mais.
- **Padronização Global:** Por ser um padrão na indústria (utilizado por gigantes como Google, Facebook, Microsoft), facilita integrações de novos parceiros devido à familiaridade técnica.

---

## Parte 5 – Análise de Segurança

Uma arquitetura de software sólida deve ser projetada considerando potenciais ameaças. A tabela a seguir identifica cinco riscos de segurança comuns e descreve como o projeto os trata e mitiga.

| # | Risco | Descrição | Medida de Mitigação | Implementação no Projeto |
|---|-------|-----------|---------------------|--------------------------|
| 1 | Roubo de token JWT | Token interceptado em trânsito por um atacante pode ser reutilizado para personificar a sessão da vítima. | Utilizar conexão criptografada (HTTPS) em produção e garantir um curto tempo de validade do token. | Configuração de expiração do JWT para 1 hora. Recomenda-se forte adoção de certificados TLS (HTTPS) na camada do servidor/proxy na hospedagem final. |
| 2 | Senhas em texto puro | Armazenar senhas no banco de dados sem proteção, resultando no comprometimento em massa caso o banco vaze. | Aplicar um algoritmo de hash robusto, adicionando "salt" dinâmico às senhas antes do armazenamento. | Utilização da biblioteca `bcryptjs` configurada com 10 rounds de processamento de salt (custo computacional que atrasa ataques de força bruta). |
| 3 | Acesso indevido a endpoints | Usuários tentando interagir com rotas da API para as quais não possuem nível de acesso adequado (Broken Access Control). | Validação do nível do usuário no lado do servidor antes de cada acesso a dados sensíveis. | Desenvolvimento de um Middleware explícito (rbac.js) baseando a segurança na propriedade "perfil" do JWT extraído. |
| 4 | Injeção de SQL | Inserção de código SQL manipulado ou malicioso em campos de input, com a intenção de subverter a lógica do banco. | Utilização rigorosa de declarações preparadas (prepared statements) e parâmetros vinculados. | Acesso de dados via SQLite (`sql.js`), que, ao utilizar `?` e métodos com parâmetros vinculados (`prepare()`, `bind()`, `run()`), neutraliza SQL Injection nativamente. |
| 5 | Cross-Site Request Forgery (CSRF) | Ataque onde um site malicioso induz o navegador do usuário a realizar solicitações não autorizadas usando cookies de sessão ativos. | Troca do modelo de sessão baseado em cookies automáticos por tokens declarativos transmitidos no Header HTTP. | O projeto mitiga ataques CSRF diretamente pela escolha de enviar o Token JWT via header `Authorization`, pois o envio deste header exige código Javascript do cliente (não é automático). |
