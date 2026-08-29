import { type FormEvent, useEffect, useRef, useState } from "react";
import { type ApiClient, mensagemErro } from "../api";
import type { Perfil, Usuario } from "../types";

type Props = {
  api: ApiClient;
  usuarioAtual: Usuario;
  usuario?: Usuario;
  onClose: () => void;
  onSaved: (usuario: Usuario, mensagem: string) => void;
};

export function UserModal({ api, usuarioAtual, usuario, onClose, onSaved }: Props) {
  const criando = !usuario;
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Perfil>(usuario?.perfil ?? "cliente");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const nomeInputRef = useRef<HTMLInputElement>(null);
  const podeAlterarPerfil = usuarioAtual.perfil === "administrador";

  useEffect(() => {
    nomeInputRef.current?.focus();
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [onClose]);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro("");
    setSalvando(true);
    const resultado = criando
      ? await api.criarUsuario({ nome, email, senha, perfil })
      : await api.atualizarUsuario(usuario.id, {
          nome,
          email,
          ...(podeAlterarPerfil ? { perfil } : {}),
        });
    setSalvando(false);
    if (resultado.ok) onSaved(resultado.data.usuario, resultado.data.mensagem);
    else setErro(mensagemErro(resultado.data));
  }

  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <p className="section-kicker">{criando ? "Novo acesso" : "Atualização"}</p>
            <h2 id="modal-title">{criando ? "Cadastrar usuário" : "Editar usuário"}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </div>
        {erro ? (
          <div className="alert error" role="alert">
            {erro}
          </div>
        ) : null}
        <form className="form-grid" onSubmit={salvar}>
          <label htmlFor="nome">Nome completo</label>
          <input
            id="nome"
            ref={nomeInputRef}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />
          <label htmlFor="user-email">E-mail</label>
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {criando ? (
            <>
              <label htmlFor="user-senha">Senha inicial</label>
              <input
                id="user-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                maxLength={72}
                required
              />
              <p className="field-help">Use maiúscula, minúscula e número.</p>
            </>
          ) : null}
          {podeAlterarPerfil ? (
            <>
              <label htmlFor="perfil">Perfil de acesso</label>
              <select
                id="perfil"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as Perfil)}
              >
                <option value="administrador">Administrador</option>
                <option value="operador">Operador</option>
                <option value="cliente">Cliente</option>
              </select>
            </>
          ) : null}
          <div className="modal-actions">
            <button className="button ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : criando ? "Criar usuário" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
