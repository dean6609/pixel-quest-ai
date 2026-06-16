import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

interface Props {
  /** target fps; 0 = do not drive the loop (render only on invalidate) */
  fps: number;
}

/**
 * Drives the on-demand render loop at a fixed cadence and pauses when the tab
 * or window loses visibility/focus. With frameloop="demand", each invalidate()
 * renders exactly one frame, so this caps GPU work to `fps` while the scene
 * stays alive. Always fires one frame on change so transitions are not missed.
 */
export function FrameLoopController({ fps }: Props) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate(); // ensure at least one fresh frame when fps/phase changes
    if (fps <= 0) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (timer === undefined && document.visibilityState === "visible") {
        timer = setInterval(() => invalidate(), 1000 / fps);
      }
    };
    const stop = () => {
      if (timer !== undefined) { clearInterval(timer); timer = undefined; }
    };
    const onVisibility = () =>
      document.visibilityState === "visible" ? start() : stop();

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", stop);
    window.addEventListener("focus", start);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", stop);
      window.removeEventListener("focus", start);
    };
  }, [fps, invalidate]);

  return null;
}
