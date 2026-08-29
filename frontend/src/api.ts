import type { ApiErrorBody, ApiLog, Perfil, Usuario } from "./types";

type RequestResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: ApiErrorBody };
type LogHandler = (log: ApiLog) => void;

function respostaSegura(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  if ("token" in data) return { ...data, token: "[ocultado]" };
  return data;
}

async function request<T>(
  method: string,
  endpoint: string,
  body: unknown,
  token: string | null,
  onLog: LogHandler,
  onUnauthorized?: () => void,
): Promise<RequestResult<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = response.status === 204 ? null : await response.json();
    onLog({
      id: crypto.randomUUID(),
      horario: new Date().toLocaleTimeString("pt-BR"),
      metodo: method,
      endpoint: `/api${endpoint}`,
      status: response.status,
      resposta: respostaSegura(data),
    });
    if (response.status === 401 && token) onUnauthorized?.();
    return response.ok
      ? { ok: true, status: response.status, data: data as T }
      : { ok: false, status: response.status, data: data as ApiErrorBody };
  } catch {
    const data = { erro: { codigo: "CONEXAO", mensagem: "Não foi possível conectar à API" } };
    onLog({
      id: crypto.randomUUID(),
      horario: new Date().toLocaleTimeString("pt-BR"),
      metodo: method,
      endpoint: `/api${endpoint}`,
      status: 0,
      resposta: data,
    });
    return { ok: false, status: 0, data };
  }
}

export class ApiClient {
  constructor(
    private readonly token: string | null,
    private readonly onLog: LogHandler,
    private readonly onUnauthorized?: () => void,
  ) {}

  login(email: string, senha: string) {
    return request<{ token: string; tipo: "Bearer"; expiraEm: number; usuario: Usuario }>(
      "POST",
      "/auth/login",
      { email, senha },
      null,
      this.onLog,
    );
  }

  me() {
    return request<{ usuario: Usuario }>(
      "GET",
      "/auth/me",
      null,
      this.token,
      this.onLog,
      this.onUnauthorized,
    );
  }

  listarUsuarios() {
    return request<{ usuarios: Usuario[] }>(
      "GET",
      "/usuarios",
      null,
      this.token,
      this.onLog,
      this.onUnauthorized,
    );
  }

  criarUsuario(dados: { nome: string; email: string; senha: string; perfil: Perfil }) {
    return request<{ mensagem: string; usuario: Usuario }>(
      "POST",
      "/usuarios",
      dados,
      this.token,
      this.onLog,
      this.onUnauthorized,
    );
  }

  atualizarUsuario(id: number, dados: { nome: string; email: string; perfil?: Perfil }) {
    return request<{ mensagem: string; usuario: Usuario }>(
      "PUT",
      `/usuarios/${id}`,
      dados,
      this.token,
      this.onLog,
      this.onUnauthorized,
    );
  }

  excluirUsuario(id: number) {
    return request<null>(
      "DELETE",
      `/usuarios/${id}`,
      null,
      this.token,
      this.onLog,
      this.onUnauthorized,
    );
  }
}

export function mensagemErro(data: ApiErrorBody): string {
  const primeiraValidacao = data.erro?.campos ? Object.values(data.erro.campos)[0]?.[0] : undefined;
  return primeiraValidacao ?? data.erro?.mensagem ?? "A operação não pôde ser concluída";
}
