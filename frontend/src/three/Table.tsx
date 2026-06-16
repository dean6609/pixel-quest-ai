import { useMemo } from "react";
import * as THREE from "three";

/**
 * The wooden table the grimoire descends onto. The top sits at y = -0.45 so the
 * open book (which rests around y = -0.2) reads as lying on the surface, with
 * the candles and hourglass arranged across it.
 */
export function Table() {
  const timber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a3320", roughness: 0.8, metalness: 0.05 }),
    [],
  );
  const leg: [number, number, number][] = [
    [-3.2, -1.4, 1.3], [3.2, -1.4, 1.3], [-3.2, -1.4, -1.3], [3.2, -1.4, -1.3],
  ];

  return (
    <group>
      {/* table top */}
      <mesh position={[0, -0.45, -0.1]} receiveShadow castShadow material={timber}>
        <boxGeometry args={[8, 0.22, 3.6]} />
      </mesh>
      {/* legs */}
      {leg.map((p, i) => (
        <mesh key={i} position={p} material={timber} castShadow>
          <boxGeometry args={[0.25, 1.9, 0.25]} />
        </mesh>
      ))}
    </group>
  );
}
