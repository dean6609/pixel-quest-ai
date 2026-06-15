export type RenderPhase = "intro" | "closed" | "idle" | "thinking";

/**
 * Frames-per-second for the on-demand render loop given the scene phase.
 * 0 means "do not throttle-drive the loop" — render only on explicit
 * invalidate(), which keeps a reduced-motion scene calm and cheap.
 */
export function pickFps(phase: RenderPhase, reduced: boolean): number {
  if (reduced) return 0;
  if (phase === "thinking" || phase === "intro") return 30;
  return 24; // closed / idle: alive but light
}
