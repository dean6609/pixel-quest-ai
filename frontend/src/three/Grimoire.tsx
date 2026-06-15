import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Message } from "../lib/types";
import { ChatPanel } from "../ui/ChatPanel";
import { ReasoningStream } from "../ui/ReasoningStream";
import { InkInput } from "../ui/InkInput";

const COVER = "#3b1d12";
const PAGE = "#e9dcb8";
const FLOAT_Y = 1.4;   // floating, closed, centre
const TABLE_Y = -0.2;  // resting open on the table

/** Everything the open pages need to render the conversation. */
export interface PageProps {
  messages: Message[];
  reasoning: string;
  thinking: boolean;
  hasAnswer: boolean;
  inputDisabled: boolean;
  onSubmit: (q: string) => void;
}

interface Props {
  open: boolean;
  agitation?: number;
  reduced: boolean;
  onOpen: () => void;
  pages: PageProps;
}

export function Grimoire({ open, agitation = 0, reduced, onOpen, pages }: Props) {
  const root = useRef<THREE.Group>(null);
  const leftCover = useRef<THREE.Group>(null);
  const rightCover = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const k = reduced ? 1 : 1 - Math.pow(0.001, delta); // frame-rate independent
    const t = state.clock.elapsedTime;

    // book body: descend to the table when open; bob gently while floating
    if (root.current) {
      const baseY = open ? TABLE_Y : FLOAT_Y;
      const bob = open || reduced ? 0 : Math.sin(t * 0.8) * 0.08;
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, baseY + bob, k);
      const targetYaw = open ? 0 : Math.sin(t * 0.15) * 0.25;
      root.current.rotation.y = reduced ? targetYaw : THREE.MathUtils.lerp(root.current.rotation.y, targetYaw, k);
    }

    // covers: flat together when closed (~±4°), splayed when open (~±78°)
    const target = open ? THREE.MathUtils.degToRad(78) : THREE.MathUtils.degToRad(4);
    if (leftCover.current)
      leftCover.current.rotation.y = THREE.MathUtils.lerp(leftCover.current.rotation.y, -target, k);
    if (rightCover.current)
      rightCover.current.rotation.y = THREE.MathUtils.lerp(rightCover.current.rotation.y, target, k);

    if (glow.current) {
      const pulse = 0.5 + Math.sin(t * 2.2) * 0.5;
      glow.current.intensity = (open ? 1.2 : 0.35) + agitation * (1.5 + pulse * 2);
    }
  });

  return (
    <group
      ref={root}
      position={[0, FLOAT_Y, -0.1]}
      rotation={[-0.32, 0, 0]}
      onClick={(e) => { if (!open) { e.stopPropagation(); onOpen(); } }}
      onPointerOver={() => { if (!open) document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      {/* spine */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.5, 2.1]} />
        <meshStandardMaterial color={COVER} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* left half (cover + page + model's page DOM) */}
      <group ref={leftCover} position={[-0.09, 0, 0]}>
        <mesh position={[-1.4, 0, 0]} castShadow>
          <boxGeometry args={[2.8, 0.12, 2.1]} />
          <meshStandardMaterial color={COVER} roughness={0.55} metalness={0.12} />
        </mesh>
        <mesh position={[-1.4, 0.075, 0]}>
          <boxGeometry args={[2.6, 0.04, 1.95]} />
          <meshStandardMaterial color={PAGE} roughness={0.9} emissive="#caa45f" emissiveIntensity={0.12} />
        </mesh>
        {open && (
          // starting transform: lay the DOM flat on the page (+Y) facing up
          <Html transform position={[-1.4, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} distanceFactor={2.6} occlude={false} pointerEvents="auto">
            <div className="page page--left">
              <ChatPanel messages={pages.messages} thinking={pages.thinking} />
              <ReasoningStream reasoning={pages.reasoning} hasAnswer={pages.hasAnswer} thinking={pages.thinking} />
            </div>
          </Html>
        )}
      </group>

      {/* right half (cover + page + your input DOM) */}
      <group ref={rightCover} position={[0.09, 0, 0]}>
        <mesh position={[1.4, 0, 0]} castShadow>
          <boxGeometry args={[2.8, 0.12, 2.1]} />
          <meshStandardMaterial color={COVER} roughness={0.55} metalness={0.12} />
        </mesh>
        <mesh position={[1.4, 0.075, 0]}>
          <boxGeometry args={[2.6, 0.04, 1.95]} />
          <meshStandardMaterial color={PAGE} roughness={0.9} emissive="#caa45f" emissiveIntensity={0.12} />
        </mesh>
        {open && (
          <Html transform position={[1.4, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} distanceFactor={2.6} occlude={false} pointerEvents="auto">
            <div className="page page--right">
              <InkInput onSubmit={pages.onSubmit} disabled={pages.inputDisabled} />
            </div>
          </Html>
        )}
      </group>

      {/* mystical glow rising from the spread */}
      <pointLight ref={glow} position={[0, 0.6, 0]} color="#ffd98a" intensity={0.35} distance={6} decay={2} />
    </group>
  );
}
