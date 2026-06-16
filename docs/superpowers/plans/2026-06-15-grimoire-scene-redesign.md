# Grimoire Scene Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the grimoire frontend so a closed book floats in the centre, opens and descends onto a table on click (left page = model, right page = you), with a clickable 3D hourglass that opens history — rendered with a subtle pixel-art look and a much smaller GPU footprint.

**Architecture:** Frontend only; the SSE backend contract is unchanged. The scene phase machine gains a `closed` state (floating book, pre-open) and an `OPEN_BOOK` action. Chat state is read once in `App` and passed as explicit props into the R3F tree (React context does not cross the `<Canvas>` reconciler boundary), where the open book renders its pages as drei `<Html transform>` DOM (crisp fonts, outside the pixelation). Pixelation + the GPU diet come from rendering the WebGL canvas at a low fixed resolution upscaled nearest-neighbour, frozen candle shadow maps, no DepthOfField, and a throttled on-demand frame loop (24fps idle / 30fps thinking, paused when hidden).

**Tech Stack:** Vite + React 19 + TypeScript, @react-three/fiber, @react-three/drei (`Html`, `useCursor`), @react-three/postprocessing, Vitest (jsdom) for pure logic, Playwright for E2E.

---

## Design notes the engineer must know

- **Context does not cross `<Canvas>`.** Do **not** call `useChat()` inside any component under `<Canvas>` (Scene/Grimoire/etc.). `App` reads `useChat()` and passes a `pages` object + callbacks down as props.
- **3D controls need accessible twins.** A mesh `onClick` is mouse-only and invisible to Playwright. Every 3D control has a paired DOM `<button>`: the book gets a visible hint button while floating; the hourglass gets an `sr-only` button. Both call the same handlers as the meshes.
- **WebGL can't run in jsdom.** Pure logic (reducer, `pickFps`) is unit-tested with Vitest. 3D components are verified by `tsc` typecheck + lint, and their behaviour is covered by the Playwright E2E. Do not write Vitest tests that mount `<Canvas>` — they cannot pass in jsdom.
- **Run all commands from `frontend/`.** Paths below are relative to `frontend/`.
- **Starting transforms.** 3D positions/rotations/`distanceFactor` marked "starting transform" are correct in structure; nudge the numbers during the Task 14 visual check so pages seat on the book. This is normal 3D placement, not a placeholder.

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `src/state/sceneState.ts` | phase machine: add `closed` phase + `OPEN_BOOK` | modify |
| `src/state/sceneState.test.ts` | reducer transition tests | modify |
| `src/state/ChatContext.tsx` | expose `openBook()`; load-from-history opens book | modify |
| `src/three/render/framePolicy.ts` | pure `pickFps(phase, reduced)` helper | create |
| `src/three/render/framePolicy.test.ts` | `pickFps` tests | create |
| `src/three/FrameLoopController.tsx` | throttle the demand loop + pause when hidden | create |
| `src/three/FrozenShadows.tsx` | render shadows once, then freeze the shadow map | create |
| `src/three/Candles.tsx` | only 2 casters, 256² maps | modify |
| `src/three/Table.tsx` | the table the book lands on | create |
| `src/three/Hourglass.tsx` | clickable 3D hourglass (hover cursor) | create |
| `src/three/Room.tsx` | remove the lectern | modify |
| `src/three/Grimoire.tsx` | float→descend→open; `<Html>` pages; click | modify |
| `src/three/CameraRig.tsx` | `FLOAT_VIEW`/`READ_VIEW` poses + transition | modify |
| `src/three/Scene.tsx` | low-res render, pixelated, drop DoF, wire controller/shadows/props | modify |
| `src/ui/HourglassButton.tsx` | obsolete corner icon | delete |
| `src/App.tsx` | read chat state, pass props, accessible twins, mount history | modify |
| `src/styles/overlay.css` | pixelated canvas, `.page*`, `.sr-only`; drop `.overlay/.codex/.composer/.tools/.hourglass` | modify |
| `e2e/grimoire.spec.ts` | new open-book + 3D-hourglass flow | modify |

---

### Task 1: Scene state machine — `closed` phase + `OPEN_BOOK`

**Files:**
- Modify: `src/state/sceneState.ts`
- Test: `src/state/sceneState.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the body of `src/state/sceneState.test.ts` with:

```ts
import { it, expect } from "vitest";
import { sceneReducer, initialScene } from "./sceneState";

it("intro -> closed on intro done / skip", () => {
  expect(sceneReducer(initialScene, { type: "INTRO_DONE" }).phase).toBe("closed");
  expect(sceneReducer(initialScene, { type: "SKIP_INTRO" }).phase).toBe("closed");
});
it("closed -> idle on open book", () => {
  const closed = { ...initialScene, phase: "closed" as const };
  expect(sceneReducer(closed, { type: "OPEN_BOOK" }).phase).toBe("idle");
});
it("open book is idempotent from idle", () => {
  const idle = { ...initialScene, phase: "idle" as const };
  expect(sceneReducer(idle, { type: "OPEN_BOOK" }).phase).toBe("idle");
});
it("send -> thinking, done -> idle", () => {
  const idle = { ...initialScene, phase: "idle" as const };
  expect(sceneReducer(idle, { type: "SEND" }).phase).toBe("thinking");
  const thinking = { ...initialScene, phase: "thinking" as const };
  expect(sceneReducer(thinking, { type: "STREAM_DONE" }).phase).toBe("idle");
});
it("history toggles independently of phase", () => {
  const closed = { ...initialScene, phase: "closed" as const };
  const open = sceneReducer(closed, { type: "TOGGLE_HISTORY" });
  expect(open.historyOpen).toBe(true);
  expect(open.phase).toBe("closed");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/state/sceneState.test.ts`
Expected: FAIL — `"closed"` is not assignable / received `"idle"` for the intro transition.

- [ ] **Step 3: Implement the new machine**

Replace `src/state/sceneState.ts` with:

```ts
export type Phase = "intro" | "closed" | "idle" | "thinking";
export interface SceneState { phase: Phase; historyOpen: boolean; }
export const initialScene: SceneState = { phase: "intro", historyOpen: false };

export type SceneAction =
  | { type: "INTRO_DONE" } | { type: "SKIP_INTRO" }
  | { type: "OPEN_BOOK" }
  | { type: "SEND" } | { type: "STREAM_DONE" } | { type: "STREAM_ERROR" }
  | { type: "TOGGLE_HISTORY" };

export function sceneReducer(s: SceneState, a: SceneAction): SceneState {
  switch (a.type) {
    case "INTRO_DONE":
    case "SKIP_INTRO": return { ...s, phase: "closed" };
    case "OPEN_BOOK": return { ...s, phase: "idle" };
    case "SEND": return { ...s, phase: "thinking" };
    case "STREAM_DONE":
    case "STREAM_ERROR": return { ...s, phase: "idle" };
    case "TOGGLE_HISTORY": return { ...s, historyOpen: !s.historyOpen };
    default: return s;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/state/sceneState.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/sceneState.ts src/state/sceneState.test.ts
git commit -m "feat(frontend): add closed phase + OPEN_BOOK to scene machine"
```

---

### Task 2: ChatContext — `openBook()` and load-from-history opens the book

**Files:**
- Modify: `src/state/ChatContext.tsx`

There is no separate unit test (the existing `ChatContext.test.tsx` exercises the provider; it must keep passing). This task wires the new action through.

- [ ] **Step 1: Add `openBook` to the context type**

In `src/state/ChatContext.tsx`, change the `ChatValue` interface to add `openBook`:

```ts
interface ChatValue {
  messages: Message[]; reasoning: string; phase: string; historyOpen: boolean;
  send: (q: string) => Promise<void>;
  loadConversation: (c: Conversation) => void;
  openBook: () => void;
  toggleHistory: () => void; skipIntro: () => void; introDone: () => void;
}
```

- [ ] **Step 2: Make loading a conversation also open the book**

Replace the `loadConversation` callback with:

```ts
  const loadConversation = useCallback((c: Conversation) => {
    convId.current = c.id; setMessages(c.messages); setReasoning("");
    dispatch({ type: "OPEN_BOOK" });
    if (scene.historyOpen) dispatch({ type: "TOGGLE_HISTORY" });
  }, [scene.historyOpen]);
```

- [ ] **Step 3: Expose `openBook` from the provider**

In the `Ctx.Provider value={{ ... }}` object, add the `openBook` line (next to `send`/`loadConversation`):

```ts
      send, loadConversation,
      openBook: () => dispatch({ type: "OPEN_BOOK" }),
      toggleHistory: () => dispatch({ type: "TOGGLE_HISTORY" }),
      skipIntro: () => dispatch({ type: "SKIP_INTRO" }),
      introDone: () => dispatch({ type: "INTRO_DONE" }),
```

- [ ] **Step 4: Verify the provider tests still pass and it typechecks**

Run: `npx vitest run src/state/ChatContext.test.tsx`
Expected: PASS.
Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/state/ChatContext.tsx
git commit -m "feat(frontend): expose openBook(); loading history opens the book"
```

---

### Task 3: Frame policy helper

**Files:**
- Create: `src/three/render/framePolicy.ts`
- Test: `src/three/render/framePolicy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/three/render/framePolicy.test.ts`:

```ts
import { it, expect } from "vitest";
import { pickFps } from "./framePolicy";

it("idle/closed render alive but light at 24fps", () => {
  expect(pickFps("idle", false)).toBe(24);
  expect(pickFps("closed", false)).toBe(24);
});
it("thinking and intro render smoother at 30fps", () => {
  expect(pickFps("thinking", false)).toBe(30);
  expect(pickFps("intro", false)).toBe(30);
});
it("reduced motion pauses the throttle (0 = on-demand only)", () => {
  expect(pickFps("idle", true)).toBe(0);
  expect(pickFps("thinking", true)).toBe(0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/three/render/framePolicy.test.ts`
Expected: FAIL — cannot find module `./framePolicy`.

- [ ] **Step 3: Implement the helper**

Create `src/three/render/framePolicy.ts`:

```ts
export type RenderPhase = "intro" | "closed" | "idle" | "thinking";

/**
 * Frames-per-second for the on-demand render loop given the scene phase.
 * 0 means "do not throttle-drive the loop" — render only on explicit
 * invalidate(), which keeps a reduced-motion scene calm and cheap.
 */
export function pickFps(phase: RenderPhase, reduced: boolean): number {
  if (reduced) return 0;
  if (phase === "thinking" || phase === "intro") return 30;
  return 24; // closed / idle: alive but light
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/three/render/framePolicy.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/three/render/framePolicy.ts src/three/render/framePolicy.test.ts
git commit -m "feat(frontend): pickFps frame-rate policy for the demand loop"
```

---

### Task 4: FrameLoopController

**Files:**
- Create: `src/three/FrameLoopController.tsx`

Verified by typecheck (Task 14) and E2E; no jsdom unit test (needs a live `<Canvas>`).

- [ ] **Step 1: Implement the controller**

Create `src/three/FrameLoopController.tsx`:

```tsx
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

interface Props {
  /** target fps; 0 = do not drive the loop (render only on invalidate) */
  fps: number;
}

/**
 * Drives the on-demand render loop at a fixed cadence and pauses when the tab
 * or window loses visibility/focus. With frameloop="demand", each invalidate()
 * renders exactly one frame, so this caps GPU work to `fps` while the scene
 * stays alive. Always fires one frame on change so transitions are not missed.
 */
export function FrameLoopController({ fps }: Props) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate(); // ensure at least one fresh frame when fps/phase changes
    if (fps <= 0) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (timer === undefined && document.visibilityState === "visible") {
        timer = setInterval(() => invalidate(), 1000 / fps);
      }
    };
    const stop = () => {
      if (timer !== undefined) { clearInterval(timer); timer = undefined; }
    };
    const onVisibility = () =>
      document.visibilityState === "visible" ? start() : stop();

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", stop);
    window.addEventListener("focus", start);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", stop);
      window.removeEventListener("focus", start);
    };
  }, [fps, invalidate]);

  return null;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/three/FrameLoopController.tsx
git commit -m "feat(frontend): throttle the demand loop + pause when hidden"
```

---

### Task 5: Freeze candle shadows (the biggest GPU win)

**Files:**
- Create: `src/three/FrozenShadows.tsx`
- Modify: `src/three/Candles.tsx`

The 4 candle point-lights each cast cubemap shadows recomputed every frame. The candles never translate (only intensity flickers), so the shadows are static — render them once, then freeze. Also cut to 2 casters at 256².

- [ ] **Step 1: Implement the freeze component**

Create `src/three/FrozenShadows.tsx`:

```tsx
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Candle positions never move (only their intensity flickers), so their shadow
 * maps are effectively static. Let the renderer draw shadows for the first two
 * frames, then request one final update and switch autoUpdate off so the GPU
 * stops re-rendering point-light cubemaps every frame.
 */
export function FrozenShadows() {
  const gl = useThree((s) => s.gl);
  const frame = useRef(0);

  useFrame(() => {
    frame.current += 1;
    if (frame.current === 2) {
      gl.shadowMap.needsUpdate = true; // one last full update…
      gl.shadowMap.autoUpdate = false; // …then stop auto-updating
    }
  });

  return null;
}
```

- [ ] **Step 2: Cut shadow casters to 2 at 256²**

Replace `src/three/Candles.tsx` with:

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: no errors. (`FrozenShadows` is mounted in Task 6.)

- [ ] **Step 4: Commit**

```bash
git add src/three/FrozenShadows.tsx src/three/Candles.tsx
git commit -m "perf(frontend): freeze candle shadow maps; 2 casters at 256"
```

---

### Task 6: Scene — low-res pixelation, drop DoF, wire controller/shadows/props

**Files:**
- Modify: `src/three/Scene.tsx`

This is the rendering core. The scene now takes chat `pages` props (threaded to `Grimoire`) plus click handlers, renders at `PIXEL_SCALE` resolution with `antialias:false`, drops `DepthOfField`, mounts `FrameLoopController` + `FrozenShadows`, and always uses `frameloop="demand"`.

- [ ] **Step 1: Replace `src/three/Scene.tsx`**

```tsx
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
```

- [ ] **Step 2: Typecheck (expect missing-module/prop errors until later tasks land)**

Run: `npx tsc -b`
Expected: errors referencing `./Table`, `./Hourglass`, `Grimoire` props, `CameraRig` props — these are created/updated in Tasks 8–11. That is expected at this checkpoint; do not "fix" by stubbing. Proceed.

- [ ] **Step 3: Commit**

```bash
git add src/three/Scene.tsx
git commit -m "perf(frontend): low-res pixelated render, drop DoF, wire loop/shadows"
```

---

### Task 7: CSS — pixelated canvas, page surfaces, sr-only, drop dead rules

**Files:**
- Modify: `src/styles/overlay.css`

- [ ] **Step 1: Make the canvas upscale nearest-neighbour**

At the top of `src/styles/overlay.css` (after the header comment, before `:root`), add:

```css
/* Low-res WebGL buffer upscaled with hard pixels → the pixel-art grain.
   The DOM pages/popup render above this, crisp and unpixelated. */
.scene-canvas {
  image-rendering: pixelated;
}
```

- [ ] **Step 2: Replace the overlay/codex/composer/tools/hourglass blocks with page styles**

Delete these now-unused blocks entirely: `.overlay`, `.overlay > *`, `.codex`, `.codex::before`, `.composer`, `.hourglass`, `.hourglass:hover`, `.hourglass--active`, `.hourglass__sand`, and `.tools`. In their place add the page-surface styles (the `.chat-panel`, `.bubble*`, `.reasoning*`, `.ink-input*`, `.drawer*`, `.skip-intro` blocks all stay):

```css
/* ---- accessible twins for the 3D controls ---- */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ---- a hint button while the closed book floats ---- */
.open-book-hint {
  position: fixed;
  left: 50%; bottom: 12%;
  transform: translateX(-50%);
  z-index: 15;
  all: unset;
  pointer-events: auto;
  cursor: pointer;
  font-family: var(--serif-display);
  font-style: italic;
  letter-spacing: 0.05em;
  color: var(--parchment);
  opacity: 0.78;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.85);
  animation: candle-pulse 3.2s ease-in-out infinite;
}
.open-book-hint:hover { opacity: 1; }

/* ---- a single open page rendered inside a drei <Html> plane ---- */
.page {
  width: 320px;
  color: var(--ink);
  font-family: var(--serif-body);
  font-size: 1.02rem;
  line-height: 1.6;
  /* The parchment itself is the 3D mesh; keep the DOM transparent so only
     ink shows on the page. */
  background: transparent;
  user-select: text;
}
.page--left { /* model: conversation + reasoning */ }
.page--right { display: flex; flex-direction: column; justify-content: flex-end; }
.page .chat-panel { max-height: 18rem; }
```

- [ ] **Step 3: Drop the reduced-motion line that referenced `.hourglass`**

In the `@media (prefers-reduced-motion: reduce)` block at the bottom, change:

```css
  .drawer, .drawer__panel, .ink-input__quill, .hourglass { transition: none; }
```

to:

```css
  .drawer, .drawer__panel, .ink-input__quill { transition: none; }
  .open-book-hint { animation: none; }
```

- [ ] **Step 4: Verify the build still parses the CSS**

Run: `npx vite build`
Expected: build succeeds (JS may still fail to typecheck via `tsc` in later-unbuilt state, but `vite build` runs `tsc -b` first per package.json — if `tsc` errors, that is the expected Task 6 state; you may instead verify CSS by `npx stylelint` if available, otherwise defer the full build to Task 14). Skip hard verification here; CSS is validated in the Task 14 build.

- [ ] **Step 5: Commit**

```bash
git add src/styles/overlay.css
git commit -m "style(frontend): pixelated canvas, page surfaces, sr-only; drop overlay"
```

---

### Task 8: Table + remove the lectern

**Files:**
- Create: `src/three/Table.tsx`
- Modify: `src/three/Room.tsx`

- [ ] **Step 1: Create the table**

Create `src/three/Table.tsx`:

```tsx
import { useMemo } from "react";
import * as THREE from "three";

/**
 * The wooden table the grimoire descends onto. The top sits at y = -0.45 so the
 * open book (which rests around y = -0.2) reads as lying on the surface, with
 * the candles and hourglass arranged across it.
 */
export function Table() {
  const timber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a1d11", roughness: 0.85, metalness: 0.05 }),
    [],
  );
  const leg: [number, number, number][] = [
    [-3.2, -1.4, 1.3], [3.2, -1.4, 1.3], [-3.2, -1.4, -1.3], [3.2, -1.4, -1.3],
  ];

  return (
    <group>
      {/* table top */}
      <mesh position={[0, -0.45, -0.1]} receiveShadow castShadow material={timber}>
        <boxGeometry args={[8, 0.22, 3.6]} />
      </mesh>
      {/* legs */}
      {leg.map((p, i) => (
        <mesh key={i} position={p} material={timber} castShadow>
          <boxGeometry args={[0.25, 1.9, 0.25]} />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Remove the lectern from `Room.tsx`**

In `src/three/Room.tsx`, delete the two lectern meshes (the comment and the two `<mesh>` elements at the end of the returned group):

```tsx
      {/* lectern: a slim pillar + a slanted top the book sits on */}
      <mesh position={[0, -1.3, -0.4]} material={timber} castShadow>
        <cylinderGeometry args={[0.55, 0.8, 1.8, 8]} />
      </mesh>
      <mesh position={[0, -0.35, -0.2]} rotation={[-0.32, 0, 0]} material={timber} castShadow>
        <boxGeometry args={[2.8, 0.18, 2.0]} />
      </mesh>
```

The `timber` material is now unused in `Room.tsx` — delete its `useMemo` declaration and update the doc comment from "plus a lectern that the grimoire rests on" to "the grimoire floats at its centre". Keep `stone` and the floor/walls.

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: still the expected Task 6 errors about `Grimoire`/`CameraRig` props; no new errors from `Table`/`Room`.

- [ ] **Step 4: Commit**

```bash
git add src/three/Table.tsx src/three/Room.tsx
git commit -m "feat(frontend): add table, remove lectern"
```

---

### Task 9: CameraRig — float view and reading-angle descent

**Files:**
- Modify: `src/three/CameraRig.tsx`

- [ ] **Step 1: Replace `src/three/CameraRig.tsx`**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: remaining errors only about `Grimoire`/`Hourglass` (Tasks 10–11); none from `CameraRig`.

- [ ] **Step 3: Commit**

```bash
git add src/three/CameraRig.tsx
git commit -m "feat(frontend): float view + reading-angle descent in CameraRig"
```

---

### Task 10: Grimoire — float, descend, open, and `<Html>` pages

**Files:**
- Modify: `src/three/Grimoire.tsx`

The book floats closed at `FLOAT_Y` with a gentle bob, descends to `TABLE_Y` and splays open when `open` is true. Clicking the book calls `onOpen`. When open, each page hosts its DOM via drei `<Html transform>`.

- [ ] **Step 1: Replace `src/three/Grimoire.tsx`**

```tsx
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
```

Note: `drei`'s `Html` accepts `pointerEvents` as a prop in current versions; if `tsc` rejects it, drop the `pointerEvents="auto"` attribute (it is the default) rather than casting.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: remaining error only about `./Hourglass` (Task 11); none from `Grimoire`.

- [ ] **Step 3: Commit**

```bash
git add src/three/Grimoire.tsx
git commit -m "feat(frontend): floating book that descends, opens, and renders Html pages"
```

---

### Task 11: Hourglass — clickable 3D model

**Files:**
- Create: `src/three/Hourglass.tsx`

- [ ] **Step 1: Create the hourglass**

Create `src/three/Hourglass.tsx`:

```tsx
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  onClick: () => void;
}

const GLASS = "#caa45f";
const FRAME = "#3b2a16";

/**
 * A small hourglass standing on the table to one side. Clicking it opens the
 * history popup. Two cones tip-to-tip make the glass; thin discs cap the frame.
 * It hovers-cursors and tilts slightly on hover to read as interactive.
 */
export function Hourglass({ onClick }: Props) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = hovered ? Math.sin(t * 6) * 0.06 : 0;
  });

  return (
    <group
      ref={group}
      position={[2.8, -0.05, 0.5]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
    >
      {/* upper glass */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <coneGeometry args={[0.22, 0.36, 16]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.55} roughness={0.2} emissive="#6b531f" emissiveIntensity={hovered ? 0.5 : 0.25} />
      </mesh>
      {/* lower glass */}
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.22, 0.36, 16]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.55} roughness={0.2} emissive="#6b531f" emissiveIntensity={hovered ? 0.5 : 0.25} />
      </mesh>
      {/* frame caps */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 16]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 16]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: now only errors in `App.tsx`/`Scene.tsx` wiring resolved by Task 12. The three module is clean.

- [ ] **Step 3: Commit**

```bash
git add src/three/Hourglass.tsx
git commit -m "feat(frontend): clickable 3D hourglass"
```

---

### Task 12: App — wire props, accessible twins, history popup

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/ui/HourglassButton.tsx`

The pages now live inside the 3D book, so `App` no longer renders the `.overlay`. It reads chat state once, passes a `pages` object + handlers to `Scene`, renders accessible twin buttons for the book/hourglass, the skip-intro affordance during `intro`, and the screen-space `HistoryDrawer` driven by the 3D hourglass.

- [ ] **Step 1: Delete the obsolete corner icon**

```bash
git rm src/ui/HourglassButton.tsx
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { ChatProvider, useChat } from "./state/ChatContext";
import { Scene } from "./three/Scene";
import { HistoryDrawer } from "./ui/HistoryDrawer";
import type { RenderPhase } from "./three/render/framePolicy";
import "./styles/overlay.css";

function Grimoire() {
  const {
    messages, reasoning, phase, historyOpen,
    send, loadConversation, openBook, toggleHistory, skipIntro, introDone,
  } = useChat();

  const [skip, setSkip] = useState(false);
  const [revision, setRevision] = useState(0);
  const prevPhase = useRef(phase);

  // Reduced motion: skip the cinematic fly-in (the book still floats closed and
  // is opened by click) so the scene starts calm.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSkip(true);
      skipIntro();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After each thinking→idle transition a conversation was just saved; refresh.
  useEffect(() => {
    if (prevPhase.current === "thinking" && phase === "idle") {
      setRevision(r => r + 1);
    }
    prevPhase.current = phase;
  }, [phase]);

  const thinking = phase === "thinking";
  const bookOpen = phase === "idle" || phase === "thinking";
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
  const hasAnswer = !!lastAssistant?.content;

  const handleSkip = () => { setSkip(true); skipIntro(); };

  return (
    <>
      <Scene
        phase={phase as RenderPhase}
        bookOpen={bookOpen}
        skip={skip}
        onIntroDone={introDone}
        onBookClick={openBook}
        onHourglassClick={toggleHistory}
        pages={{
          messages, reasoning, thinking, hasAnswer,
          inputDisabled: thinking, onSubmit: send,
        }}
      />

      {phase === "intro" && (
        <button className="skip-intro" onClick={handleSkip}>
          saltar la intro →
        </button>
      )}

      {/* Accessible twin: the floating book is opened by clicking the mesh; this
          gives keyboard users and tests a real focusable control. */}
      {phase === "closed" && (
        <button className="open-book-hint" onClick={openBook}>
          abrir el grimorio
        </button>
      )}

      {/* Accessible twin for the 3D hourglass. */}
      {bookOpen && (
        <button className="sr-only" onClick={toggleHistory} aria-pressed={historyOpen}>
          Conversaciones pasadas
        </button>
      )}

      <HistoryDrawer
        open={historyOpen}
        revision={revision}
        onSelect={loadConversation}
        onClose={toggleHistory}
        onChanged={() => setRevision(r => r + 1)}
      />
    </>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <Grimoire />
    </ChatProvider>
  );
}
```

- [ ] **Step 3: Typecheck the whole app**

Run: `npx tsc -b`
Expected: no errors anywhere.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors. (If lint flags an unused import in `Room.tsx`, remove it.)

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(frontend): wire pages/handlers into Scene; accessible twins; drop overlay"
```

---

### Task 13: E2E — open the book, ask, revisit from history

**Files:**
- Modify: `e2e/grimoire.spec.ts`

The flow gains an explicit "open the book" step (via the accessible twin) before the input exists, and history opens via the hourglass twin.

- [ ] **Step 1: Replace the test body**

Replace `e2e/grimoire.spec.ts` with:

```ts
import { test, expect } from "@playwright/test";

const SSE_BODY =
  'event: reasoning\ndata: {"delta":"Consultando los tomos antiguos"}\n\n' +
  'event: status\ndata: {"state":"searching"}\n\n' +
  'event: answer\ndata: {"delta":"La espada reposa en el Templo del Alba."}\n\n' +
  'event: done\ndata: {}\n\n';

test.beforeEach(async ({ page }) => {
  await page.route("**/api/ask/stream", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: SSE_BODY,
    });
  });
});

test("open the book, ask, then revisit it from history", async ({ page }) => {
  await page.goto("/");

  // The 3D scene keeps the main thread busy; dispatch DOM clicks directly so
  // React onClick handlers fire deterministically.
  const click = (sel: ReturnType<typeof page.getByRole>) => sel.dispatchEvent("click");

  // Skip the cinematic intro if its affordance is still on screen.
  const skip = page.getByRole("button", { name: /saltar la intro/i });
  if (await skip.isVisible().catch(() => false)) {
    await click(skip);
  }

  // The closed book floats; open it via its accessible twin.
  const openBook = page.getByRole("button", { name: /abrir el grimorio/i });
  await expect(openBook).toBeVisible();
  await click(openBook);

  const input = page.getByRole("textbox", { name: /consulta para el grimorio/i });
  await expect(input).toBeVisible();

  const question = "¿Dónde está la Master Sword?";
  await input.fill(question);
  await input.press("Enter");

  await expect(page.getByText("La espada reposa en el Templo del Alba.")).toBeVisible();
  await expect(page.getByText(question)).toBeVisible();

  const reasoningToggle = page.getByRole("button", { name: /razonamiento/i });
  await expect(reasoningToggle).toBeVisible();
  await click(reasoningToggle);
  await expect(page.getByText(/Consultando los tomos antiguos/)).toBeVisible();

  // Open history via the hourglass twin; the conversation should be listed.
  await click(page.getByRole("button", { name: /conversaciones pasadas/i }));
  const historyEntry = page.getByRole("button", { name: question });
  await expect(historyEntry).toBeVisible();

  // Reopen it and confirm the messages are restored in the conversation log.
  await click(historyEntry);
  const log = page.getByRole("log");
  await expect(log.getByText("La espada reposa en el Templo del Alba.")).toBeVisible();
  await expect(log.getByText(question)).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npx playwright test`
Expected: PASS. If the book/input is not yet interactive because `<Html>` mounts a frame late, the `expect(input).toBeVisible()` auto-waits; no change needed. If `getByText(question)` is ambiguous (matches both the page bubble and the history list), scope it like the existing `log.getByText(...)` usage.

- [ ] **Step 3: Commit**

```bash
git add e2e/grimoire.spec.ts
git commit -m "test(frontend): E2E for open-book flow + hourglass history"
```

---

### Task 14: Full verification + visual seating of the pages

**Files:** none (verification + small transform nudges only).

- [ ] **Step 1: Unit + typecheck + lint + build**

```bash
npx vitest run
npx tsc -b
npm run lint
npx vite build
```
Expected: all green.

- [ ] **Step 2: Visual check — seat the pages and confirm the GPU diet**

Run: `npm run dev`, open the served URL. Confirm, and nudge only the marked starting transforms if needed:

- Intro flies in to the floating **closed** book; the "abrir el grimorio" hint shows.
- Clicking the book opens it, it descends to the table, and the camera tilts to the reading angle.
- The **left** page shows the conversation/reasoning, the **right** page holds the input. If the DOM does not sit on the pages, adjust the `<Html>` `position`/`distanceFactor` in `Grimoire.tsx` (left/right symmetric) until the text rests on each page.
- The 3D hourglass hovers a pointer cursor and opens history on click; selecting an entry rewrites the pages.
- The scene reads as subtly pixelated (raise `PIXEL_SCALE` toward 0.6 if too chunky, lower toward 0.35 if not enough).
- In the browser task manager, the GPU process sits far lower than before and **drops further when the tab is backgrounded**; idle holds ~24fps.

- [ ] **Step 3: Commit any transform nudges**

```bash
git add -A
git commit -m "chore(frontend): seat Html pages and tune pixel scale"
```

(If nothing changed, skip this commit.)

---

## Self-Review

**Spec coverage:**
- Floating closed book → click opens + descends → Tasks 1,2,9,10,12. ✓
- Left page = model, right page = you, drei `<Html>` anchored → Task 10. ✓
- Candle lights the table → Tasks 5,8 (candles unchanged in position; table added). ✓
- Clickable 3D hourglass → history popup → Tasks 11,12. ✓
- Book stays open all session; intro kept → no "close" action exists; intro path in CameraRig/App. ✓
- Subtle pixelation via low-res + nearest upscale, antialias off, fonts crisp (DOM above canvas) → Tasks 6,7. ✓
- GPU diet: frozen shadows, no DoF, 24/30fps throttled demand loop, pause when hidden → Tasks 4,5,6. ✓
- Backend untouched; fonts unchanged → no backend tasks; `--serif-*` vars retained. ✓
- Tests updated (Vitest reducer/policy, Playwright flow) → Tasks 1,3,13. ✓

**Placeholder scan:** No TBD/TODO. The only soft items are 3D `position`/`distanceFactor` values, explicitly framed as starting transforms with a tuning step in Task 14 — inherent to 3D placement, not skipped work.

**Type consistency:** `RenderPhase`/`Phase` share the string union `intro|closed|idle|thinking`; `PageProps` is defined in `Grimoire.tsx` and imported by `Scene.tsx`; `pickFps` signature matches its use in `Scene.tsx`; `openBook` added to `ChatValue` and consumed in `App.tsx`. `Scene` props (`onBookClick`/`onHourglassClick`/`pages`) match `App`'s call and `Grimoire`/`Hourglass`/`CameraRig` signatures.
