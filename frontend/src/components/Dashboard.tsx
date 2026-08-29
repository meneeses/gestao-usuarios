import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { type ApiClient, mensagemErro } from "../api";
import type { ApiLog, Perfil, Usuario } from "../types";
import { ApiConsole } from "./ApiConsole";
import { DeleteDialog } from "./DeleteDialog";
import { UserModal } from "./UserModal";

const nomesPerfil: Record<Perfil, string> = {
  administrador: "Administrador",
  operador: "Operador",
  cliente: "Cliente",
};

type Props = {
  api: ApiClient;
  usuario: Usuario;
  logs: ApiLog[];
  onClearLogs: () => void;
  onUsuarioChange: (usuario: Usuario) => void;
  onLogout: () => void;
};

export function Dashboard({ api, usuario, logs, onClearLogs, onUsuarioChange, onLogout }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(usuario.perfil !== "cliente");
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  const [modal, setModal] = useState<{ usuario?: Usuario } | null>(null);
  const [excluir, setExcluir] = useState<Usuario | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (usuario.perfil === "cliente") return;
    let ativo = true;
    api.listarUsuarios().then((resultado) => {
      if (!ativo) return;
      setCarregando(false);
      if (resultado.ok) setUsuarios(resultado.data.usuarios);
      else setErro(mensagemErro(resultado.data));
    });
    return () => {
      ativo = false;
    };
  }, [api, usuario.perfil]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const usuariosFiltrados = useMemo(() => {
    const termo = buscaAdiada.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter((item) =>
      `${item.nome} ${item.email} ${item.perfil}`.toLowerCase().includes(termo),
    );
  }, [buscaAdiada, usuarios]);

  const totais = useMemo(() => {
    const base = { total: usuarios.length, administrador: 0, operador: 0, cliente: 0 };
    for (const item of usuarios) base[item.perfil] += 1;
    return base;
  }, [usuarios]);

  function podeEditar(alvo: Usuario) {
    if (usuario.perfil === "administrador") return true;
    if (usuario.perfil === "operador") return alvo.perfil !== "administrador";
    return usuario.id === alvo.id;
  }

  function usuarioSalvo(atualizado: Usuario, mensagem: string) {
    setUsuarios((atuais) => {
      const existe = atuais.some((item) => item.id === atualizado.id);
      return existe
        ? atuais.map((item) => (item.id === atualizado.id ? atualizado : item))
        : [...atuais, atualizado];
    });
    if (atualizado.id === usuario.id) onUsuarioChange(atualizado);
    setModal(null);
    setToast(mensagem);
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    setExcluindo(true);
    const resultado = await api.excluirUsuario(excluir.id);
    setExcluindo(false);
    if (resultado.ok) {
      setUsuarios((atuais) => atuais.filter((item) => item.id !== excluir.id));
      setExcluir(null);
      setToast("Usuário excluído com sucesso");
    } else {
      setErro(mensagemErro(resultado.data));
      setExcluir(null);
    }
  }

  const primeiroNome = usuario.nome.split(" ")[0];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark compact">S</div>
          <div>
            <strong>Sentinela</strong>
            <span>Gestão segura</span>
          </div>
        </div>
        <nav aria-label="Navegação principal">
          <a className="nav-item active" href="#visao-geral">
            <span aria-hidden="true">⌂</span>Visão geral
          </a>
          {usuario.perfil !== "cliente" ? (
            <a className="nav-item" href="#usuarios">
              <span aria-hidden="true">◎</span>Usuários
            </a>
          ) : null}
          <a className="nav-item" href="#console">
            <span aria-hidden="true">›_</span>Console da API
          </a>
          <a className="nav-item" href="/api/docs" target="_blank" rel="noreferrer">
            <span aria-hidden="true">↗</span>Swagger
          </a>
        </nav>
        <div className="security-note">
          <span className="pulse-dot" />
          <div>
            <strong>Sessão protegida</strong>
            <small>JWT válido por 1 hora</small>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="section-kicker">Painel de controle</p>
            <h1>Olá, {primeiroNome}</h1>
          </div>
          <div className="topbar-user">
            <div className="user-avatar">{usuario.nome.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{usuario.nome}</strong>
              <span>{nomesPerfil[usuario.perfil]}</span>
            </div>
            <button className="button ghost small" type="button" onClick={onLogout}>
              Sair
            </button>
          </div>
        </header>

        <div className="dashboard-content" id="visao-geral">
          {erro ? (
            <div className="alert error dismissible" role="alert">
              <span>{erro}</span>
              <button type="button" onClick={() => setErro("")} aria-label="Fechar alerta">
                ×
              </button>
            </div>
          ) : null}
          {toast ? (
            <div className="toast" role="status">
              <span>✓</span>
              {toast}
            </div>
          ) : null}

          <section className="welcome-panel">
            <div>
              <p className="section-kicker light">Controle de acesso ativo</p>
              <h2>
                {usuario.perfil === "cliente"
                  ? "Seu perfil, seus dados."
                  : "Usuários e permissões em um só lugar."}
              </h2>
              <p>
                {usuario.perfil === "administrador"
                  ? "Você possui acesso total para criar, editar e excluir usuários."
                  : usuario.perfil === "operador"
                    ? "Você pode consultar usuários e editar dados não administrativos."
                    : "Você pode consultar e atualizar somente os seus próprios dados."}
              </p>
            </div>
            <div className="role-card">
              <span>Perfil atual</span>
              <strong>{nomesPerfil[usuario.perfil]}</strong>
              <small>ID #{usuario.id}</small>
            </div>
          </section>

          {usuario.perfil !== "cliente" ? (
            <section className="stats-grid" aria-label="Resumo de usuários">
              <article className="stat-card">
                <span className="stat-icon blue">◎</span>
                <div>
                  <small>Total de usuários</small>
                  <strong>{totais.total}</strong>
                  <em>Cadastros ativos</em>
                </div>
              </article>
              <article className="stat-card">
                <span className="stat-icon red">A</span>
                <div>
                  <small>Administradores</small>
                  <strong>{totais.administrador}</strong>
                  <em>Acesso total</em>
                </div>
              </article>
              <article className="stat-card">
                <span className="stat-icon gold">O</span>
                <div>
                  <small>Operadores</small>
                  <strong>{totais.operador}</strong>
                  <em>Acesso intermediário</em>
                </div>
              </article>
              <article className="stat-card">
                <span className="stat-icon violet">C</span>
                <div>
                  <small>Clientes</small>
                  <strong>{totais.cliente}</strong>
                  <em>Acesso próprio</em>
                </div>
              </article>
            </section>
          ) : null}

          <section className="panel profile-panel" aria-labelledby="profile-title">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Identidade autenticada</p>
                <h2 id="profile-title">Meu perfil</h2>
              </div>
              <button
                className="button secondary"
                type="button"
                onClick={() => setModal({ usuario })}
              >
                Editar meus dados
              </button>
            </div>
            <div className="profile-grid">
              <div>
                <span>Nome completo</span>
                <strong>{usuario.nome}</strong>
              </div>
              <div>
                <span>E-mail</span>
                <strong>{usuario.email}</strong>
              </div>
              <div>
                <span>Perfil RBAC</span>
                <span className={`role-badge ${usuario.perfil}`}>
                  {nomesPerfil[usuario.perfil]}
                </span>
              </div>
              <div>
                <span>Criado em</span>
                <strong>{new Date(usuario.criadoEm).toLocaleDateString("pt-BR")}</strong>
              </div>
            </div>
          </section>

          {usuario.perfil !== "cliente" ? (
            <section className="panel users-panel" id="usuarios" aria-labelledby="users-title">
              <div className="panel-heading users-heading">
                <div>
                  <p className="section-kicker">Diretório</p>
                  <h2 id="users-title">Usuários cadastrados</h2>
                </div>
                <div className="table-actions">
                  <label className="search-box">
                    <span className="sr-only">Buscar usuários</span>
                    <span aria-hidden="true">⌕</span>
                    <input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar nome, e-mail ou perfil"
                    />
                  </label>
                  {usuario.perfil === "administrador" ? (
                    <button className="button primary" type="button" onClick={() => setModal({})}>
                      + Novo usuário
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Perfil</th>
                      <th>Criado em</th>
                      <th>
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="loading-state">Carregando usuários...</div>
                        </td>
                      </tr>
                    ) : usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="empty-state">Nenhum usuário encontrado.</div>
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="table-user">
                              <span>{item.nome.slice(0, 2).toUpperCase()}</span>
                              <div>
                                <strong>{item.nome}</strong>
                                <small>{item.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${item.perfil}`}>
                              {nomesPerfil[item.perfil]}
                            </span>
                          </td>
                          <td>{new Date(item.criadoEm).toLocaleDateString("pt-BR")}</td>
                          <td>
                            <div className="row-actions">
                              {podeEditar(item) ? (
                                <button
                                  className="text-button"
                                  type="button"
                                  onClick={() => setModal({ usuario: item })}
                                >
                                  Editar
                                </button>
                              ) : null}
                              {usuario.perfil === "administrador" && item.id !== usuario.id ? (
                                <button
                                  className="text-button danger-text"
                                  type="button"
                                  onClick={() => setExcluir(item)}
                                >
                                  Excluir
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <div id="console">
            <ApiConsole logs={logs} onClear={onClearLogs} />
          </div>
        </div>
      </main>

      {modal ? (
        <UserModal
          api={api}
          usuarioAtual={usuario}
          {...(modal.usuario ? { usuario: modal.usuario } : {})}
          onClose={() => setModal(null)}
          onSaved={usuarioSalvo}
        />
      ) : null}
      {excluir ? (
        <DeleteDialog
          usuario={excluir}
          excluindo={excluindo}
          onCancel={() => setExcluir(null)}
          onConfirm={confirmarExclusao}
        />
      ) : null}
    </div>
  );
}
