import { useMemo } from "react";
import * as THREE from "three";

/**
 * A dim stone chamber: floor, back and side walls where the grimoire floats
 * at its centre. Geometry is deliberately simple — atmosphere comes from the
 * lighting and postprocessing, not polygon count.
 */
export function Room() {
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1b1712", roughness: 1, metalness: 0 }),
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
    </group>
  );
}
