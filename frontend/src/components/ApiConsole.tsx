import type { ApiLog } from "../types";

type Props = { logs: ApiLog[]; onClear: () => void };

export function ApiConsole({ logs, onClear }: Props) {
  return (
    <section className="panel console-panel" aria-labelledby="console-title">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Observabilidade</p>
          <h2 id="console-title">Console da API</h2>
        </div>
        <button className="button ghost small" type="button" onClick={onClear}>
          Limpar
        </button>
      </div>
      <div className="api-console" aria-live="polite">
        {logs.length === 0 ? (
          <p className="console-empty">As requisições desta sessão aparecerão aqui.</p>
        ) : (
          logs.map((log) => (
            <article className="console-entry" key={log.id}>
              <div className="console-line">
                <span className="console-time">{log.horario}</span>
                <strong data-method={log.metodo}>{log.metodo}</strong>
                <code>{log.endpoint}</code>
                <span
                  className={log.status >= 200 && log.status < 300 ? "status-ok" : "status-error"}
                >
                  {log.status || "ERR"}
                </span>
              </div>
              <pre>{JSON.stringify(log.resposta, null, 2)}</pre>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
