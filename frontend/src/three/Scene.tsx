import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import { Room } from "./Room";
import { Candles } from "./Candles";
import { DustParticles } from "./DustParticles";
import { Grimoire } from "./Grimoire";
import { CameraRig } from "./CameraRig";

interface Props {
  phase: string;          // "intro" | "idle" | "thinking"
  bookOpen: boolean;
  skip: boolean;
  onIntroDone: () => void;
}

export function Scene({ phase, bookOpen, skip, onIntroDone }: Props) {
  const thinking = phase === "thinking";
  const agitation = thinking ? 1 : 0;

  return (
    <Canvas
      className="scene-canvas"
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ fov: 42, near: 0.1, far: 100, position: [0, 6.5, 16] }}
    >
      <color attach="background" args={["#0a0807"]} />
      <fog attach="fog" args={["#0a0807", 9, 26]} />

      {/* a whisper of ambient so the dark never goes fully black */}
      <ambientLight intensity={0.06} color="#5a4a8f" />
      <hemisphereLight intensity={0.05} color="#6b5a9a" groundColor="#1a120a" />

      <Suspense fallback={null}>
        <Room />
        <Grimoire open={bookOpen} agitation={agitation} />
        <Candles agitation={agitation} />
        <DustParticles pull={agitation} />
      </Suspense>

      <CameraRig intro={phase === "intro"} skip={skip} onIntroDone={onIntroDone} />

      <EffectComposer>
        <DepthOfField focusDistance={0.012} focalLength={0.04} bokehScale={3} />
        <Bloom intensity={0.9 + agitation * 0.6} luminanceThreshold={0.25} luminanceSmoothing={0.85} mipmapBlur />
        <Vignette eskil={false} offset={0.28} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
