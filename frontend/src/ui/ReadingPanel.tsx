import type { Message } from "../lib/types";
import { ChatPanel } from "./ChatPanel";
import { ReasoningStream } from "./ReasoningStream";
import { InkInput } from "./InkInput";

/** Everything the reading panel needs to render the conversation. */
export interface ReadingProps {
  messages: Message[];
  reasoning: string;
  thinking: boolean;
  hasAnswer: boolean;
  inputDisabled: boolean;
  onSubmit: (q: string) => void;
}

interface Props extends ReadingProps {
  /** book is open → show the panel */
  open: boolean;
}

/**
 * A flat, screen-space reading panel that appears when the grimoire opens. The
 * 3D book still opens behind it as atmosphere, but the conversation renders here
 * — crisp, head-on, fully legible — instead of on the tilted 3D pages. Single
 * centred column: conversation scrolls, reasoning below it, input pinned at the
 * foot. The backdrop is pointer-transparent so the 3D hourglass stays clickable.
 */
export function ReadingPanel({
  open, messages, reasoning, thinking, hasAnswer, inputDisabled, onSubmit,
}: Props) {
  if (!open) return null;
  return (
    <div className="reading-overlay">
      <section className="reading-card" aria-label="El grimorio">
        <div className="reading-card__scroll">
          <ChatPanel messages={messages} thinking={thinking} />
          <ReasoningStream reasoning={reasoning} hasAnswer={hasAnswer} thinking={thinking} />
        </div>
        <InkInput onSubmit={onSubmit} disabled={inputDisabled} />
      </section>
    </div>
  );
}
