export type Phase = "intro" | "closed" | "idle" | "thinking";
export interface SceneState { phase: Phase; historyOpen: boolean; }
export const initialScene: SceneState = { phase: "intro", historyOpen: false };

export type SceneAction =
  | { type: "INTRO_DONE" } | { type: "SKIP_INTRO" }
  | { type: "OPEN_BOOK" }
  | { type: "SEND" } | { type: "STREAM_DONE" } | { type: "STREAM_ERROR" }
  | { type: "TOGGLE_HISTORY" };

export function sceneReducer(s: SceneState, a: SceneAction): SceneState {
  switch (a.type) {
    case "INTRO_DONE":
    case "SKIP_INTRO": return { ...s, phase: "closed" };
    case "OPEN_BOOK": return { ...s, phase: "idle" };
    case "SEND": return { ...s, phase: "thinking" };
    case "STREAM_DONE":
    case "STREAM_ERROR": return { ...s, phase: "idle" };
    case "TOGGLE_HISTORY": return { ...s, historyOpen: !s.historyOpen };
    default: return s;
  }
}
