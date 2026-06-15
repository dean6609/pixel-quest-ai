import { useState, useEffect } from "react";

interface Props {
  reasoning: string;
  /** true once an answer has begun streaming, so reasoning can collapse */
  hasAnswer: boolean;
  thinking: boolean;
}

export function ReasoningStream({ reasoning, hasAnswer, thinking }: Props) {
  const [open, setOpen] = useState(true);

  // Auto-collapse once the answer arrives; auto-expand on a fresh thought.
  useEffect(() => {
    if (hasAnswer) setOpen(false);
    else if (thinking) setOpen(true);
  }, [hasAnswer, thinking]);

  if (!reasoning) return null;

  return (
    <aside className={`reasoning ${open ? "reasoning--open" : "reasoning--collapsed"}`}>
      <button
        className="reasoning__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={`reasoning__ember ${thinking ? "is-alive" : ""}`} aria-hidden="true" />
        {thinking ? "el grimorio reflexiona" : "su razonamiento"}
        <span className="reasoning__chevron" aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="reasoning__text" aria-live="polite">
          {reasoning}
          {thinking && <span className="reasoning__caret" aria-hidden="true" />}
        </div>
      )}
    </aside>
  );
}
