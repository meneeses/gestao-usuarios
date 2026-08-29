import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../api";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("preenche uma conta demo e autentica", async () => {
    const login = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, data: { token: "jwt-teste" } });
    render(<LoginPage api={{ login } as unknown as ApiClient} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Operador/i }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("operador@sistema.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("Operador@123");
    fireEvent.click(screen.getByRole("button", { name: "Entrar no sistema" }));
    expect(login).toHaveBeenCalledWith("operador@sistema.com", "Operador@123");
  });
});
