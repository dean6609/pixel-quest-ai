# Grimoire 3D Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. For the visual/3D tasks, ALSO use the `frontend-design` skill — those tasks are iterative and creative, not pre-written code.

**Goal:** Rebuild the frontend as an immersive 3D "grimoire in a candlelit room": a cinematic intro flies the camera to a floating book that opens to reveal a chat; the user converses with the RAG AI and watches it reason live (via the streaming backend), with the room reacting while it thinks. Only two features: chat and history.

**Architecture:** Vite + React + TypeScript single-page app. A 3D layer (`<Canvas>` with React Three Fiber) renders the room/book/atmosphere; a crisp 2D HTML overlay holds the actual chat & history UI positioned over the open book. A scene state machine (`intro → idle → thinking`) drives animation. Chat consumes the SSE endpoint `POST /api/ask/stream`; history is persisted in `localStorage`. Desktop-only.

**Tech Stack:** Vite, React 19, TypeScript, @react-three/fiber, @react-three/drei, @react-three/postprocessing, react-markdown + rehype-sanitize, Vitest + Testing Library, Playwright (E2E).

**Prerequisite:** The streaming backend plan (`2026-06-14-streaming-backend.md`) must be implemented first — this app depends on its event contract (`reasoning`/`status`/`answer`/`done`/`error`).

**Reference spec:** `docs/superpowers/specs/2026-06-14-grimoire-streaming-redesign-design.md` (sub-project B).

---

## File Structure

```
frontend/
  index.html
  vite.config.ts            # build.outDir = "dist"
  package.json
  src/
    main.tsx                # React entry
    App.tsx                 # orchestrates 3D layer + 2D overlay + scene state
    state/
      sceneState.ts         # state machine: intro/idle/thinking + historyOpen
      ChatContext.tsx       # current conversation + send() + phase
    lib/
      streamClient.ts       # consume /api/ask/stream, dispatch events
      history.ts            # localStorage CRUD for conversations
      types.ts              # Message, Conversation, StreamEvent
    three/
      Scene.tsx             # <Canvas> root + postprocessing
      Room.tsx  Candles.tsx  DustParticles.tsx  Grimoire.tsx  CameraRig.tsx
    ui/
      ChatPanel.tsx  ReasoningStream.tsx  InkInput.tsx
      HourglassButton.tsx  HistoryDrawer.tsx
    styles/                 # CSS for the 2D overlay
  tests/                    # Vitest unit tests
  e2e/                      # Playwright
```

---

### Task 1: Scaffold Vite + React + TS

**Files:** Create `frontend/` app.

- [ ] **Step 1:** From repo root, scaffold:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```
- [ ] **Step 2:** Add libraries:
```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing react-markdown rehype-sanitize
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```
- [ ] **Step 3:** In `frontend/vite.config.ts` set the build output and test env:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist" },
  server: { proxy: { "/api": "http://localhost:8080" } },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/test-setup.ts" },
});
```
Create `frontend/src/test-setup.ts`:
```ts
import "@testing-library/jest-dom";
```
- [ ] **Step 4:** Verify dev server starts: `npm run dev` (Ctrl-C after it serves). Verify `npx vitest run` exits cleanly (no tests yet).
- [ ] **Step 5: Commit**
```bash
git add frontend
git commit -m "chore(frontend): scaffold Vite + React + TS + R3F deps"
```

---

### Task 2: Shared types

**Files:** Create `frontend/src/lib/types.ts`. Test: `frontend/src/lib/types.test.ts` (compile-only smoke).

- [ ] **Step 1: Write the types**
```ts
export type Role = "user" | "assistant";
export interface Message { role: Role; content: string; }
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}
export type StreamEvent =
  | { type: "reasoning"; delta: string }
  | { type: "status"; state: "thinking" | "searching" }
  | { type: "answer"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };
```
- [ ] **Step 2:** Verify type-check: `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 3: Commit**
```bash
git add frontend/src/lib/types.ts
git commit -m "feat(frontend): shared types"
```

---

### Task 3: localStorage history module (TDD)

**Files:** Create `frontend/src/lib/history.ts`. Test: `frontend/src/lib/history.test.ts`.

- [ ] **Step 1: Write the failing test**
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { saveConversation, listConversations, getConversation, deleteConversation } from "./history";
import type { Conversation } from "./types";

const conv = (id: string): Conversation => ({
  id, title: "t-" + id, createdAt: Date.now(), messages: [{ role: "user", content: "hi" }],
});

describe("history", () => {
  beforeEach(() => localStorage.clear());
  it("saves and lists newest-first", () => {
    saveConversation(conv("a")); saveConversation(conv("b"));
    expect(listConversations().map(c => c.id)).toEqual(["b", "a"]);
  });
  it("gets by id and deletes", () => {
    saveConversation(conv("a"));
    expect(getConversation("a")?.id).toBe("a");
    deleteConversation("a");
    expect(getConversation("a")).toBeNull();
  });
  it("upserts by id", () => {
    saveConversation(conv("a"));
    saveConversation({ ...conv("a"), title: "updated" });
    expect(listConversations()).toHaveLength(1);
    expect(getConversation("a")?.title).toBe("updated");
  });
});
```
- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/history.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```ts
import type { Conversation } from "./types";
const KEY = "pq.conversations";

function readAll(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeAll(list: Conversation[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}
export function getConversation(id: string): Conversation | null {
  return readAll().find(c => c.id === id) ?? null;
}
export function saveConversation(conv: Conversation): void {
  const list = readAll().filter(c => c.id !== conv.id);
  list.push(conv); writeAll(list);
}
export function deleteConversation(id: string): void {
  writeAll(readAll().filter(c => c.id !== id));
}
```
- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/history.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/lib/history.ts frontend/src/lib/history.test.ts
git commit -m "feat(frontend): localStorage conversation history"
```

---

### Task 4: Stream client (TDD)

Parses an SSE byte stream into `StreamEvent`s via a callback.

**Files:** Create `frontend/src/lib/streamClient.ts`. Test: `frontend/src/lib/streamClient.test.ts`.

- [ ] **Step 1: Write the failing test**
```ts
import { describe, it, expect, vi } from "vitest";
import { parseSSE } from "./streamClient";
import type { StreamEvent } from "./types";

it("parses multi-event SSE text into typed events", () => {
  const text =
    'event: reasoning\ndata: {"delta":"pen"}\n\n' +
    'event: status\ndata: {"state":"searching"}\n\n' +
    'event: answer\ndata: {"delta":"hola"}\n\n' +
    'event: done\ndata: {}\n\n';
  const got: StreamEvent[] = [];
  parseSSE(text, e => got.push(e));
  expect(got).toEqual([
    { type: "reasoning", delta: "pen" },
    { type: "status", state: "searching" },
    { type: "answer", delta: "hola" },
    { type: "done" },
  ]);
});
```
- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/streamClient.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (pure parser + fetch driver)
```ts
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
```
- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/streamClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/lib/streamClient.ts frontend/src/lib/streamClient.test.ts
git commit -m "feat(frontend): SSE stream client and parser"
```

---

### Task 5: Scene state machine (TDD)

**Files:** Create `frontend/src/state/sceneState.ts`. Test: `frontend/src/state/sceneState.test.ts`.

- [ ] **Step 1: Write the failing test**
```ts
import { describe, it, expect } from "vitest";
import { sceneReducer, initialScene } from "./sceneState";

it("intro -> idle on skip/open", () => {
  expect(sceneReducer(initialScene, { type: "INTRO_DONE" }).phase).toBe("idle");
  expect(sceneReducer(initialScene, { type: "SKIP_INTRO" }).phase).toBe("idle");
});
it("send -> thinking, done -> idle", () => {
  const idle = { ...initialScene, phase: "idle" as const };
  expect(sceneReducer(idle, { type: "SEND" }).phase).toBe("thinking");
  const thinking = { ...initialScene, phase: "thinking" as const };
  expect(sceneReducer(thinking, { type: "STREAM_DONE" }).phase).toBe("idle");
});
it("history toggles independently of phase", () => {
  const idle = { ...initialScene, phase: "idle" as const };
  const open = sceneReducer(idle, { type: "TOGGLE_HISTORY" });
  expect(open.historyOpen).toBe(true);
  expect(open.phase).toBe("idle");
});
```
- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/state/sceneState.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**
```ts
export type Phase = "intro" | "idle" | "thinking";
export interface SceneState { phase: Phase; historyOpen: boolean; }
export const initialScene: SceneState = { phase: "intro", historyOpen: false };

export type SceneAction =
  | { type: "INTRO_DONE" } | { type: "SKIP_INTRO" }
  | { type: "SEND" } | { type: "STREAM_DONE" } | { type: "STREAM_ERROR" }
  | { type: "TOGGLE_HISTORY" };

export function sceneReducer(s: SceneState, a: SceneAction): SceneState {
  switch (a.type) {
    case "INTRO_DONE":
    case "SKIP_INTRO": return { ...s, phase: "idle" };
    case "SEND": return { ...s, phase: "thinking" };
    case "STREAM_DONE":
    case "STREAM_ERROR": return { ...s, phase: "idle" };
    case "TOGGLE_HISTORY": return { ...s, historyOpen: !s.historyOpen };
    default: return s;
  }
}
```
- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/state/sceneState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/state/sceneState.ts frontend/src/state/sceneState.test.ts
git commit -m "feat(frontend): scene state machine"
```

---

### Task 6: ChatContext (TDD)

Wires `streamAsk` + `sceneReducer` + `history` into one provider exposing
`messages`, `reasoning`, `phase`, `send()`, `loadConversation()`.

**Files:** Create `frontend/src/state/ChatContext.tsx`. Test: `frontend/src/state/ChatContext.test.tsx`.

- [ ] **Step 1: Write the failing test** (mock `streamClient`)
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ChatProvider, useChat } from "./ChatContext";
import * as sc from "../lib/streamClient";

vi.mock("../lib/streamClient");

function Probe() {
  const { messages, reasoning, phase, send } = useChat();
  return (
    <div>
      <button onClick={() => send("hola")}>send</button>
      <span data-testid="phase">{phase}</span>
      <span data-testid="reasoning">{reasoning}</span>
      <span data-testid="answer">{messages.at(-1)?.content ?? ""}</span>
    </div>
  );
}

beforeEach(() => localStorage.clear());

it("streams reasoning then answer and returns to idle", async () => {
  (sc.streamAsk as any).mockImplementation(async (_b: any, emit: any) => {
    emit({ type: "reasoning", delta: "pen" });
    emit({ type: "answer", delta: "Respuesta" });
    emit({ type: "done" });
  });
  render(<ChatProvider><Probe /></ChatProvider>);
  await act(async () => { screen.getByText("send").click(); });
  expect(screen.getByTestId("reasoning").textContent).toContain("pen");
  expect(screen.getByTestId("answer").textContent).toContain("Respuesta");
  expect(screen.getByTestId("phase").textContent).toBe("idle");
});
```
- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/state/ChatContext.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**
```tsx
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
```
- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/state/ChatContext.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/state/ChatContext.tsx frontend/src/state/ChatContext.test.tsx
git commit -m "feat(frontend): ChatContext wiring stream + history + scene"
```

---

### Task 7: 2D overlay UI components (TDD where behavioral)

Build `ChatPanel`, `ReasoningStream`, `InkInput`, `HourglassButton`, `HistoryDrawer`.
Render markdown with `react-markdown` + `rehype-sanitize`. Style as ink-on-parchment
in `styles/`.

- [ ] **Step 1:** Write a behavioral test for `InkInput` (submits on Enter, clears):
```tsx
// frontend/src/ui/InkInput.test.tsx
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InkInput } from "./InkInput";
it("calls onSubmit with trimmed value and clears", () => {
  const onSubmit = vi.fn();
  render(<InkInput onSubmit={onSubmit} disabled={false} />);
  const box = screen.getByRole("textbox") as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: "  hola  " } });
  fireEvent.keyDown(box, { key: "Enter" });
  expect(onSubmit).toHaveBeenCalledWith("hola");
  expect(box.value).toBe("");
});
```
- [ ] **Step 2:** Run `npx vitest run src/ui/InkInput.test.tsx` → FAIL.
- [ ] **Step 3:** Implement `InkInput` (textarea, Enter submits, Shift+Enter newline,
  `disabled` while phase==="thinking") and the presentational components
  (`ChatPanel` maps messages → markdown bubbles; `ReasoningStream` shows live
  reasoning text, collapsible once an answer exists; `HourglassButton` toggles
  history; `HistoryDrawer` lists `listConversations()` and calls `loadConversation`).
  Use the `frontend-design` skill for the visual styling so it matches the grimoire
  aesthetic.
- [ ] **Step 4:** Run `npx vitest run src/ui/` → PASS.
- [ ] **Step 5: Commit**
```bash
git add frontend/src/ui frontend/src/styles
git commit -m "feat(frontend): 2D grimoire overlay UI (chat, reasoning, input, history)"
```

---

### Task 8: 3D scene — room, candles, particles, book (ITERATIVE / frontend-design)

These tasks are visual and creative; there is no meaningful unit test. **Use the
`frontend-design` skill** and iterate against acceptance criteria. Verify each in the
browser (`npm run dev`) and with a screenshot via Playwright.

- [ ] **Step 1:** `Scene.tsx` — `<Canvas>` with a dark room, soft ambient light,
  `<EffectComposer>` (Bloom + Vignette + DepthOfField). Acceptance: a dim,
  atmospheric empty room renders at 60fps on desktop.
- [ ] **Step 2:** `Candles.tsx` — point lights with flicker (animated intensity) +
  glow via Bloom. Acceptance: warm candlelight visibly flickers.
- [ ] **Step 3:** `DustParticles.tsx` — instanced floating motes drifting slowly.
  Acceptance: subtle dust visible in the light.
- [ ] **Step 4:** `Grimoire.tsx` — a book on a lectern with an open/close animation
  driven by a prop. Acceptance: book opens smoothly; open state exposes a flat
  region where the 2D overlay sits.
- [ ] **Step 5:** `CameraRig.tsx` — intro fly-in toward the book, then gentle idle
  drift; calls `introDone()` when the fly-in completes; respects `skipIntro()`.
  Acceptance: first load plays the cinematic; subsequent sends do not replay it.
- [ ] **Step 6: Commit** after each component:
```bash
git add frontend/src/three
git commit -m "feat(frontend): 3D <component> for the grimoire scene"
```

---

### Task 9: Compose App + reactive atmosphere

**Files:** `frontend/src/App.tsx`, `frontend/src/main.tsx`.

- [ ] **Step 1:** `App.tsx` wraps everything in `<ChatProvider>`: renders `<Scene>`
  (3D) with the 2D overlay (`ChatPanel`, `ReasoningStream`, `InkInput`,
  `HourglassButton`, `HistoryDrawer`) positioned over the open book.
- [ ] **Step 2:** Wire reactive atmosphere: when `phase === "thinking"`, intensify
  candle flicker and pull particles toward the book; return to calm on `idle`.
  (Read `phase` from `useChat()`.)
- [ ] **Step 3:** Verify in browser: load → intro → ask a question (real backend
  running via `python web_app.py` after building, or Vite proxy to :8080) → see
  reasoning stream live, room react, answer write in; open hourglass → reopen a
  past conversation.
- [ ] **Step 4: Commit**
```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(frontend): compose scene + overlay with reactive atmosphere"
```

---

### Task 10: Wire backend to serve the Vite build

**Files:** Modify `web_app.py`.

- [ ] **Step 1: Update the static dir** — change `FRONTEND_DIR` from
  `os.path.join(BASE, "frontend", "out")` to `os.path.join(BASE, "frontend", "dist")`.
- [ ] **Step 2: Build and run**
```bash
cd frontend && npm run build && cd ..
python web_app.py
```
Open http://localhost:8080 — the grimoire loads and chat works end-to-end.
- [ ] **Step 3: Commit**
```bash
git add web_app.py
git commit -m "feat(web): serve Vite build from frontend/dist"
```

---

### Task 11: Playwright E2E (mocked backend)

**Files:** Create `frontend/e2e/grimoire.spec.ts`, `frontend/playwright.config.ts`.

- [ ] **Step 1:** Config Playwright to run `npm run dev` and mock `/api/ask/stream`
  via `page.route` returning a canned SSE body (reasoning + answer + done).
- [ ] **Step 2:** Spec: load → skip intro → type a question + Enter → assert
  reasoning text appears, then answer text appears → click hourglass → assert the
  conversation is listed → reopen it → assert messages restored.
- [ ] **Step 3:** Run `npx playwright test`. Expected: PASS.
- [ ] **Step 4: Commit**
```bash
git add frontend/e2e frontend/playwright.config.ts
git commit -m "test(frontend): Playwright E2E for grimoire chat + history"
```

---

## Self-Review Notes
- Spec §4.1 stack/serving → Tasks 1, 10. §4.2 state machine → Task 5.
  §4.3 components → Tasks 6 (state), 7 (2D UI), 8 (3D). §4.4 data flow → Tasks 4, 6, 9.
  §4.5 performance → Task 8 acceptance criteria (desktop 60fps). §4.6 tests →
  Tasks 3–7 (unit), 11 (E2E).
- Type names consistent with `lib/types.ts` (`Message`, `Conversation`, `StreamEvent`)
  and backend event names (`reasoning`/`status`/`answer`/`done`/`error`).
- 3D/visual tasks (8, 9) are intentionally not fake-TDD'd; they require the
  `frontend-design` skill and browser/screenshot verification.
- Mobile is out of scope (desktop-only per spec §4.5); a "best on desktop" notice
  is optional polish, not a task.
```
