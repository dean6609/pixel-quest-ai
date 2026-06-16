import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Candle positions never move (only their intensity flickers), so their shadow
 * maps are effectively static. Let the renderer draw shadows for the first two
 * frames, then request one final update and switch autoUpdate off so the GPU
 * stops re-rendering point-light cubemaps every frame.
 */
export function FrozenShadows() {
  const gl = useThree((s) => s.gl);
  const frame = useRef(0);

  useFrame(() => {
    frame.current += 1;
    if (frame.current === 2) {
      gl.shadowMap.needsUpdate = true; // one last full update…
      gl.shadowMap.autoUpdate = false; // …then stop auto-updating
    }
  });

  return null;
}
