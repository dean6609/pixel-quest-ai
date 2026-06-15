import { it, expect } from "vitest";
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
