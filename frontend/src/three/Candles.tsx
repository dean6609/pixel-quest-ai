import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  /** scales flicker amplitude + base intensity; rises while the AI thinks */
  agitation?: number;
}

// [x, y, z, castShadow] — only the two front candles cast shadows to keep the
// one-time shadow render cheap; the back pair light without casting.
const CANDLES: [number, number, number, boolean][] = [
  [-3.4, -0.5, 1.2, true],
  [3.4, -0.5, 1.0, true],
  [-2.0, 1.6, -6.5, false],
  [2.2, 1.4, -6.5, false],
];

function Candle({
  position, agitation, castShadow,
}: { position: [number, number, number]; agitation: number; castShadow: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  const seed = useRef(Math.random() * 100);

  useFrame((state) => {
    const t = state.clock.elapsedTime + seed.current;
    const flicker =
      Math.sin(t * 11) * 0.5 + Math.sin(t * 23.3) * 0.25 + Math.sin(t * 5.1) * 0.25;
    const amp = 0.35 + agitation * 0.9;
    const base = 7 + agitation * 5;
    if (light.current) light.current.intensity = base + flicker * amp * base * 0.18;
    if (flame.current) {
      const s = 1 + flicker * 0.12 * (1 + agitation);
      flame.current.scale.set(s * 0.6, s, s * 0.6);
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.35, 0]} castShadow={castShadow}>
        <cylinderGeometry args={[0.08, 0.1, 0.6, 10]} />
        <meshStandardMaterial color="#e8d8b0" roughness={0.7} emissive="#3a2a12" emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={flame} position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0.1, 0]}
        color="#ffb053"
        intensity={7}
        distance={14}
        decay={2}
        castShadow={castShadow}
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
      />
    </group>
  );
}

export function Candles({ agitation = 0 }: Props) {
  return (
    <group>
      {CANDLES.map(([x, y, z, cast], i) => (
        <Candle key={i} position={[x, y, z]} agitation={agitation} castShadow={cast} />
      ))}
    </group>
  );
}
