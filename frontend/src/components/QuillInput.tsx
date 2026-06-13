"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";

export default function QuillInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-10"
      style={{
        background:
          "linear-gradient(to top, var(--color-wood) 40%, transparent)",
      }}
    >
      <div className="max-w-[900px] mx-auto quill-input flex items-center gap-3 px-4 py-3">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-ink-muted)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Escribe tu pregunta al Oráculo..."
          aria-label="Escribe tu pregunta al Oráculo"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none resize-none text-base ink-text placeholder:text-[var(--color-ink-muted)]"
          style={{ fontFamily: "var(--font-garamond)" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="wax-seal-button w-10 h-10 flex items-center justify-center"
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
