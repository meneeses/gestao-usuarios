const json = (schema: object) => ({ content: { "application/json": { schema } } });
const erro = { $ref: "#/components/schemas/Erro" };
const usuario = { $ref: "#/components/schemas/UsuarioPublico" };

export const openapiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Sentinela — API de Gestão de Usuários",
    version: "2.0.0",
    description: "API REST acadêmica com autenticação JWT, autorização RBAC e persistência SQLite.",
  },
  servers: [{ url: "http://localhost:3000", description: "Ambiente local" }],
  tags: [{ name: "Autenticação" }, { name: "Usuários" }, { name: "Infraestrutura" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT retornado pelo login",
      },
    },
    schemas: {
      Perfil: { type: "string", enum: ["administrador", "operador", "cliente"] },
      UsuarioPublico: {
        type: "object",
        additionalProperties: false,
        required: ["id", "nome", "email", "perfil", "criadoEm", "atualizadoEm"],
        properties: {
          id: { type: "integer", minimum: 1, example: 1 },
          nome: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            example: "Administrador do Sistema",
          },
          email: { type: "string", format: "email", example: "admin@sistema.com" },
          perfil: { $ref: "#/components/schemas/Perfil" },
          criadoEm: { type: "string", format: "date-time" },
          atualizadoEm: { type: "string", format: "date-time" },
        },
      },
      LoginEntrada: {
        type: "object",
        additionalProperties: false,
        required: ["email", "senha"],
        properties: {
          email: { type: "string", format: "email", maxLength: 254, example: "admin@sistema.com" },
          senha: { type: "string", format: "password", maxLength: 72, example: "Admin@123" },
        },
      },
      LoginResposta: {
        type: "object",
        additionalProperties: false,
        required: ["token", "tipo", "expiraEm", "usuario"],
        properties: {
          token: { type: "string", description: "JWT HS256" },
          tipo: { type: "string", const: "Bearer" },
          expiraEm: { type: "integer", const: 3600 },
          usuario,
        },
      },
      UsuarioCriacao: {
        type: "object",
        additionalProperties: false,
        required: ["nome", "email", "senha", "perfil"],
        properties: {
          nome: { type: "string", minLength: 2, maxLength: 100, example: "Maria Cliente" },
          email: { type: "string", format: "email", maxLength: 254, example: "maria@example.com" },
          senha: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
            example: "Senha@123",
          },
          perfil: { $ref: "#/components/schemas/Perfil" },
        },
      },
      UsuarioAtualizacao: {
        type: "object",
        additionalProperties: false,
        required: ["nome", "email"],
        properties: {
          nome: { type: "string", minLength: 2, maxLength: 100, example: "Maria Silva" },
          email: {
            type: "string",
            format: "email",
            maxLength: 254,
            example: "maria.silva@example.com",
          },
          perfil: {
            $ref: "#/components/schemas/Perfil",
            description: "Aceito apenas quando o solicitante é administrador",
          },
        },
      },
      RespostaUsuario: {
        type: "object",
        additionalProperties: false,
        required: ["mensagem", "usuario"],
        properties: { mensagem: { type: "string" }, usuario },
      },
      Erro: {
        type: "object",
        additionalProperties: false,
        required: ["erro"],
        properties: {
          erro: {
            type: "object",
            additionalProperties: false,
            required: ["codigo", "mensagem"],
            properties: {
              codigo: { type: "string", example: "ACESSO_NEGADO" },
              mensagem: { type: "string", example: "Seu perfil não permite esta operação" },
              campos: {
                type: "object",
                additionalProperties: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Infraestrutura"],
        summary: "Verifica a disponibilidade da API",
        responses: {
          "200": {
            description: "API disponível",
            ...json({
              type: "object",
              required: ["status", "servico", "versao"],
              properties: {
                status: { type: "string", const: "ok" },
                servico: { type: "string", const: "sentinela-api" },
                versao: { type: "string", example: "2.0.0" },
              },
            }),
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Autentica e emite um JWT válido por uma hora",
        requestBody: { required: true, ...json({ $ref: "#/components/schemas/LoginEntrada" }) },
        responses: {
          "200": {
            description: "Login realizado",
            ...json({ $ref: "#/components/schemas/LoginResposta" }),
          },
          "400": { description: "Formato inválido", ...json(erro) },
          "401": { description: "Credenciais inválidas", ...json(erro) },
          "429": { description: "Limite de tentativas excedido", ...json(erro) },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Autenticação"],
        summary: "Revalida e retorna o usuário da sessão",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Sessão válida",
            ...json({ type: "object", required: ["usuario"], properties: { usuario } }),
          },
          "401": { description: "Token ausente, inválido ou usuário excluído", ...json(erro) },
        },
      },
    },
    "/api/usuarios": {
      get: {
        tags: ["Usuários"],
        summary: "Lista usuários para administrador ou operador",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista retornada",
            ...json({
              type: "object",
              required: ["usuarios"],
              properties: { usuarios: { type: "array", items: usuario } },
            }),
          },
          "401": { description: "Não autenticado", ...json(erro) },
          "403": { description: "Perfil sem acesso", ...json(erro) },
        },
      },
      post: {
        tags: ["Usuários"],
        summary: "Cria usuário (administrador)",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, ...json({ $ref: "#/components/schemas/UsuarioCriacao" }) },
        responses: {
          "201": {
            description: "Usuário criado",
            ...json({ $ref: "#/components/schemas/RespostaUsuario" }),
          },
          "400": { description: "Dados inválidos", ...json(erro) },
          "401": { description: "Não autenticado", ...json(erro) },
          "403": { description: "Perfil sem acesso", ...json(erro) },
          "409": { description: "E-mail duplicado", ...json(erro) },
        },
      },
    },
    "/api/usuarios/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
      ],
      get: {
        tags: ["Usuários"],
        summary: "Consulta um usuário respeitando o acesso ao recurso",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Usuário retornado",
            ...json({ type: "object", required: ["usuario"], properties: { usuario } }),
          },
          "400": { description: "ID inválido", ...json(erro) },
          "401": { description: "Não autenticado", ...json(erro) },
          "403": { description: "Acesso negado", ...json(erro) },
          "404": { description: "Não encontrado", ...json(erro) },
        },
      },
      put: {
        tags: ["Usuários"],
        summary: "Atualiza nome, e-mail e, quando permitido, perfil",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          ...json({ $ref: "#/components/schemas/UsuarioAtualizacao" }),
        },
        responses: {
          "200": {
            description: "Usuário atualizado",
            ...json({ $ref: "#/components/schemas/RespostaUsuario" }),
          },
          "400": { description: "Dados inválidos", ...json(erro) },
          "401": { description: "Não autenticado", ...json(erro) },
          "403": { description: "Acesso negado ou invariante administrativa", ...json(erro) },
          "404": { description: "Não encontrado", ...json(erro) },
          "409": { description: "E-mail duplicado", ...json(erro) },
        },
      },
      delete: {
        tags: ["Usuários"],
        summary: "Exclui usuário (administrador)",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Usuário excluído, sem corpo" },
          "400": { description: "ID inválido", ...json(erro) },
          "401": { description: "Não autenticado", ...json(erro) },
          "403": {
            description: "Acesso negado, autoexclusão ou último administrador",
            ...json(erro),
          },
          "404": { description: "Não encontrado", ...json(erro) },
        },
      },
    },
  },
} as const;
