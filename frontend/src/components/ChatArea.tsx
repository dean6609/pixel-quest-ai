"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, AlertCircle, Bot } from 'lucide-react';
import { marked } from 'marked';
import { useChat } from '../context/ChatContext';

export default function ChatArea() {
  const { activeChatId, activeChat, createNewChat, addMessage } = useChat();
  const messages = activeChat?.messages || [];
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    let currentChatId = activeChatId;
    if (!currentChatId) {
      currentChatId = createNewChat();
    }

    // Add user message to UI
    addMessage(currentChatId, { role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      if (!response.ok) throw new Error('Error de red');
      const data = await response.json();

      addMessage(currentChatId, { role: 'assistant', content: data.response });
    } catch (error) {
      console.error(error);
      addMessage(currentChatId, { role: 'assistant', content: '⚠️ Ocurrió un error al conectar con el Oráculo.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative max-w-4xl mx-auto w-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-medium text-foreground mb-2">¿En qué puedo ayudarte hoy?</h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Soy el Oráculo del Wiki de Pixel Quest. Pregúntame sobre builds, ítems, stats o dónde encontrar ciertos enemigos.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                "¿Cuál es el mejor arco para empezar?",
                "¿Qué drops tiene el Slime King?",
                "Recomiéndame una build de daño T4",
                "¿Para qué sirve el Valor Bonus?"
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-left px-4 py-3 bg-secondary/50 hover:bg-secondary border border-border rounded-xl text-sm transition-colors text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-secondary text-foreground'
                    : 'bg-transparent text-foreground prose dark:prose-invert prose-sm md:prose-base'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} />
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
            <div className="bg-transparent px-5 py-4 rounded-2xl flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <form
          onSubmit={handleSubmit}
          className="relative max-w-3xl mx-auto flex items-end gap-2 bg-secondary/80 focus-within:bg-secondary rounded-3xl border border-border px-4 py-3 shadow-sm transition-colors"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Pregúntale al Oráculo..."
            className="flex-1 bg-transparent border-0 outline-none resize-none max-h-32 min-h-[24px] py-1 text-foreground placeholder:text-muted-foreground"
            rows={1}
            style={{
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-3 pb-2">
          La IA puede cometer errores. Verifica siempre en el juego.
        </p>
      </div>
    </div>
  );
}
