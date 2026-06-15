import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  /** play the cinematic fly-in toward the floating closed book */
  intro: boolean;
  /** book is open on the table → frame the reading angle */
  open: boolean;
  skip: boolean;
  reduced: boolean;
  onIntroDone: () => void;
}

const START = new THREE.Vector3(0, 6.5, 16);
// Facing the closed book floating at centre.
const FLOAT_POS = new THREE.Vector3(0, 1.7, 6.6);
const FLOAT_LOOK = new THREE.Vector3(0, 1.4, 0);
// Descended, tilted down over the open book on the table.
const READ_POS = new THREE.Vector3(0, 2.4, 4.4);
const READ_LOOK = new THREE.Vector3(0, -0.2, -0.3);

/**
 * Drives the camera. On first load it flies from a high vantage down to the
 * floating book (FLOAT). When the book opens it eases to a reading angle over
 * the table (READ). A gentle idle drift breathes around the active pose.
 */
export function CameraRig({ intro, open, skip, reduced, onIntroDone }: Props) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const introDone = useRef(false);
  // 0 = at FLOAT, 1 = at READ; eased toward the target each frame.
  const openT = useRef(0);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const DURATION = 3.2;

  useEffect(() => {
    if (intro && !skip && !reduced) {
      camera.position.copy(START);
    } else {
      camera.position.copy(FLOAT_POS);
      introDone.current = true;
    }
    camera.lookAt(FLOAT_LOOK);
  }, [camera, intro, skip, reduced]);

  useEffect(() => {
    if ((skip || reduced) && !introDone.current) {
      introDone.current = true;
      camera.position.copy(FLOAT_POS);
      camera.lookAt(FLOAT_LOOK);
      onIntroDone();
    }
  }, [skip, reduced, camera, onIntroDone]);

  useFrame((state, delta) => {
    // 1) intro fly-in to FLOAT
    if (!introDone.current) {
      elapsed.current += delta;
      const t = Math.min(elapsed.current / DURATION, 1);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      camera.position.lerpVectors(START, FLOAT_POS, e);
      camera.lookAt(FLOAT_LOOK);
      if (t >= 1) { introDone.current = true; onIntroDone(); }
      return;
    }

    // 2) ease the FLOAT→READ blend toward the open state
    const target = open ? 1 : 0;
    const k = reduced ? 1 : 1 - Math.pow(0.0009, delta);
    openT.current = THREE.MathUtils.lerp(openT.current, target, k);

    pos.current.lerpVectors(FLOAT_POS, READ_POS, openT.current);
    look.current.lerpVectors(FLOAT_LOOK, READ_LOOK, openT.current);

    // 3) gentle idle drift around the active pose (skipped when reduced)
    if (!reduced) {
      const t = state.clock.elapsedTime;
      pos.current.x += Math.sin(t * 0.25) * 0.18;
      pos.current.y += Math.sin(t * 0.18) * 0.10;
      pos.current.z += Math.cos(t * 0.2) * 0.08;
    }
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });

  return null;
}
