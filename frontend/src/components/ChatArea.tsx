"use client";

import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useChat } from "../context/ChatContext";
import ScrollContainer from "./ScrollContainer";
import MessageInk from "./MessageInk";
import QuillInput from "./QuillInput";

export default function ChatArea() {
  const { activeChatId, activeChat, createNewChat, addMessage } = useChat();
  const messages = activeChat?.messages || [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion() ?? true;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [messages.length, isLoading, shouldReduceMotion]);

  const handleSend = async (text: string) => {
    let chatId = activeChatId;
    if (!chatId) chatId = createNewChat();
    addMessage(chatId, { role: "user", content: text });
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          history: messages.slice(-10),
        }),
      });
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      addMessage(chatId, { role: "assistant", content: data.response });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      addMessage(chatId, {
        role: "assistant",
        content: "⚠️ El Oráculo no ha podido responder. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollContainer>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8 }}
              className="text-3xl md:text-4xl font-bold mb-4 ink-text"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              El Oráculo te escucha
            </motion.h1>
            <p
              className="text-lg max-w-md"
              style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-garamond)" }}
            >
              Pregunta sobre builds, items, enemigos o lugares de tu aventura.
            </p>
          </div>
        ) : (
          <div className="pt-4 pb-8">
            {messages.map((msg, idx) => (
              <MessageInk
                key={idx}
                role={msg.role}
                content={msg.content}
                index={idx}
              />
            ))}
            {isLoading && (
              <div
                className="flex items-center gap-2 my-4"
                style={{ color: "var(--color-ink-muted)" }}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${shouldReduceMotion ? "" : "animate-bounce"}`}
                  style={{ background: "var(--color-gold)" }}
                />
                <span
                  className={`inline-block w-2 h-2 rounded-full ${shouldReduceMotion ? "" : "animate-bounce"}`}
                  style={{ background: "var(--color-gold)", animationDelay: "0.15s" }}
                />
                <span
                  className={`inline-block w-2 h-2 rounded-full ${shouldReduceMotion ? "" : "animate-bounce"}`}
                  style={{ background: "var(--color-gold)", animationDelay: "0.3s" }}
                />
                <span
                  className="text-sm italic"
                  style={{ fontFamily: "var(--font-garamond)" }}
                >
                  El Oráculo escribe...
                </span>
              </div>
            )}
            {error && (
              <div
                className="p-3 rounded-md text-sm border"
                style={{
                  borderColor: "var(--color-wax)",
                  color: "var(--color-wax)",
                  background: "rgba(139,34,34,0.08)",
                }}
              >
                Error: {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollContainer>
      <QuillInput onSend={handleSend} disabled={isLoading} />
    </>
  );
}
