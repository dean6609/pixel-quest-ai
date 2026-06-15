import { useMemo } from "react";
import * as THREE from "three";

/**
 * A dim stone-and-timber chamber: floor, back and side walls, plus a lectern
 * that the grimoire rests on. Geometry is deliberately simple — atmosphere
 * comes from the lighting and postprocessing, not polygon count.
 */
export function Room() {
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1b1712", roughness: 1, metalness: 0 }),
    [],
  );
  const timber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#241a10", roughness: 0.85, metalness: 0.05 }),
    [],
  );

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow material={stone}>
        <planeGeometry args={[40, 40]} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 4, -9]} receiveShadow material={stone}>
        <planeGeometry args={[40, 24]} />
      </mesh>
      {/* side walls, angled inward to frame the book */}
      <mesh position={[-11, 4, -2]} rotation={[0, Math.PI / 5, 0]} receiveShadow material={stone}>
        <planeGeometry args={[24, 24]} />
      </mesh>
      <mesh position={[11, 4, -2]} rotation={[0, -Math.PI / 5, 0]} receiveShadow material={stone}>
        <planeGeometry args={[24, 24]} />
      </mesh>

      {/* lectern: a slim pillar + a slanted top the book sits on */}
      <mesh position={[0, -1.3, -0.4]} material={timber} castShadow>
        <cylinderGeometry args={[0.55, 0.8, 1.8, 8]} />
      </mesh>
      <mesh position={[0, -0.35, -0.2]} rotation={[-0.32, 0, 0]} material={timber} castShadow>
        <boxGeometry args={[2.8, 0.18, 2.0]} />
      </mesh>
    </group>
  );
}
