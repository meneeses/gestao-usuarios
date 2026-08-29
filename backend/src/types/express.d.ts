import type { Usuario } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}
