"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useChat } from "../context/ChatContext";

export default function HistoryPopup({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const { chats, activeChatId, setActiveChatId, createNewChat, clearAllChats } = useChat();
  const shouldReduceMotion = useReducedMotion() ?? true;
  const panelRef = useRef<HTMLDivElement>(null);

  const formatDate = (ts: number) =>
    new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ts));

  useEffect(() => {
    if (!open) {
      triggerRef?.current?.focus();
      return;
    }
    const timer = setTimeout(() => panelRef.current?.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, triggerRef]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -10 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
            className="fixed top-24 right-6 z-40 w-80 parchment parchment-edge rounded-lg p-4 outline-none"
          >
            <h3
              className="text-lg font-bold mb-3 ink-text"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              Memorias del Oráculo
            </h3>

            <button
              onClick={() => {
                createNewChat();
                onClose();
              }}
              className="w-full mb-3 py-2 px-3 rounded-md text-sm transition-colors"
              style={{
                fontFamily: "var(--font-cinzel)",
                background: "var(--color-gold)",
                color: "var(--color-wood)",
              }}
            >
              Nueva sesión
            </button>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {chats.length === 0 && (
                <p className="text-sm italic" style={{ color: "var(--color-ink-muted)" }}>
                  El Oráculo aún no guarda memorias.
                </p>
              )}
              {chats.map((chat) => {
                const firstUser = chat.messages.find((m) => m.role === "user");
                const title = firstUser
                  ? firstUser.content.slice(0, 36) + "..."
                  : `Sesión ${chat.id.slice(0, 6)}`;
                const isActive = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-md border transition-all text-sm ${
                      isActive
                        ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
                        : "border-[var(--color-parchment-edge)] hover:bg-black/5"
                    }`}
                  >
                    <div className="font-medium ink-text truncate">{title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>
                      {formatDate(chat.updatedAt)}
                    </div>
                  </button>
                );
              })}
            </div>

            {chats.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("¿Borrar todas las memorias?")) {
                    clearAllChats();
                    onClose();
                  }
                }}
                className="w-full mt-3 py-2 px-3 rounded-md text-xs border transition-colors"
                style={{
                  fontFamily: "var(--font-cinzel)",
                  borderColor: "var(--color-wax)",
                  color: "var(--color-wax)",
                }}
              >
                Purga de memorias
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
