import { createContext, useContext, useReducer, useState, useCallback, useRef } from "react";
import type { Message, Conversation } from "../lib/types";
import { streamAsk } from "../lib/streamClient";
import { sceneReducer, initialScene } from "./sceneState";
import { saveConversation } from "../lib/history";

interface ChatValue {
  messages: Message[]; reasoning: string; phase: string; historyOpen: boolean;
  send: (q: string) => Promise<void>;
  loadConversation: (c: Conversation) => void;
  toggleHistory: () => void; skipIntro: () => void; introDone: () => void;
}
const Ctx = createContext<ChatValue | null>(null);
export const useChat = () => {
  const v = useContext(Ctx); if (!v) throw new Error("useChat outside provider"); return v;
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [scene, dispatch] = useReducer(sceneReducer, initialScene);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reasoning, setReasoning] = useState("");
  const convId = useRef<string>(crypto.randomUUID());

  const send = useCallback(async (q: string) => {
    setReasoning("");
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(m => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    dispatch({ type: "SEND" });
    let answer = "";
    try {
      await streamAsk({ query: q, history }, ev => {
        if (ev.type === "reasoning") setReasoning(r => r + ev.delta);
        else if (ev.type === "answer") {
          answer += ev.delta;
          setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: answer }; return c; });
        } else if (ev.type === "error") {
          setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: "Algo se interpuso. Intenta de nuevo." }; return c; });
        }
      });
    } finally {
      dispatch({ type: "STREAM_DONE" });
      setMessages(curr => {
        saveConversation({ id: convId.current, title: q.slice(0, 40),
          createdAt: Date.now(), messages: curr });
        return curr;
      });
    }
  }, [messages]);

  const loadConversation = useCallback((c: Conversation) => {
    convId.current = c.id; setMessages(c.messages); setReasoning("");
    if (scene.historyOpen) dispatch({ type: "TOGGLE_HISTORY" });
  }, [scene.historyOpen]);

  return (
    <Ctx.Provider value={{
      messages, reasoning, phase: scene.phase, historyOpen: scene.historyOpen,
      send, loadConversation,
      toggleHistory: () => dispatch({ type: "TOGGLE_HISTORY" }),
      skipIntro: () => dispatch({ type: "SKIP_INTRO" }),
      introDone: () => dispatch({ type: "INTRO_DONE" }),
    }}>{children}</Ctx.Provider>
  );
}
