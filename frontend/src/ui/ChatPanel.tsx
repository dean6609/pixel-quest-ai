import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Message } from "../lib/types";

interface Props {
  messages: Message[];
  thinking: boolean;
}

export function ChatPanel({ messages, thinking }: Props) {
  if (messages.length === 0) {
    return (
      <div className="chat-panel chat-panel--empty">
        <p className="chat-panel__prompt">
          El grimorio aguarda. Formula tu primera consulta y observa cómo despierta.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-panel" role="log" aria-live="polite">
      {messages.map((m, i) => {
        const last = i === messages.length - 1;
        const pending = thinking && last && m.role === "assistant" && m.content === "";
        return (
          <article key={i} className={`bubble bubble--${m.role}`}>
            <span className="bubble__sigil" aria-hidden="true">
              {m.role === "user" ? "✶" : "❧"}
            </span>
            <div className="bubble__body">
              {pending ? (
                <span className="bubble__dots" aria-label="escribiendo">
                  <i /><i /><i />
                </span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
