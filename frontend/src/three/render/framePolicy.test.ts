import { it, expect } from "vitest";
import { pickFps } from "./framePolicy";

it("idle/closed render alive but light at 24fps", () => {
  expect(pickFps("idle", false)).toBe(24);
  expect(pickFps("closed", false)).toBe(24);
});
it("thinking and intro render smoother at 30fps", () => {
  expect(pickFps("thinking", false)).toBe(30);
  expect(pickFps("intro", false)).toBe(30);
});
it("reduced motion pauses the throttle (0 = on-demand only)", () => {
  expect(pickFps("idle", true)).toBe(0);
  expect(pickFps("thinking", true)).toBe(0);
});
