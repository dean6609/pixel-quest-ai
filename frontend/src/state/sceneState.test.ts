import { it, expect } from "vitest";
import { sceneReducer, initialScene } from "./sceneState";

it("intro -> closed on intro done / skip", () => {
  expect(sceneReducer(initialScene, { type: "INTRO_DONE" }).phase).toBe("closed");
  expect(sceneReducer(initialScene, { type: "SKIP_INTRO" }).phase).toBe("closed");
});
it("closed -> idle on open book", () => {
  const closed = { ...initialScene, phase: "closed" as const };
  expect(sceneReducer(closed, { type: "OPEN_BOOK" }).phase).toBe("idle");
});
it("open book is idempotent from idle", () => {
  const idle = { ...initialScene, phase: "idle" as const };
  expect(sceneReducer(idle, { type: "OPEN_BOOK" }).phase).toBe("idle");
});
it("send -> thinking, done -> idle", () => {
  const idle = { ...initialScene, phase: "idle" as const };
  expect(sceneReducer(idle, { type: "SEND" }).phase).toBe("thinking");
  const thinking = { ...initialScene, phase: "thinking" as const };
  expect(sceneReducer(thinking, { type: "STREAM_DONE" }).phase).toBe("idle");
});
it("history toggles independently of phase", () => {
  const closed = { ...initialScene, phase: "closed" as const };
  const open = sceneReducer(closed, { type: "TOGGLE_HISTORY" });
  expect(open.historyOpen).toBe(true);
  expect(open.phase).toBe("closed");
});
