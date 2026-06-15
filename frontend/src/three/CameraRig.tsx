import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  /** play the cinematic fly-in; when false the camera is already settled */
  intro: boolean;
  skip: boolean;
  onIntroDone: () => void;
}

const START = new THREE.Vector3(0, 6.5, 16);
const SETTLED = new THREE.Vector3(0, 1.1, 5.2);
const LOOK = new THREE.Vector3(0, 0.1, -0.2);

/**
 * Drives the camera. On first load it flies from a high, distant vantage down
 * toward the open book over ~3.2s, then hands control to a gentle idle drift.
 * `skip` jumps straight to the settled pose. `onIntroDone` fires once.
 */
export function CameraRig({ intro, skip, onIntroDone }: Props) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const done = useRef(false);
  const DURATION = 3.2;

  // Initialise pose depending on whether we're playing the intro.
  useEffect(() => {
    if (intro && !skip) {
      camera.position.copy(START);
    } else {
      camera.position.copy(SETTLED);
      done.current = true;
    }
    camera.lookAt(LOOK);
  }, [camera, intro, skip]);

  useEffect(() => {
    if (skip && !done.current) {
      done.current = true;
      camera.position.copy(SETTLED);
      camera.lookAt(LOOK);
      onIntroDone();
    }
  }, [skip, camera, onIntroDone]);

  useFrame((state, delta) => {
    if (!done.current) {
      elapsed.current += delta;
      const t = Math.min(elapsed.current / DURATION, 1);
      // easeInOutCubic
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      camera.position.lerpVectors(START, SETTLED, e);
      camera.lookAt(LOOK);
      if (t >= 1) {
        done.current = true;
        onIntroDone();
      }
    } else {
      // gentle idle drift — breathe around the settled pose
      const t = state.clock.elapsedTime;
      camera.position.x = SETTLED.x + Math.sin(t * 0.25) * 0.22;
      camera.position.y = SETTLED.y + Math.sin(t * 0.18) * 0.12;
      camera.position.z = SETTLED.z + Math.cos(t * 0.2) * 0.1;
      camera.lookAt(LOOK);
    }
  });

  return null;
}
