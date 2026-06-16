// frontend/src/three/Props.tsx
import { PALETTE } from "./palette";

/** A glass potion with glowing purple liquid. */
function Potion({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* liquid */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={PALETTE.GEM} emissive={PALETTE.GEM_BRIGHT} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.22, 8]} />
        <meshStandardMaterial color="#cfd8e0" transparent opacity={0.5} roughness={0.2} />
      </mesh>
      {/* cork */}
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.08, 8]} />
        <meshStandardMaterial color="#8a6a3a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A small low-poly skull (sphere cranium + box jaw + eye sockets). */
function Skull({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const bone = "#d8d2c0";
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial color={bone} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.02, 0.04]}>
        <boxGeometry args={[0.2, 0.12, 0.18]} />
        <meshStandardMaterial color={bone} roughness={0.85} />
      </mesh>
      {/* eye sockets */}
      <mesh position={[-0.07, 0.17, 0.16]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#100c08" />
      </mesh>
      <mesh position={[0.07, 0.17, 0.16]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#100c08" />
      </mesh>
    </group>
  );
}

/** A cluster of violet crystals (octahedra) growing from the desk. */
function Crystals({ position }: { position: [number, number, number] }) {
  const mat = (
    <meshStandardMaterial color={PALETTE.GEM} emissive={PALETTE.GEM_BRIGHT} emissiveIntensity={0.4} roughness={0.2} metalness={0.1} />
  );
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} rotation={[0.1, 0.4, 0]} scale={[0.5, 1, 0.5]}>
        <octahedronGeometry args={[0.26, 0]} />
        {mat}
      </mesh>
      <mesh position={[0.18, 0.13, 0.05]} rotation={[0.2, 0, 0.3]} scale={[0.35, 0.7, 0.35]}>
        <octahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color={PALETTE.GEM} emissive={PALETTE.GEM_BRIGHT} emissiveIntensity={0.4} roughness={0.2} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** A short stack of closed books. */
function BookStack({ position }: { position: [number, number, number] }) {
  const colors = [PALETTE.LEATHER, PALETTE.RIBBON, PALETTE.STONE_LIGHT];
  return (
    <group position={position}>
      {colors.map((c, i) => (
        <mesh key={i} position={[i * 0.03, 0.07 + i * 0.14, 0]} rotation={[0, i * 0.25, 0]}>
          <boxGeometry args={[0.5, 0.13, 0.66]} />
          <meshStandardMaterial color={c} roughness={0.8} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Decorative desk clutter flanking the grimoire — potion + crystals on the
 * right, skulls + a book stack on the left. Purely cosmetic, no interaction.
 */
export function Props() {
  const DESK_Y = -0.05; // matches the candle bases in Candles.tsx
  return (
    <group>
      {/* left side */}
      <Skull position={[-3.7, DESK_Y, 1.7]} rotation={0.5} />
      <BookStack position={[-3.6, DESK_Y, 0.4]} />
      {/* right side */}
      <Potion position={[3.6, DESK_Y, 1.6]} />
      <Crystals position={[3.8, DESK_Y, 0.4]} />
      <Skull position={[3.2, DESK_Y, 2.0]} rotation={-0.6} />
    </group>
  );
}
