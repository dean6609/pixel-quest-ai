// frontend/src/three/Bookshelves.tsx
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "./palette";

const SPINE_COLORS = [PALETTE.LEATHER, PALETTE.RIBBON, PALETTE.STONE_LIGHT, PALETTE.GOLD];

/** One shelf wall = ROWS × COLS spines, all drawn as a single InstancedMesh. */
function ShelfWall({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const ROWS = 4;
  const COLS = 10;
  const COUNT = ROWS * COLS;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const color = new THREE.Color();
    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const h = 0.7 + ((r * 7 + c * 13) % 5) * 0.07; // pseudo-random height
        pos.set((c - COLS / 2 + 0.5) * 0.34, (r - ROWS / 2 + 0.5) * 1.2, 0);
        scl.set(0.26, h, 0.5);
        m.compose(pos, quat, scl);
        mesh.setMatrixAt(i, m);
        color.set(SPINE_COLORS[(r + c) % SPINE_COLORS.length]);
        mesh.setColorAt(i, color);
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} castShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.85} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}

/** Background shelves on both angled side walls. */
export function Bookshelves() {
  return (
    <group>
      <ShelfWall position={[-9.5, 3.2, -2]} rotationY={Math.PI / 5} />
      <ShelfWall position={[9.5, 3.2, -2]} rotationY={-Math.PI / 5} />
    </group>
  );
}
