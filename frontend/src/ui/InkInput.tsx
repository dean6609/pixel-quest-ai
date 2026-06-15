import { useRef, useState } from "react";

interface Props {
  onSubmit: (value: string) => void;
  disabled: boolean;
}

export function InkInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form
      className="ink-input"
      onSubmit={e => { e.preventDefault(); submit(); }}
    >
      <textarea
        ref={ref}
        className="ink-input__field"
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={disabled ? "el grimorio medita…" : "escribe tu consulta…"}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        aria-label="Consulta para el grimorio"
      />
      <button
        type="submit"
        className="ink-input__quill"
        disabled={disabled}
        aria-label="Enviar consulta"
        title="Enviar"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M21 3c-6 1-11 4-14 9l-2 6 6-2c5-3 8-8 9-14z M9 16l-3 1 1-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
