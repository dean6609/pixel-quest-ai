import { useMemo } from "react";
import type { Conversation } from "../lib/types";
import { listConversations, deleteConversation } from "../lib/history";

interface Props {
  open: boolean;
  /** bump to force a re-read of localStorage (e.g. after a new save) */
  revision: number;
  onSelect: (c: Conversation) => void;
  onClose: () => void;
  onChanged: () => void;
}

function whenLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function HistoryDrawer({ open, revision, onSelect, onClose, onChanged }: Props) {
  const items = useMemo(() => listConversations(), [revision, open]);

  return (
    <div className={`drawer ${open ? "drawer--open" : ""}`} aria-hidden={!open}>
      <div className="drawer__veil" onClick={onClose} />
      <nav className="drawer__panel" aria-label="Conversaciones pasadas">
        <header className="drawer__head">
          <h2 className="drawer__title">Tomos anteriores</h2>
          <button className="drawer__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        {items.length === 0 ? (
          <p className="drawer__empty">Aún no hay páginas escritas.</p>
        ) : (
          <ul className="drawer__list">
            {items.map(c => (
              <li key={c.id} className="drawer__item">
                <button className="drawer__open" onClick={() => onSelect(c)}>
                  <span className="drawer__item-title">{c.title || "Sin título"}</span>
                  <span className="drawer__item-when">{whenLabel(c.createdAt)}</span>
                </button>
                <button
                  className="drawer__erase"
                  aria-label="Borrar conversación"
                  title="Borrar"
                  onClick={() => { deleteConversation(c.id); onChanged(); }}
                >🜂</button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}
