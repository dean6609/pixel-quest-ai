import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  onClick: () => void;
}

const GLASS = "#caa45f";
const FRAME = "#3b2a16";

/**
 * A small hourglass standing on the table to one side. Clicking it opens the
 * history popup. Two cones tip-to-tip make the glass; thin discs cap the frame.
 * It hovers-cursors and tilts slightly on hover to read as interactive.
 */
export function Hourglass({ onClick }: Props) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = hovered ? Math.sin(t * 6) * 0.06 : 0;
  });

  return (
    <group
      ref={group}
      position={[2.8, 0.12, 0.5]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
    >
      {/* upper glass */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <coneGeometry args={[0.22, 0.36, 16]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.55} roughness={0.2} emissive="#6b531f" emissiveIntensity={hovered ? 0.5 : 0.25} />
      </mesh>
      {/* lower glass */}
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.22, 0.36, 16]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.55} roughness={0.2} emissive="#6b531f" emissiveIntensity={hovered ? 0.5 : 0.25} />
      </mesh>
      {/* frame caps */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 16]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 16]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
    </group>
  );
}
