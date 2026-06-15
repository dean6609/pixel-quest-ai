import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  open: boolean;
  /** subtle glow swell while the AI thinks */
  agitation?: number;
}

const COVER = "#3b1d12";
const PAGE = "#e9dcb8";

/**
 * A leather grimoire resting open on the lectern. The two covers rotate apart
 * on the Y axis driven by `open`; once open they reveal a flat page spread that
 * the 2D HTML overlay is positioned over.
 */
export function Grimoire({ open, agitation = 0 }: Props) {
  const leftCover = useRef<THREE.Group>(null);
  const rightCover = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    // closed: covers flat together (±~5°). open: splayed to ~±80°.
    const target = open ? THREE.MathUtils.degToRad(78) : THREE.MathUtils.degToRad(4);
    const k = 1 - Math.pow(0.001, delta); // frame-rate independent lerp
    if (leftCover.current)
      leftCover.current.rotation.y = THREE.MathUtils.lerp(leftCover.current.rotation.y, -target, k);
    if (rightCover.current)
      rightCover.current.rotation.y = THREE.MathUtils.lerp(rightCover.current.rotation.y, target, k);
    if (glow.current) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2.2) * 0.5;
      glow.current.intensity = (open ? 1.2 : 0.2) + agitation * (1.5 + pulse * 2);
    }
  });

  return (
    // tilt to match the lectern slope, slightly above its surface
    <group position={[0, -0.2, -0.1]} rotation={[-0.32, 0, 0]}>
      {/* spine */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.5, 2.1]} />
        <meshStandardMaterial color={COVER} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* left half (cover + page), hinged at the spine */}
      <group ref={leftCover} position={[-0.09, 0, 0]}>
        <mesh position={[-1.4, 0, 0]} castShadow>
          <boxGeometry args={[2.8, 0.12, 2.1]} />
          <meshStandardMaterial color={COVER} roughness={0.55} metalness={0.12} />
        </mesh>
        <mesh position={[-1.4, 0.075, 0]}>
          <boxGeometry args={[2.6, 0.04, 1.95]} />
          <meshStandardMaterial color={PAGE} roughness={0.9} emissive="#caa45f" emissiveIntensity={0.12} />
        </mesh>
      </group>

      {/* right half */}
      <group ref={rightCover} position={[0.09, 0, 0]}>
        <mesh position={[1.4, 0, 0]} castShadow>
          <boxGeometry args={[2.8, 0.12, 2.1]} />
          <meshStandardMaterial color={COVER} roughness={0.55} metalness={0.12} />
        </mesh>
        <mesh position={[1.4, 0.075, 0]}>
          <boxGeometry args={[2.6, 0.04, 1.95]} />
          <meshStandardMaterial color={PAGE} roughness={0.9} emissive="#caa45f" emissiveIntensity={0.12} />
        </mesh>
      </group>

      {/* mystical glow rising from the open spread */}
      <pointLight ref={glow} position={[0, 0.6, 0]} color="#ffd98a" intensity={0.2} distance={6} decay={2} />
    </group>
  );
}
