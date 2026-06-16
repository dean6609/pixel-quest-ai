import { useEffect, useRef, useState } from "react";
import { ChatProvider, useChat } from "./state/ChatContext";
import { Scene } from "./three/Scene";
import { HistoryDrawer } from "./ui/HistoryDrawer";
import type { RenderPhase } from "./three/render/framePolicy";
import "./styles/overlay.css";

function Grimoire() {
  const {
    messages, reasoning, phase, historyOpen,
    send, loadConversation, openBook, toggleHistory, skipIntro, introDone,
  } = useChat();

  const [skip, setSkip] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [revision, setRevision] = useState(0);
  const prevPhase = useRef(phase);

  // Reduced motion: skip the cinematic fly-in (the book still floats closed and
  // is opened by click) so the scene starts calm.
  useEffect(() => {
    if (skip) skipIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After each thinking→idle transition a conversation was just saved; refresh.
  useEffect(() => {
    if (prevPhase.current === "thinking" && phase === "idle") {
      setRevision(r => r + 1);
    }
    prevPhase.current = phase;
  }, [phase]);

  const thinking = phase === "thinking";
  const bookOpen = phase === "idle" || phase === "thinking";
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
  const hasAnswer = !!lastAssistant?.content;

  const handleSkip = () => { setSkip(true); skipIntro(); };

  return (
    <>
      <div className="brand" aria-hidden="true">
        <span className="brand__gem" />
        <span className="brand__name">IA WIKI</span>
      </div>

      <Scene
        phase={phase as RenderPhase}
        bookOpen={bookOpen}
        skip={skip}
        onIntroDone={introDone}
        onBookClick={openBook}
        onHourglassClick={toggleHistory}
        pages={{
          messages, reasoning, thinking, hasAnswer,
          inputDisabled: thinking, onSubmit: send,
        }}
      />

      {phase === "intro" && (
        <button className="skip-intro" onClick={handleSkip}>
          saltar la intro →
        </button>
      )}

      {/* Accessible twin: the floating book is opened by clicking the mesh; this
          gives keyboard users and tests a real focusable control. */}
      {phase === "closed" && (
        <button className="open-book-hint" onClick={openBook}>
          abrir el grimorio
        </button>
      )}

      {/* Accessible twin for the 3D hourglass. */}
      {bookOpen && (
        <button className="sr-only" onClick={toggleHistory} aria-pressed={historyOpen}>
          Conversaciones pasadas
        </button>
      )}

      <HistoryDrawer
        open={historyOpen}
        revision={revision}
        onSelect={loadConversation}
        onClose={toggleHistory}
        onChanged={() => setRevision(r => r + 1)}
      />
    </>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <Grimoire />
    </ChatProvider>
  );
}
