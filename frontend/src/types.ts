export type Perfil = "administrador" | "operador" | "cliente";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  criadoEm: string;
  atualizadoEm: string;
};

export type ApiLog = {
  id: string;
  horario: string;
  metodo: string;
  endpoint: string;
  status: number;
  resposta: unknown;
};

export type ApiErrorBody = {
  erro?: {
    codigo?: string;
    mensagem?: string;
    campos?: Record<string, string[]>;
  };
};
