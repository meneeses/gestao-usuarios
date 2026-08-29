import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClient } from "./api";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/LoginPage";
import type { ApiLog, Usuario } from "./types";

const TOKEN_KEY = "sentinela.jwt";

export function App() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [validando, setValidando] = useState(Boolean(token));

  const registrarLog = useCallback((log: ApiLog) => {
    setLogs((atuais) => [log, ...atuais].slice(0, 80));
  }, []);

  const sair = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
    setValidando(false);
  }, []);

  const api = useMemo(() => new ApiClient(token, registrarLog, sair), [token, registrarLog, sair]);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    api.me().then((resultado) => {
      if (!ativo) return;
      if (resultado.ok) setUsuario(resultado.data.usuario);
      setValidando(false);
    });
    return () => {
      ativo = false;
    };
  }, [api, token]);

  function loginConcluido(novoToken: string) {
    sessionStorage.setItem(TOKEN_KEY, novoToken);
    setToken(novoToken);
    setValidando(true);
  }

  if (validando) {
    return (
      <main className="app-loading">
        <div className="loading-brand">S</div>
        <p>Validando sua sessão segura...</p>
      </main>
    );
  }

  if (!token || !usuario) {
    return <LoginPage api={api} onSuccess={loginConcluido} />;
  }

  return (
    <Dashboard
      api={api}
      usuario={usuario}
      logs={logs}
      onClearLogs={() => setLogs([])}
      onUsuarioChange={setUsuario}
      onLogout={sair}
    />
  );
}
