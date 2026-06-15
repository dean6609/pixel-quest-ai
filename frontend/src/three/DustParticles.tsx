import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  count?: number;
  /** 0 = idle drift, 1 = drawn toward the book while thinking */
  pull?: number;
}

/**
 * Slow-drifting motes of dust caught in the candlelight. Points are cheap and
 * read beautifully through the Bloom pass. While `pull` rises, motes ease
 * toward the book at the origin, as if the grimoire is inhaling.
 */
export function DustParticles({ count = 320, pull = 0 }: Props) {
  const points = useRef<THREE.Points>(null);

  const { positions, speeds, homes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const homes = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = Math.random() * 9 - 2;
      const z = (Math.random() - 0.5) * 12 - 1;
      positions.set([x, y, z], i * 3);
      homes.set([x, y, z], i * 3);
      speeds[i] = 0.1 + Math.random() * 0.3;
    }
    return { positions, speeds, homes };
  }, [count]);

  useFrame((state, delta) => {
    const geo = points.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      // gentle rising + lateral sway around home
      let y = arr[ix + 1] + speeds[i] * delta * 0.4;
      if (y > 7.5) y = -2;
      arr[ix + 1] = y;
      arr[ix] = homes[ix] + Math.sin(t * speeds[i] + i) * 0.5;
      arr[ix + 2] = homes[ix + 2] + Math.cos(t * speeds[i] * 0.7 + i) * 0.4;
      // pull toward the book (origin-ish)
      if (pull > 0) {
        arr[ix] += (0 - arr[ix]) * pull * 0.01;
        arr[ix + 1] += (0.5 - arr[ix + 1]) * pull * 0.01;
        arr[ix + 2] += (0 - arr[ix + 2]) * pull * 0.01;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffca7a"
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
