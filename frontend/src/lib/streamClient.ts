import type { StreamEvent } from "./types";

export function parseSSE(text: string, emit: (e: StreamEvent) => void): void {
  for (const block of text.split("\n\n")) {
    const lines = block.split("\n");
    const ev = lines.find(l => l.startsWith("event: "))?.slice(7).trim();
    const dataLine = lines.find(l => l.startsWith("data: "))?.slice(6);
    if (!ev || dataLine === undefined) continue;
    const data = JSON.parse(dataLine);
    emit({ type: ev, ...data } as StreamEvent);
  }
}

export async function streamAsk(
  body: { query: string; history?: { role: string; content: string }[] },
  emit: (e: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/ask/stream", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal,
  });
  if (!res.body) { emit({ type: "error", message: "no stream" }); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const idx = buf.lastIndexOf("\n\n");
    if (idx >= 0) { parseSSE(buf.slice(0, idx + 2), emit); buf = buf.slice(idx + 2); }
  }
  if (buf.trim()) parseSSE(buf, emit);
}
