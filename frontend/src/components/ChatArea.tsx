"use client";

import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import { useChat } from "../context/ChatContext";

// Safely parse markdown synchronously (marked v13 parse() may return Promise)
function parseMarkdown(content: string): string {
  const result = marked.parse(content);
  return typeof result === "string" ? result : "";
}

// Sanitize content to remove tool call tags and other problematic content
function sanitizeContent(content: string): string {
  // Remove tool call tags like <｜｜DSML｜｜tool_calls>...</｜｜DSML｜｜tool_calls>
  // and <｜｜DSML｜｜invoke>...</｜｜DSML｜｜invoke> etc.
  return content
    .replace(/<｜｜DSML｜｜tool_calls>[\s\S]*?<\/｜｜DSML｜｜tool_calls>/g, '')
    .replace(/<｜｜DSML｜｜invoke[^>]*>[\s\S]*?<\/｜｜DSML｜｜invoke>/g, '')
    .replace(/<｜｜DSML｜｜parameter[^>]*>[\s\S]*?<\/｜｜DSML｜｜parameter>/g, '')
    .trim();
}

// Animated watermark letters background
function WatermarkBackground({ visible }: { visible: boolean }) {
  const letters = "Pixel Quest".split("");

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      style={{
        zIndex: 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease-out",
      }}
    >
      <div className="flex" style={{ gap: "0.25rem" }}>
        {letters.map((letter, index) => (
          <span
            key={index}
            className="goodfella-letter-animated"
            style={{
              fontSize: "clamp(6rem, 18vw, 14rem)",
              fontWeight: 800,
              color: "var(--color-foreground-muted)",
              opacity: 0.06,
              fontFamily: "var(--font-sans)",
              animationDelay: `${index * 80}ms`,
              lineHeight: 1,
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ChatArea() {
  const { activeChatId, activeChat, createNewChat, addMessage } = useChat();
  const messages = activeChat?.messages || [];

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    let currentChatId = activeChatId;
    if (!currentChatId) {
      currentChatId = createNewChat();
    }

    addMessage(currentChatId, { role: "user", content: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage,
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error("Error de red");
      const data = await response.json();

      addMessage(currentChatId, {
        role: "assistant",
        content: data.response,
      });
    } catch (error) {
      console.error(error);
      addMessage(currentChatId, {
        role: "assistant",
        content:
          "⚠️ The Oracle encountered a disturbance in the magical weave. Try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <section className="relative flex flex-col h-[100svh] pt-24 pb-32">
      {/* Watermark Background - desaparece al iniciar conversación */}
      <WatermarkBackground visible={!hasMessages} />

      {/* Chat Container - solo aqui hace scroll */}
      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden relative z-10 ${
          hasMessages ? "px-4 md:px-8" : ""
        }`}
        id="chat-container"
      >
        <div className="max-w-4xl mx-auto">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 min-h-[50vh]">
              <p
                className="max-w-md mx-auto mb-8 leading-relaxed text-lg"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                Ask me about builds, items, stats, or where to find enemies in
                your adventure.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  "¿Cuál es el mejor arco para empezar?",
                  "¿Qué drops tiene el Slime King?",
                  "Recomiéndame una build de daño T4",
                  "¿Para qué sirve el Valor Bonus?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-left transition-all duration-200 group"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      backdropFilter: "blur(1rem)",
                      padding: "1rem",
                      borderRadius: "1.5rem",
                      border: "1px solid var(--color-border)",
                      animationDelay: `${i * 40}ms`,
                      animationFillMode: "both",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.2)";
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.04)";
                    }}
                  >
                    <p
                      className="text-base transition-colors duration-150"
                      style={{ color: "var(--color-foreground-muted)" }}
                    >
                      {q}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${idx * 30}ms`,
                    animationFillMode: "both",
                  }}
                >
                  {msg.role === "user" ? (
                    <div className="flex flex-col items-end">
                      <div
                        className="max-w-[80%]"
                        style={{
                          background: "rgba(255, 255, 255, 0.02)",
                          padding: "3px",
                          borderRadius: "1.5rem",
                          border: "1px solid var(--color-border)",
                          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        <div
                          style={{
                            background: "var(--color-background-muted)",
                            borderRadius: "calc(1.5rem - 3px)",
                            padding: "1rem",
                          }}
                        >
                          <p
                            className="whitespace-pre-wrap leading-relaxed text-base"
                            style={{ color: "var(--color-foreground)" }}
                          >
                            {msg.content}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs mt-1 mr-1 uppercase tracking-wider"
                        style={{ color: "var(--color-foreground-muted)" }}
                      >
                        Adventurer
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start">
                      <div className="flex gap-4 items-start w-full max-w-3xl">
                        <div
                          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center relative overflow-hidden hidden md:flex"
                          style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid var(--color-border)",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                          }}
                        >
                          <span
                            className="text-xl relative z-10"
                            style={{ color: "var(--color-brand)" }}
                          >
                            ✦
                          </span>
                        </div>
                        <div
                          className="flex-1 min-w-0"
                          style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            padding: "3px",
                            borderRadius: "1.5rem",
                            border: "1px solid var(--color-border)",
                            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
                          }}
                        >
                          <div
                            style={{
                              background: "var(--color-background-muted)",
                              borderRadius: "calc(1.5rem - 3px)",
                              padding: "1.25rem",
                            }}
                            className="relative overflow-hidden"
                          >
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: "rgba(255, 255, 255, 0.02)",
                              }}
                            />
                            <div
                              className="leading-relaxed relative z-10 prose prose-invert max-w-none text-base"
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdown(sanitizeContent(msg.content)),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <span
                        className="text-xs mt-1 ml-0 md:ml-14 uppercase tracking-wider"
                        style={{ color: "var(--color-foreground-muted)" }}
                      >
                        Oracle
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 items-center ml-0 md:ml-14">
                  <div className="flex gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "var(--color-foreground-muted)" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        background: "var(--color-foreground-muted)",
                        animationDelay: "-0.15s",
                      }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        background: "var(--color-foreground-muted)",
                        animationDelay: "-0.3s",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--color-foreground-muted)" }}
                  >
                    Oracle is manifesting an answer...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pt-10 pb-4 md:pb-8"
        style={{
          background:
            "linear-gradient(to top, var(--color-background) 60%, transparent)",
        }}
      >
        <div className="max-w-[800px] mx-auto px-4 md:px-8">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 relative"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              padding: "6px",
              borderRadius: "9999px",
              border: "1px solid var(--color-border)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Whisper to the Oracle..."
              className="flex-grow bg-transparent border-none focus:ring-0 text-base resize-none py-3 px-4 outline-none"
              style={{ color: "var(--color-foreground)" }}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(
                  target.scrollHeight,
                  120
                )}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{
                background: "transparent",
                border: "none",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.opacity = "0.8";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <span
                className="hidden md:inline font-bold text-sm"
                style={{ color: "var(--color-brand)" }}
              >
                Cast
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                style={{ background: "rgba(255, 255, 255, 0.05)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--color-brand)" }}
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </button>
          </form>
          <p
            className="text-center text-xs mt-3"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            The Oracle&apos;s visions may be imperfect. Always verify in the
            Realm.
          </p>
        </div>
      </div>
    </section>
  );
}
