import { useEffect } from "react";
import type { Usuario } from "../types";

type Props = { usuario: Usuario; excluindo: boolean; onCancel: () => void; onConfirm: () => void };

export function DeleteDialog({ usuario, excluindo, onCancel, onConfirm }: Props) {
  useEffect(() => {
    function fechar(event: KeyboardEvent) {
      if (event.key === "Escape" && !excluindo) onCancel();
    }
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [excluindo, onCancel]);

  return (
    <div className="modal-backdrop">
      <section
        className="modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
      >
        <div className="danger-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="delete-title">Excluir usuário?</h2>
        <p id="delete-description">
          A conta de <strong>{usuario.nome}</strong> será removida permanentemente. Essa ação não
          pode ser desfeita.
        </p>
        <div className="modal-actions">
          <button className="button ghost" type="button" onClick={onCancel} disabled={excluindo}>
            Cancelar
          </button>
          <button className="button danger" type="button" onClick={onConfirm} disabled={excluindo}>
            {excluindo ? "Excluindo..." : "Excluir definitivamente"}
          </button>
        </div>
      </section>
    </div>
  );
}
