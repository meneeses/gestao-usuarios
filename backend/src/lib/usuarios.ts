import type { Perfil, Usuario } from "../generated/prisma/client.js";

export type UsuarioPublico = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  criadoEm: string;
  atualizadoEm: string;
};

export function usuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    criadoEm: usuario.criadoEm.toISOString(),
    atualizadoEm: usuario.atualizadoEm.toISOString(),
  };
}
