// frontend/src/three/Arch.tsx
import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE } from "./palette";

/**
 * A gothic stone arch standing just in front of the back wall, framing the
 * floating grimoire. Two columns + a half-ring lintel — procedural, no textures.
 */
export function Arch() {
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PALETTE.STONE_LIGHT, roughness: 1, metalness: 0 }),
    [],
  );
  const HALF = 3.4;   // half the arch span (X)
  const COL_H = 7;    // column height (Y)
  const COL_W = 0.7;  // column thickness
  const baseY = -2.2; // floor level (matches Room)

  return (
    <group position={[0, 0, -8.4]}>
      {/* columns */}
      <mesh position={[-HALF, baseY + COL_H / 2, 0]} material={stone}>
        <boxGeometry args={[COL_W, COL_H, COL_W]} />
      </mesh>
      <mesh position={[HALF, baseY + COL_H / 2, 0]} material={stone}>
        <boxGeometry args={[COL_W, COL_H, COL_W]} />
      </mesh>
      {/* half-ring lintel sitting on the columns; rotated so the arc opens down */}
      <mesh position={[0, baseY + COL_H, 0]} rotation={[0, 0, 0]} material={stone}>
        <torusGeometry args={[HALF, COL_W / 2, 6, 24, Math.PI]} />
      </mesh>
    </group>
  );
}
