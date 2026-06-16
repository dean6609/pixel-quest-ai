import { Suspense, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Room } from "./Room";
import { Table } from "./Table";
import { Candles } from "./Candles";
import { DustParticles } from "./DustParticles";
import { Grimoire, type PageProps } from "./Grimoire";
import { Hourglass } from "./Hourglass";
import { CameraRig } from "./CameraRig";
import { FrameLoopController } from "./FrameLoopController";
import { FrozenShadows } from "./FrozenShadows";
import { pickFps, type RenderPhase } from "./render/framePolicy";

/** Internal render resolution as a fraction of CSS pixels. Lower = chunkier
 *  pixels + less GPU. ~0.45 reads as a subtle pixel-art grain. */
const PIXEL_SCALE = 0.45;

interface Props {
  phase: RenderPhase;
  bookOpen: boolean;
  skip: boolean;
  onIntroDone: () => void;
  onBookClick: () => void;
  onHourglassClick: () => void;
  pages: PageProps;
}

/** Subscribe to the prefers-reduced-motion media query. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function Scene({
  phase, bookOpen, skip, onIntroDone, onBookClick, onHourglassClick, pages,
}: Props) {
  const thinking = phase === "thinking";
  const agitation = thinking ? 1 : 0;
  const reduced = usePrefersReducedMotion();
  const fps = pickFps(phase, reduced);

  return (
    <Canvas
      className="scene-canvas"
      frameloop="demand"
      shadows
      dpr={PIXEL_SCALE}
      gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ fov: 42, near: 0.1, far: 100, position: [0, 6.5, 16] }}
    >
      <color attach="background" args={["#0a0807"]} />
      <fog attach="fog" args={["#0a0807", 9, 26]} />

      <ambientLight intensity={0.06} color="#5a4a8f" />
      <hemisphereLight intensity={0.05} color="#6b5a9a" groundColor="#1a120a" />

      {/* Cold shaft from above that picks the grimoire out of the dark — a
          dark-fantasy "altar" key light on the book. */}
      <spotLight
        position={[0, 7, 1.5]}
        angle={0.5}
        penumbra={0.8}
        decay={1.5}
        distance={26}
        intensity={45}
        color="#b9b0ff"
      />

      <Suspense fallback={null}>
        <Room />
        <Table />
        <Grimoire open={bookOpen} agitation={agitation} reduced={reduced} onOpen={onBookClick} pages={pages} />
        <Hourglass onClick={onHourglassClick} />
        <Candles agitation={agitation} />
        <DustParticles pull={agitation} />
      </Suspense>

      <CameraRig intro={phase === "intro"} open={bookOpen} skip={skip} reduced={reduced} onIntroDone={onIntroDone} />
      <FrameLoopController fps={fps} />
      <FrozenShadows />

      <EffectComposer>
        <Bloom intensity={0.7 + agitation * 0.5} luminanceThreshold={0.25} luminanceSmoothing={0.85} mipmapBlur />
        <Vignette eskil={false} offset={0.28} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
