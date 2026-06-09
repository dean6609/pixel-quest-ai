"use client";

import React, { useState, useRef, useEffect } from 'react';
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

    addMessage(currentChatId, { role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error('Error de red');
      const data = await response.json();

      addMessage(currentChatId, { role: 'assistant', content: data.response });
    } catch (error) {
      console.error(error);
      addMessage(currentChatId, { role: 'assistant', content: '⚠️ The Oracle encountered a disturbance in the magical weave. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex-grow flex flex-col px-md md:px-lg pb-32 overflow-hidden h-full">
      <div className="flex-grow overflow-y-auto space-y-xl py-lg pr-md w-full" id="chat-container">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in zoom-in-[0.97] duration-[400ms] ease-[var(--ease-out)] min-h-[50vh]">
            <div className="w-24 h-24 mb-6 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
              <span className="material-symbols-outlined text-primary text-5xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h1 className="font-h1 text-h1 text-primary mb-4 text-center">Pixel Quest Oracle</h1>
            <p className="text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed font-body-md">
              Ask me about builds, items, stats, or where to find enemies in your adventure.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {[
                "¿Cuál es el mejor arco para empezar?",
                "¿Qué drops tiene el Slime King?",
                "Recomiéndame una build de daño T4",
                "¿Para qué sirve el Valor Bonus?"
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="bg-white/[0.04] backdrop-blur-md p-md rounded-[1.5rem] text-left transition-[background-color,border-color] duration-[150ms] group border border-white/10 hover:border-white/20 hover:bg-white/[0.08] btn-press animate-in fade-in zoom-in-[0.95] slide-in-from-bottom-2 duration-[250ms] ease-[var(--ease-out)]"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                >
                  <p className="font-body-md text-on-surface-variant group-hover:text-primary transition-colors duration-[150ms]">{q}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <React.Fragment key={idx}>
              {msg.role === 'user' ? (
                <div className="flex flex-col items-end animate-in fade-in zoom-in-[0.95] slide-in-from-right-2 duration-[250ms] ease-[var(--ease-out)] mt-6">
                  <div className="max-w-[80%] doppelrand-bubble rounded-tr-none">
                    <div className="doppelrand-bubble-core p-4">
                      <p className="font-body-md text-on-surface whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-label-caps text-on-surface-variant mt-xs mr-xs uppercase">Adventurer</span>
                </div>
              ) : (
                <div className="flex flex-col items-start animate-in fade-in zoom-in-[0.95] slide-in-from-left-2 duration-[250ms] ease-[var(--ease-out)] mt-6">
                  <div className="flex gap-md items-start max-w-full md:max-w-[90%]">
                    <div className="w-10 h-10 shrink-0 bg-white/[0.02] rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden hidden md:flex shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <span className="material-symbols-outlined text-primary text-xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <div className="doppelrand-bubble rounded-tl-none w-full">
                      <div className="doppelrand-bubble-core p-5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/[0.02] pointer-events-none"></div>
                        <div 
                          className="font-body-md text-on-surface leading-relaxed relative z-10 prose prose-invert max-w-none" 
                          dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} 
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-label-caps text-on-surface-variant mt-xs ml-0 md:ml-14 uppercase">Oracle</span>
                </div>
              )}
            </React.Fragment>
          ))
        )}

        {isLoading && (
          <div className="flex gap-md items-center ml-0 md:ml-14 animate-in fade-in zoom-in-[0.95] duration-[250ms] ease-[var(--ease-out)] mt-6">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
            </div>
            <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">Oracle is manifesting an answer...</span>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <div className="max-w-[800px] mx-auto px-md pb-md md:pb-xl">
          <form
            onSubmit={handleSubmit}
            className="doppelrand-shell p-1.5 rounded-full flex items-center gap-2 transition-[border-color,box-shadow,background-color] duration-[250ms] ease-[var(--ease-out)] focus-within:ring-1 focus-within:ring-white/20 relative"
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
              placeholder="Whisper to the Oracle..."
              className="flex-grow bg-transparent border-none focus:ring-0 text-body-md text-on-surface placeholder:text-on-surface-variant/50 px-md resize-none py-3 outline-none"
              rows={1}
              style={{ height: 'auto', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="group flex items-center gap-3 bg-white/[0.04] text-on-surface font-label-caps text-label-caps pl-6 pr-1.5 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.08] btn-press disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-[background-color,border-color,opacity] duration-[200ms] ease-out"
            >
              <span className="hidden md:inline font-bold text-primary group-hover:text-primary">Cast</span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-[transform,background-color] duration-[200ms] ease-[var(--ease-out)] group-hover:bg-white/10 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <span className="material-symbols-outlined text-[16px] text-primary">send</span>
              </div>
            </button>
          </form>
          <p className="text-center text-[10px] text-on-surface-variant mt-2 font-label-caps">
            The Oracle&apos;s visions may be imperfect. Always verify in the Realm.
          </p>
        </div>
      </div>
    </section>
  );
}
