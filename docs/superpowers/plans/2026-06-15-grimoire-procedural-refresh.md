# Grimoire Procedural Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the existing 3D grimoire scene toward the dark-fantasy / purple+gold "reimagined" mood (dungeon environment, detailed grimoire, side props, minimal "IA WIKI" wordmark) — entirely procedurally, keeping the real R3F scene and the Chat+History core.

**Architecture:** Incremental, modular upgrade of the current component tree. A new `three/palette.ts` is the single source of truth for the warm+purple blend; `Room.tsx` is rewritten into a procedural dungeon (violet stone, gothic arch, instanced bookshelves); `Grimoire.tsx` gets leather + an emissive magenta gem + a violet spine ribbon; a new `three/Props.tsx` adds potion/skulls/crystals/books; `overlay.css` dresses the open pages and adds the "IA WIKI" wordmark.

**Tech Stack:** Vite + React 19 + TypeScript, `@react-three/fiber` v9, `@react-three/drei` v10, `three` 0.184, `@react-three/postprocessing`. Vitest for the one unit-testable module. No Playwright (explicit user request).

**Spec:** `docs/superpowers/specs/2026-06-15-grimoire-procedural-refresh-design.md`

**Verification reality:** WebGL cannot run in jsdom and there is no Playwright here, so the 3D tasks are verified by `tsc -b` (clean) + `vite build` (succeeds) + commit, with the user doing visual inspection at the dev server in the follow-up session. Only `palette.ts` has a real unit test. Run all commands from `frontend/`.

**Baseline note:** `npm run lint` is NOT green on this repo (pre-existing strict `react-hooks` flags on untouched files). Do NOT gate tasks on lint. Gate on `tsc -b`, `vite build`, and `vitest`.

---

### Task 1: Palette module

**Files:**
- Create: `frontend/src/three/palette.ts`
- Test: `frontend/src/three/palette.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// frontend/src/three/palette.test.ts
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { PALETTE } from "./palette";

describe("PALETTE", () => {
  it("exposes every documented token as a parseable hex color", () => {
    const keys = [
      "STONE_DARK", "STONE_LIGHT", "GOLD", "GOLD_BRIGHT",
      "GEM", "GEM_BRIGHT", "RIBBON", "PARCHMENT", "LEATHER", "CANDLE_WARM",
    ] as const;
    for (const k of keys) {
      expect(PALETTE[k], k).toMatch(/^#[0-9a-fA-F]{6}$/);
      // throws if three cannot parse it
      expect(() => new THREE.Color(PALETTE[k])).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/three/palette.test.ts`
Expected: FAIL — cannot resolve `./palette`.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/three/palette.ts

/**
 * Single source of truth for the grimoire scene's warm + purple palette.
 * Candles stay warm amber; walls, gem, and accents go violet + gold.
 * Tune values here — every scene component reads from this object.
 */
export const PALETTE = {
  STONE_DARK: "#241b30",   // wall base, violet-tinted stone
  STONE_LIGHT: "#2e2240",  // wall highlight / arch face
  GOLD: "#d4a23a",         // book ornament, accents
  GOLD_BRIGHT: "#f0c060",  // gold highlights that catch the bloom
  GEM: "#c64bff",          // grimoire gem + crystals (emissive)
  GEM_BRIGHT: "#e879ff",   // gem core / glow color
  RIBBON: "#5b3a8c",       // page bookmark ribbon
  PARCHMENT: "#e8dcc0",    // open-book page surface
  LEATHER: "#5a1d22",      // grimoire cover leather
  CANDLE_WARM: "#ffb053",  // candle light (matches existing Candles.tsx)
} as const;

export type PaletteToken = keyof typeof PALETTE;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/three/palette.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/three/palette.ts frontend/src/three/palette.test.ts
git commit -m "feat(frontend): palette module for warm+purple scene blend"
```

---

### Task 2: Recolor the room to violet-tinted stone

**Files:**
- Modify: `frontend/src/three/Room.tsx`

Replace the single dark-brown stone material with two violet-stone materials from the palette (a base and a slightly lighter highlight for the back wall) so the chamber reads purple instead of brown. Geometry layout (floor + back + two angled side walls) is unchanged.

- [ ] **Step 1: Rewrite `Room.tsx`**

```tsx
// frontend/src/three/Room.tsx
import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE } from "./palette";

/**
 * A dim stone chamber: floor, back and side walls where the grimoire floats
 * at its centre. Geometry is deliberately simple — atmosphere comes from the
 * lighting, palette, and postprocessing, not polygon count.
 */
export function Room() {
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PALETTE.STONE_DARK, roughness: 1, metalness: 0 }),
    [],
  );
  const stoneLit = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PALETTE.STONE_LIGHT, roughness: 1, metalness: 0 }),
    [],
  );

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow material={stone}>
        <planeGeometry args={[40, 40]} />
      </mesh>
      {/* back wall — slightly lighter so the arch + book read against it */}
      <mesh position={[0, 4, -9]} receiveShadow material={stoneLit}>
        <planeGeometry args={[40, 24]} />
      </mesh>
      {/* side walls, angled inward to frame the book */}
      <mesh position={[-11, 4, -2]} rotation={[0, Math.PI / 5, 0]} receiveShadow material={stone}>
        <planeGeometry args={[24, 24]} />
      </mesh>
      <mesh position={[11, 4, -2]} rotation={[0, -Math.PI / 5, 0]} receiveShadow material={stone}>
        <planeGeometry args={[24, 24]} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc -b && npx vite build`
Expected: both succeed, no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/three/Room.tsx
git commit -m "feat(frontend): violet-tinted dungeon stone from palette"
```

---

### Task 3: Gothic arch behind the grimoire

**Files:**
- Create: `frontend/src/three/Arch.tsx`
- Modify: `frontend/src/three/Scene.tsx` (import + render `<Arch />`)

A simple stone arch silhouette set against the back wall, framing the book like the reference images. Built from two side columns (boxes) and a half-ring lintel (`torusGeometry`, half arc) so it stays cheap and fully procedural.

- [ ] **Step 1: Create `Arch.tsx`**

```tsx
// frontend/src/three/Arch.tsx
import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE } from "./palette";

/**
 * A gothic stone arch standing just in front of the back wall, framing the
 * floating grimoire. Two columns + a half-ring lintel — procedural, no textures.
 */
export function Arch() {
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PALETTE.STONE_LIGHT, roughness: 1, metalness: 0 }),
    [],
  );
  const HALF = 3.4;   // half the arch span (X)
  const COL_H = 7;    // column height (Y)
  const COL_W = 0.7;  // column thickness
  const baseY = -2.2; // floor level (matches Room)

  return (
    <group position={[0, 0, -8.4]} material={stone}>
      {/* columns */}
      <mesh position={[-HALF, baseY + COL_H / 2, 0]} material={stone}>
        <boxGeometry args={[COL_W, COL_H, COL_W]} />
      </mesh>
      <mesh position={[HALF, baseY + COL_H / 2, 0]} material={stone}>
        <boxGeometry args={[COL_W, COL_H, COL_W]} />
      </mesh>
      {/* half-ring lintel sitting on the columns; rotated so the arc opens down */}
      <mesh position={[0, baseY + COL_H, 0]} rotation={[0, 0, 0]} material={stone}>
        <torusGeometry args={[HALF, COL_W / 2, 6, 24, Math.PI]} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Render it in the Scene**

In `frontend/src/three/Scene.tsx`, add the import near the other scene imports (after `import { Room } from "./Room";`):

```tsx
import { Arch } from "./Arch";
```

Then inside the `<Suspense fallback={null}>` block, add `<Arch />` immediately after `<Room />`:

```tsx
      <Suspense fallback={null}>
        <Room />
        <Arch />
        <Table />
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc -b && npx vite build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/three/Arch.tsx frontend/src/three/Scene.tsx
git commit -m "feat(frontend): gothic stone arch framing the grimoire"
```

---

### Task 4: Instanced bookshelf silhouettes

**Files:**
- Create: `frontend/src/three/Bookshelves.tsx`
- Modify: `frontend/src/three/Scene.tsx` (import + render `<Bookshelves />`)

Rows of thin book-spine boxes on the two angled side walls, rendered with a single `InstancedMesh` so the whole shelf is one draw call. Spines get slightly varied heights/colors (set per-instance) to read as a packed shelf rather than a uniform grid.

- [ ] **Step 1: Create `Bookshelves.tsx`**

```tsx
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
```

- [ ] **Step 2: Render it in the Scene**

In `frontend/src/three/Scene.tsx`, add the import after the `Arch` import:

```tsx
import { Bookshelves } from "./Bookshelves";
```

Add `<Bookshelves />` right after `<Arch />` inside the `<Suspense>` block:

```tsx
        <Room />
        <Arch />
        <Bookshelves />
        <Table />
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc -b && npx vite build`
Expected: both succeed. (If `args={[undefined, undefined, COUNT]}` trips the R3F types, use `args={[new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial(), COUNT] as const}` and drop the child geometry/material — but try the child-element form first; it is the standard drei/R3F pattern.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/three/Bookshelves.tsx frontend/src/three/Scene.tsx
git commit -m "feat(frontend): instanced bookshelf silhouettes on side walls"
```

---

### Task 5: Grimoire leather + emissive magenta gem + violet spine ribbon

**Files:**
- Modify: `frontend/src/three/Grimoire.tsx`

Three changes, all in `Grimoire.tsx`:
1. Cover color → `PALETTE.LEATHER`; gold ornament → `PALETTE.GOLD`.
2. Central gem → emissive magenta (`PALETTE.GEM` / `GEM_BRIGHT`) with a small dedicated `pointLight` for glow.
3. Recolor the spine binding toward violet leather and add a thin **ribbon** box hanging below the spine (the bookmark from the references).

- [ ] **Step 1: Swap the cover/ornament/gem constants**

In `frontend/src/three/Grimoire.tsx`, add the palette import after the existing imports:

```tsx
import { PALETTE } from "./palette";
```

Replace the top-of-file color constants:

```tsx
const COVER = "#3b1d12";
const PAGE = "#e9dcb8";
```

with:

```tsx
const COVER = PALETTE.LEATHER;
const PAGE = PALETTE.PARCHMENT;
```

Replace the ornament constants:

```tsx
const GOLD = "#9c7b3a";
const GEM = "#6a1f33";
```

with:

```tsx
const GOLD = PALETTE.GOLD;
const GEM = PALETTE.GEM;
```

- [ ] **Step 2: Make the gem emissive magenta with its own light**

In the `CoverArt` component, replace the gem mesh:

```tsx
      <mesh position={[0, -0.06, 0]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={GEM} emissive="#400f1e" emissiveIntensity={0.6} metalness={0.3} roughness={0.3} />
      </mesh>
```

with the emissive gem plus a small glow light:

```tsx
      <mesh position={[0, -0.06, 0]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color={GEM}
          emissive={PALETTE.GEM_BRIGHT}
          emissiveIntensity={1.4}
          metalness={0.3}
          roughness={0.25}
          toneMapped={false}
        />
      </mesh>
      {/* magenta glow cast by the gem */}
      <pointLight position={[0, -0.4, 0]} color={PALETTE.GEM_BRIGHT} intensity={2.2} distance={3.5} decay={2} />
```

- [ ] **Step 3: Recolor the spine + add the hanging ribbon**

In the `Grimoire` component, replace the spine binding mesh:

```tsx
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[HINGE_X * 2, BLOCK_T, D + 0.14]} />
          <meshStandardMaterial color="#5a3320" roughness={0.7} metalness={0.08} emissive="#2a160c" emissiveIntensity={0.18} />
        </mesh>
```

with a violet-leather spine plus a ribbon hanging off the front edge of the spine:

```tsx
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[HINGE_X * 2, BLOCK_T, D + 0.14]} />
          <meshStandardMaterial color={PALETTE.RIBBON} roughness={0.7} metalness={0.08} emissive="#1a0f2a" emissiveIntensity={0.2} />
        </mesh>
        {/* violet bookmark ribbon hanging from the spine, past the page edge */}
        <mesh position={[0, -BLOCK_T / 2 - 0.4, D / 2 + 0.05]}>
          <boxGeometry args={[0.22, 0.9, 0.02]} />
          <meshStandardMaterial color={PALETTE.RIBBON} emissive={PALETTE.GEM} emissiveIntensity={0.12} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
```

- [ ] **Step 4: Type-check + build**

Run: `npx tsc -b && npx vite build`
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/three/Grimoire.tsx
git commit -m "feat(frontend): leather grimoire with emissive magenta gem + violet ribbon"
```

---

### Task 6: Side props (potion, skulls, crystals, book stack)

**Files:**
- Create: `frontend/src/three/Props.tsx`
- Modify: `frontend/src/three/Scene.tsx` (import + render `<Props />`)

Low-poly procedural clutter on the desk flanking the grimoire. Positions are chosen to sit on the table surface (the desk in `Candles.tsx` is around `y ≈ -0.05 … 0`) and outside the open book's central footprint so they don't collide with the read-pose framing. No new lights except a faint emissive on the crystals/potion (material emissive, not a light).

- [ ] **Step 1: Create `Props.tsx`**

```tsx
// frontend/src/three/Props.tsx
import * as THREE from "three";
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
```

- [ ] **Step 2: Render it in the Scene**

In `frontend/src/three/Scene.tsx`, add the import after the `Bookshelves` import:

```tsx
import { Props } from "./Props";
```

Add `<Props />` after `<Candles ... />` inside the `<Suspense>` block:

```tsx
        <Candles agitation={agitation} />
        <Props />
        <DustParticles pull={agitation} />
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc -b && npx vite build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/three/Props.tsx frontend/src/three/Scene.tsx
git commit -m "feat(frontend): procedural desk props — potion, skulls, crystals, books"
```

---

### Task 7: Dress the open pages (ornate border + drop-cap)

**Files:**
- Modify: `frontend/src/styles/overlay.css`

The open pages render via drei `<Html>` with a transparent DOM over the parchment mesh, so this is pure CSS. Add a subtle gold inset border to each page and a drop-cap on the intro prompt. (The violet ribbon is the 3D mesh from Task 5; no CSS needed for it.)

- [ ] **Step 1: Add page-border + drop-cap CSS**

In `frontend/src/styles/overlay.css`, replace the page block:

```css
.page--left { /* model: conversation + reasoning */ }
.page--right { display: flex; flex-direction: column; justify-content: flex-end; }
.page .chat-panel { max-height: 18rem; }
```

with the dressed version:

```css
.page--left { /* model: conversation + reasoning */ }
.page--right { display: flex; flex-direction: column; justify-content: flex-end; }
.page .chat-panel { max-height: 18rem; }

/* faint gilt inset frame on each open page */
.page {
  position: relative;
  padding: 0.6rem 0.8rem;
}
.page::before {
  content: "";
  position: absolute;
  inset: 0.15rem;
  border: 1px solid rgba(212, 162, 58, 0.35); /* PALETTE.GOLD @ low alpha */
  border-radius: 2px;
  pointer-events: none;
}

/* illuminated drop-cap on the opening prompt */
.chat-panel--empty .chat-panel__prompt::first-letter {
  font-family: var(--serif-display);
  font-size: 2.6em;
  font-weight: 600;
  float: left;
  line-height: 0.8;
  padding: 0.05em 0.12em 0 0;
  color: var(--ember);
}
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc -b && npx vite build`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/overlay.css
git commit -m "feat(frontend): gilt page borders + illuminated drop-cap on open pages"
```

---

### Task 8: Minimal "IA WIKI" wordmark + gem icon

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles/overlay.css`

A purely decorative top-left wordmark — a small gem glyph (CSS-drawn diamond) + the "IA WIKI" text — layered above the canvas. No menu, search, avatar, or routing. Must not block pointer events on the canvas controls.

- [ ] **Step 1: Render the wordmark in `App.tsx`**

In `frontend/src/App.tsx`, add the wordmark as the first child of the returned fragment in the inner `Grimoire` component, just before `<Scene ... />`:

```tsx
  return (
    <>
      <div className="brand" aria-hidden="true">
        <span className="brand__gem" />
        <span className="brand__name">IA WIKI</span>
      </div>

      <Scene
```

(Leave the rest of the returned JSX unchanged.)

- [ ] **Step 2: Add wordmark CSS**

Append to `frontend/src/styles/overlay.css`:

```css
/* ---- decorative brand wordmark (top-left) ---- */
.brand {
  position: fixed;
  top: 1.1rem; left: 1.3rem;
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  pointer-events: none; /* never steal clicks from the canvas */
  user-select: none;
}
.brand__gem {
  width: 16px; height: 16px;
  transform: rotate(45deg);
  background: linear-gradient(135deg, #e879ff, #c64bff); /* GEM_BRIGHT -> GEM */
  box-shadow: 0 0 12px 2px rgba(200, 75, 255, 0.6);
  border: 1px solid rgba(240, 192, 96, 0.7); /* gold rim */
}
.brand__name {
  font-family: var(--serif-display);
  letter-spacing: 0.18em;
  font-size: 1.15rem;
  color: var(--parchment);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.85);
}
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc -b && npx vite build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/styles/overlay.css
git commit -m "feat(frontend): decorative IA WIKI wordmark + gem glyph"
```

---

### Task 9: Lighting tune + final verification

**Files:**
- Modify: `frontend/src/three/Scene.tsx`

Nudge the ambient/hemisphere lights toward the warm+purple blend so the new violet stone and props sit in mood, then run the full verification suite. Keep the pixelated render (`PIXEL_SCALE = 0.45`), Bloom, and Vignette.

- [ ] **Step 1: Tune the scene lights**

In `frontend/src/three/Scene.tsx`, add the palette import after the framePolicy import:

```tsx
import { PALETTE } from "./palette";
```

Replace the ambient + hemisphere lights:

```tsx
      <ambientLight intensity={0.06} color="#5a4a8f" />
      <hemisphereLight intensity={0.05} color="#6b5a9a" groundColor="#1a120a" />
```

with a slightly richer blend (cool violet sky fill, warm amber ground bounce):

```tsx
      <ambientLight intensity={0.08} color={PALETTE.STONE_LIGHT} />
      <hemisphereLight intensity={0.06} color={PALETTE.GEM} groundColor={PALETTE.CANDLE_WARM} />
```

- [ ] **Step 2: Full verification**

Run each and confirm:

```bash
npx tsc -b
npx vite build
npx vitest run
```

Expected:
- `tsc -b`: no errors.
- `vite build`: succeeds.
- `vitest run`: all tests pass (existing suite + `palette.test.ts`). Confirm the count is ≥ the pre-existing total + 1.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/three/Scene.tsx
git commit -m "feat(frontend): tune ambient/hemisphere toward warm+purple blend"
```

- [ ] **Step 4: Visual checkpoint (handoff)**

This is for the implementing session, not automatable here: run `npm run dev` in `frontend/`, open the dev server, and visually confirm against the reference images — violet dungeon with arch + shelves, leather grimoire with glowing magenta gem + ribbon, desk props, "IA WIKI" wordmark, dressed pages. Note any positions/intensities to tweak (props placement, gem glow, light levels are the expected tuning knobs) and iterate on the relevant task's file.

---

## Self-Review notes

- **Spec coverage:** palette (T1) ✓; dungeon environment — stone (T2), arch (T3), shelves (T4) ✓; grimoire detail — leather/gem/ribbon (T5), page CSS (T7) ✓; side props (T6) ✓; minimal HTML UI wordmark+gem (T8) ✓; lighting/postprocessing tune keeping pixelated render (T9) ✓. No nav/search/avatar/cards (out of scope) ✓. No Playwright ✓.
- **Types:** `PALETTE` token names are consistent across all tasks; `Props`, `Arch`, `Bookshelves` are default-free named exports imported by `Scene.tsx`.
- **Known tuning knobs (expected, not failures):** prop positions vs. table surface, gem/crystal emissive levels, and arch/shelf placement are visual values to verify in Task 9's checkpoint — the plan calls this out rather than pretending pixel-perfect values.
```
