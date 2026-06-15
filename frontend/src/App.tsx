import { useEffect, useRef, useState } from "react";
import { ChatProvider, useChat } from "./state/ChatContext";
import { Scene } from "./three/Scene";
import { ChatPanel } from "./ui/ChatPanel";
import { ReasoningStream } from "./ui/ReasoningStream";
import { InkInput } from "./ui/InkInput";
import { HourglassButton } from "./ui/HourglassButton";
import { HistoryDrawer } from "./ui/HistoryDrawer";
import "./styles/overlay.css";

function Grimoire() {
  const {
    messages, reasoning, phase, historyOpen,
    send, loadConversation, toggleHistory, skipIntro, introDone,
  } = useChat();

  const [skip, setSkip] = useState(false);
  const [revision, setRevision] = useState(0);
  const prevPhase = useRef(phase);

  // After each thinking→idle transition a conversation was just saved; refresh history.
  useEffect(() => {
    if (prevPhase.current === "thinking" && phase === "idle") {
      setRevision(r => r + 1);
    }
    prevPhase.current = phase;
  }, [phase]);

  const thinking = phase === "thinking";
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
  const hasAnswer = !!lastAssistant?.content;

  const handleSkip = () => { setSkip(true); skipIntro(); };

  return (
    <>
      <Scene
        phase={phase}
        bookOpen={phase !== "intro"}
        skip={skip}
        onIntroDone={introDone}
      />

      {phase === "intro" && (
        <button className="skip-intro" onClick={handleSkip}>
          abrir el grimorio →
        </button>
      )}

      {phase !== "intro" && (
        <>
          <div className="tools">
            <HourglassButton open={historyOpen} onToggle={toggleHistory} />
          </div>

          <div className="overlay">
            <section className="codex">
              <ChatPanel messages={messages} thinking={thinking} />
              <ReasoningStream reasoning={reasoning} hasAnswer={hasAnswer} thinking={thinking} />
            </section>
            <div className="composer">
              <InkInput onSubmit={send} disabled={thinking} />
            </div>
          </div>

          <HistoryDrawer
            open={historyOpen}
            revision={revision}
            onSelect={loadConversation}
            onClose={toggleHistory}
            onChanged={() => setRevision(r => r + 1)}
          />
        </>
      )}
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
