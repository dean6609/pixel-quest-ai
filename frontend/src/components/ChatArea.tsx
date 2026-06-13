"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { marked } from "marked";
import { Send, Sparkles } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useStaggerScrollAnimation } from "../hooks/useScrollAnimation";
import ScrambleText from "./effects/ScrambleText";

// Configure marked to open external links in new tabs
marked.use({
  useNewRenderer: true,
  renderer: {
    link({ href, title, text }: any) {
      const titleAttr = title ? ` title="${title}"` : "";
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    },
  },
});

// Safely parse markdown synchronously (marked v13 parse() may return Promise)
function parseMarkdown(content: string): string {
  const result = marked.parse(content);
  return typeof result === "string" ? result : "";
}

// Sanitize content to remove tool call tags and other artifacts
function sanitizeContent(content: string): string {
  return content
    .replace(/<｜｜DSML｜｜tool_calls>[\s\S]*?<\/｜｜DSML｜｜tool_calls>/g, "")
    .replace(/<｜｜DSML｜｜invoke[^>]*>[\s\S]*?<\/｜｜DSML｜｜invoke>/g, "")
    .replace(/<｜｜DSML｜｜parameter[^>]*>[\s\S]*?<\/｜｜DSML｜｜parameter>/g, "")
    .replace(/\n{3,}/g, "\n\n")
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
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useStaggerScrollAnimation<HTMLDivElement>({
    stagger: 0.1,
    y: 20,
    duration: 0.6,
    triggerOnMount: true,
    mountDelay: 0.4,
  });

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
    <section className="relative flex flex-col h-[100svh] pt-[var(--site-header-height)] pb-32">
      {/* Chat Container */}
      <div className="grid-container flex-1 min-h-0">
        <div className="grid-layout flex-1 min-h-0">
          <div className="grid-span-12 lg:grid-span-8 lg:grid-start-3 relative flex flex-col min-h-0">
            {/* Watermark Background - desaparece al iniciar conversación */}
            <WatermarkBackground visible={!hasMessages} />

            <div
              className={`flex-1 overflow-y-auto overflow-x-hidden relative z-10 ${
                hasMessages ? "px-4 md:px-8" : ""
              }`}
              id="chat-container"
            >
              <div className="max-w-4xl mx-auto">
                {!hasMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 min-h-[50vh]">
                    <ScrambleText
                      as="h1"
                      text="Ethereal Oracle"
                      className="text-3xl sm:text-4xl font-bold mb-6"
                      triggerOnMount
                    />
                    <p
                      className="max-w-md mx-auto mb-8 leading-relaxed text-lg"
                      style={{ color: "var(--color-foreground-muted)" }}
                    >
                      Ask me about builds, items, stats, or where to find enemies in
                      your adventure.
                    </p>
                    <div
                      ref={suggestionsRef}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl"
                    >
                      {[
                        "¿Cuál es el mejor arco para empezar?",
                        "¿Qué drops tiene el Slime King?",
                        "Recomiéndame una build de daño T4",
                        "¿Para qué sirve el Valor Bonus?",
                      ].map((q, i) => (
                        <button
                          key={i}
                          data-animate
                          onClick={() => setInput(q)}
                          className="doppelrand-bubble text-left transition-all duration-200 group hover:border-white/20"
                        >
                          <div className="doppelrand-bubble-core p-4">
                            <p
                              className="text-base transition-colors duration-150 group-hover:text-[var(--color-foreground)]"
                              style={{ color: "var(--color-foreground-muted)" }}
                            >
                              {q}
                            </p>
                          </div>
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
                            <div className="doppelrand-bubble max-w-[80%]">
                              <div className="doppelrand-bubble-core p-4">
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
                              <div className="glass-panel w-10 h-10 shrink-0 rounded-full items-center justify-center relative overflow-hidden hidden md:flex">
                                <Sparkles
                                  size={20}
                                  style={{ color: "var(--color-brand)" }}
                                />
                              </div>
                              <div className="doppelrand-bubble flex-1 min-w-0">
                                <div className="doppelrand-bubble-core p-5 relative overflow-hidden">
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
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pt-10 pb-4 md:pb-8 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, var(--color-background) 60%, transparent)",
        }}
      >
        <div className="grid-container pointer-events-auto">
          <div className="grid-layout">
            <div className="grid-span-12 lg:grid-span-8 lg:grid-start-3">
              <form
                onSubmit={handleSubmit}
                className="doppelrand-shell flex items-center gap-2 relative"
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
                  className="group btn-press flex items-center gap-2 pl-4 pr-2 py-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  style={{
                    background: "transparent",
                    border: "none",
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
                    <Send size={16} style={{ color: "var(--color-brand)" }} />
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
        </div>
      </div>
    </section>
  );
}
