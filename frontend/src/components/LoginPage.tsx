import { type FormEvent, useState } from "react";
import { type ApiClient, mensagemErro } from "../api";

const demos = [
  { perfil: "Administrador", email: "admin@sistema.com", senha: "Admin@123", cor: "azul" },
  { perfil: "Operador", email: "operador@sistema.com", senha: "Operador@123", cor: "verde" },
  { perfil: "Cliente", email: "cliente@sistema.com", senha: "Cliente@123", cor: "violeta" },
] as const;

type Props = {
  api: ApiClient;
  onSuccess: (token: string) => void;
};

export function LoginPage({ api, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setErro("");
    setCarregando(true);
    const resultado = await api.login(email, senha);
    setCarregando(false);
    if (resultado.ok) onSuccess(resultado.data.token);
    else setErro(mensagemErro(resultado.data));
  }

  function escolherDemo(demo: (typeof demos)[number]) {
    setEmail(demo.email);
    setSenha(demo.senha);
    setErro("");
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="titulo-produto">
        <div className="brand-mark" aria-hidden="true">
          S
        </div>
        <p className="eyebrow">API REST • JWT • RBAC</p>
        <h1 id="titulo-produto">Segurança clara. Acesso sob controle.</h1>
        <p className="intro-copy">
          Uma demonstração completa de autenticação, autorização e gestão de usuários construída
          para tornar cada decisão de segurança visível.
        </p>
        <ul className="security-list" aria-label="Recursos de segurança">
          <li>JWT com expiração</li>
          <li>Senhas protegidas</li>
          <li>Três níveis de acesso</li>
        </ul>
      </section>

      <section className="login-panel" aria-labelledby="titulo-login">
        <div className="login-card">
          <div className="card-heading">
            <span className="status-dot" aria-hidden="true" />
            <span>Ambiente acadêmico</span>
          </div>
          <h2 id="titulo-login">Acesse o Sentinela</h2>
          <p>Entre com uma das contas de demonstração para explorar as permissões.</p>
          {erro ? (
            <div className="alert error" role="alert">
              {erro}
            </div>
          ) : null}
          <form onSubmit={entrar}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
            />
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
            />
            <button type="submit" disabled={carregando}>
              {carregando ? "Validando acesso..." : "Entrar no sistema"}
            </button>
          </form>
          <div className="demo-divider">
            <span>Contas para demonstração</span>
          </div>
          <div className="demo-grid">
            {demos.map((demo) => (
              <button
                className="demo-account"
                data-color={demo.cor}
                key={demo.email}
                type="button"
                onClick={() => escolherDemo(demo)}
              >
                <span className="avatar">{demo.perfil[0]}</span>
                <span>
                  <strong>{demo.perfil}</strong>
                  <small>{demo.email}</small>
                </span>
                <span className="demo-action">Usar</span>
              </button>
            ))}
          </div>
        </div>
        <p className="login-footnote">Projeto acadêmico • Dados armazenados localmente</p>
      </section>
    </main>
  );
}
