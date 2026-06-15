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

const FLOAT_Y = 1.55; // floating, closed, centre
const TABLE_Y = -0.25; // resting open on the table

// Book proportions (local "open-flat" reference frame: pages in the XZ plane,
// facing +Y, spine running along Z at x = 0, leaves splaying along ±X).
const D = 2.9; // page depth (Z)
const LEAF_W = 2.0; // cover/page width along X when the book is open
const COVER_T = 0.12; // cover board thickness
const BLOCK_T = 0.34; // page-stack thickness — gives the closed book its heft
const HINGE_X = 0.2; // half the spine width; where each leaf is hinged
const SURFACE_Y = BLOCK_T / 2 + 0.015; // top of the page stack (where ink sits)

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

/**
 * The grimoire. Each side is a "leaf" (outer cover + page stack) hinged on the
 * spine axis (Z). Closed, both leaves stand upright and fold together into a
 * thick tome whose cover faces the camera; clicking it turns the book square,
 * lowers it to the table, and splays the leaves flat so the anchored <Html>
 * pages (left = model, right = you) lie face-up under the reading camera.
 */
export function Grimoire({ open, agitation = 0, reduced, onOpen, pages }: Props) {
  const root = useRef<THREE.Group>(null);
  const centre = useRef<THREE.Group>(null);
  const leftLeaf = useRef<THREE.Group>(null);
  const rightLeaf = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const coverLight = useRef<THREE.PointLight>(null);
  // 0 = closed/standing, 1 = open/flat. Eased toward the target each frame so
  // the whole book turns, descends, and opens as one motion.
  const openT = useRef(0);

  useFrame((state, delta) => {
    const k = reduced ? 1 : 1 - Math.pow(0.0016, delta); // frame-rate independent
    const t = state.clock.elapsedTime;
    openT.current = reduced
      ? open
        ? 1
        : 0
      : THREE.MathUtils.lerp(openT.current, open ? 1 : 0, k);
    const o = openT.current;

    if (root.current) {
      const baseY = THREE.MathUtils.lerp(FLOAT_Y, TABLE_Y, o);
      const bob = open || reduced ? 0 : Math.sin(t * 0.8) * 0.07;
      root.current.position.y = baseY + bob;
      const sway = open || reduced ? 0 : Math.sin(t * 0.5) * 0.12;
      // closed: turned -90° so the front cover faces the camera; open: square.
      root.current.rotation.y = THREE.MathUtils.lerp(-Math.PI / 2, 0, o) + sway;
      root.current.rotation.x = THREE.MathUtils.lerp(0.05, 0, o);
    }

    // Re-centre the upright closed book on the look point (its leaves grow +Y).
    if (centre.current) centre.current.position.y = THREE.MathUtils.lerp(-LEAF_W / 2, 0, o);

    // Hinge the leaves: upright (±90°) when closed → coplanar (0) when open.
    if (leftLeaf.current) leftLeaf.current.rotation.z = THREE.MathUtils.lerp(-Math.PI / 2, 0, o);
    if (rightLeaf.current) rightLeaf.current.rotation.z = THREE.MathUtils.lerp(Math.PI / 2, 0, o);

    if (glow.current) {
      const pulse = 0.5 + Math.sin(t * 2.2) * 0.5;
      glow.current.intensity = (open ? 1.1 : 0.3) + agitation * (1.5 + pulse * 2);
    }
    // Raking fill on the cover while the book stands closed; fades as it opens.
    if (coverLight.current) coverLight.current.intensity = (1 - o) * 6;
  });

  return (
    <group
      ref={root}
      position={[0, FLOAT_Y, -0.1]}
      rotation={[0.05, -Math.PI / 2, 0]}
      onClick={(e) => {
        if (!open) {
          e.stopPropagation();
          onOpen();
        }
      }}
      onPointerOver={() => {
        if (!open) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {/* Warm fill that rakes the camera-facing cover while closed (local +X
          maps toward the camera under the closed −90° yaw); fades on open. */}
      <pointLight ref={coverLight} position={[3.2, 0.4, 0]} color="#ffb86b" intensity={6} distance={9} decay={2} />

      <group ref={centre} position={[0, -LEAF_W / 2, 0]}>
        {/* spine binding between the two hinges, flush with the page tops so the
            gutter reads as a leather strip rather than a dark groove */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[HINGE_X * 2, BLOCK_T, D + 0.14]} />
          <meshStandardMaterial color="#5a3320" roughness={0.7} metalness={0.08} emissive="#2a160c" emissiveIntensity={0.18} />
        </mesh>

        {/* LEFT leaf (model's page) — hinged at -HINGE_X, extends -X when open */}
        <group ref={leftLeaf} position={[-HINGE_X, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh position={[-LEAF_W / 2, -(BLOCK_T / 2 + COVER_T / 2), 0]} castShadow>
            <boxGeometry args={[LEAF_W + 0.14, COVER_T, D + 0.14]} />
            <meshStandardMaterial color={COVER} roughness={0.55} metalness={0.12} />
          </mesh>
          <mesh position={[-LEAF_W / 2, 0, 0]} castShadow>
            <boxGeometry args={[LEAF_W, BLOCK_T, D]} />
            <meshStandardMaterial color={PAGE} roughness={0.9} emissive="#caa45f" emissiveIntensity={0.1} />
          </mesh>
          {open && (
            <Html
              transform
              position={[-LEAF_W / 2, SURFACE_Y, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              distanceFactor={2.4}
              occlude={false}
              pointerEvents="auto"
            >
              <div className="page page--left">
                <ChatPanel messages={pages.messages} thinking={pages.thinking} />
                <ReasoningStream reasoning={pages.reasoning} hasAnswer={pages.hasAnswer} thinking={pages.thinking} />
              </div>
            </Html>
          )}
        </group>

        {/* RIGHT leaf (your input) — hinged at +HINGE_X, extends +X when open */}
        <group ref={rightLeaf} position={[HINGE_X, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh position={[LEAF_W / 2, -(BLOCK_T / 2 + COVER_T / 2), 0]} castShadow>
            <boxGeometry args={[LEAF_W + 0.14, COVER_T, D + 0.14]} />
            <meshStandardMaterial color={COVER} roughness={0.55} metalness={0.12} />
          </mesh>
          <mesh position={[LEAF_W / 2, 0, 0]} castShadow>
            <boxGeometry args={[LEAF_W, BLOCK_T, D]} />
            <meshStandardMaterial color={PAGE} roughness={0.9} emissive="#caa45f" emissiveIntensity={0.1} />
          </mesh>
          {open && (
            <Html
              transform
              position={[LEAF_W / 2, SURFACE_Y, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              distanceFactor={2.4}
              occlude={false}
              pointerEvents="auto"
            >
              <div className="page page--right">
                <InkInput onSubmit={pages.onSubmit} disabled={pages.inputDisabled} />
              </div>
            </Html>
          )}
        </group>

        {/* mystical glow rising from the spread */}
        <pointLight ref={glow} position={[0, 0.6, 0]} color="#ffd98a" intensity={0.3} distance={6} decay={2} />
      </group>
    </group>
  );
}
