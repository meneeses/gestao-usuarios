import { z } from "zod";

export const perfilSchema = z.enum(["administrador", "operador", "cliente"]);

const nomeSchema = z.string().trim().min(2).max(100);
const emailSchema = z
  .email()
  .max(254)
  .transform((email) => email.trim().toLowerCase());
const senhaSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, "A senha deve conter uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter um número");

export const loginSchema = z
  .object({ email: emailSchema, senha: z.string().min(1).max(72) })
  .strict();

export const criarUsuarioSchema = z
  .object({ nome: nomeSchema, email: emailSchema, senha: senhaSchema, perfil: perfilSchema })
  .strict();

export const atualizarUsuarioSchema = z
  .object({ nome: nomeSchema, email: emailSchema, perfil: perfilSchema.optional() })
  .strict();

export const idSchema = z.coerce.number().int().positive();
