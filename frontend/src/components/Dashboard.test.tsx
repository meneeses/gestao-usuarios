import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../api";
import type { Usuario } from "../types";
import { Dashboard } from "./Dashboard";

describe("Dashboard", () => {
  it("renderiza dados não confiáveis como texto e restringe a área do cliente", () => {
    const usuario: Usuario = {
      id: 3,
      nome: '<img src=x onerror="alert(1)"> Cliente',
      email: "cliente@teste.com",
      perfil: "cliente",
      criadoEm: "2026-08-29T00:00:00.000Z",
      atualizadoEm: "2026-08-29T00:00:00.000Z",
    };
    render(
      <Dashboard
        api={{} as ApiClient}
        usuario={usuario}
        logs={[]}
        onClearLogs={vi.fn()}
        onUsuarioChange={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    expect(screen.getAllByText(usuario.nome).length).toBeGreaterThan(0);
    expect(document.querySelector('img[src="x"]')).not.toBeInTheDocument();
    expect(screen.queryByText("Usuários cadastrados")).not.toBeInTheDocument();
  });
});
