# Grimoire Procedural Refresh — Design

**Date:** 2026-06-15
**Scope:** Frontend only (`frontend/`, Vite + React + R3F). No backend / SSE / font changes.
**Status:** Approved (design phase). Supersedes nothing — extends the merged
[grimoire-scene-redesign](../../../) (master `bb374a3`).

## Goal

Move the existing 3D grimoire scene toward the *mood* of the "reimagined"
pixel-art reference images (dark-fantasy dungeon, purple + gold, magenta gem,
candles, side props) **while keeping the real Three.js/R3F scene**. We are NOT
switching to 2D illustrations and NOT importing external image assets — every
new visual is built procedurally with geometry, materials, and colors.

The functional core is unchanged: **Chat** (input + reasoning stream on the open
book) and **History** (clickable hourglass → drawer). Everything added here is
decorative atmosphere.

## Decisions (from brainstorming)

- **Approach:** keep the 3D scene, improve the look. Not 2D, not hybrid.
- **Assets:** 100% procedural — no external images/textures.
- **Performance:** *look first*; reuse the pixelated render (dpr 0.45), allow a
  small amount of extra cost (e.g. one gem light, more props) where it pays off,
  optimize afterward only if needed.
- **Palette:** warm + purple blend. Candles stay warm amber; walls, gem, and
  accents go purple/violet + gold.
- **HTML UI:** minimal — an "IA WIKI" wordmark + gem icon only. NO nav menu,
  search, avatar, or bottom feature cards.

## Architecture

Incremental, modular upgrade of the current component tree (`Scene.tsx` keeps
its structure: Room, Table, Grimoire, Hourglass, Candles, DustParticles,
CameraRig, FrameLoopController, FrozenShadows, postprocessing). New detail lives
in small, isolated components plus one shared palette module, rather than one
large rewrite.

### 1. Palette module — `three/palette.ts` (new)

Single source of truth for the warm+purple blend. Exports named color constants
(and a few material factories if convenient) consumed by every component, so the
look stays coherent and is tweakable from one file.

Indicative values (tunable during implementation):

| Token            | Value                | Use                                  |
|------------------|----------------------|--------------------------------------|
| `STONE_DARK`     | `#241b30`            | wall base, violet-tinted stone       |
| `STONE_LIGHT`    | `#2e2240`            | wall highlight / arch                 |
| `GOLD`           | `#d4a23a`            | book ornament, accents                |
| `GOLD_BRIGHT`    | `#f0c060`            | gold highlights / bloom catch         |
| `GEM`            | `#c64bff`            | grimoire gem (emissive), crystals     |
| `GEM_BRIGHT`     | `#e879ff`            | gem core / glow                       |
| `RIBBON`         | `#5b3a8c`            | page bookmark ribbon                  |
| `PARCHMENT`      | `#e8dcc0`            | open-book page surface                |
| `LEATHER`        | `#5a1d22`            | grimoire cover leather                |
| `CANDLE_WARM`    | (existing amber)     | candle flames / warm bounce           |

### 2. Environment — `Room.tsx` (rewritten) + helpers

Replace the dark void with a procedural dungeon:

- **Walls:** keep the floor + back wall + two angled side walls, but recolor to
  violet-tinted stone from the palette (subtle light/dark variation, e.g. a
  second material or vertex tint — no textures).
- **Gothic arch:** a simple arch silhouette behind the grimoire (geometry:
  extruded shape or a ring/torus segment + columns). Frames the book like the
  references.
- **Bookshelf silhouettes:** rows of thin boxes (= book spines) on the side
  walls, built with `InstancedMesh` so they are cheap. Read as background
  shelves, not individually modeled books.

Helpers may be split into small components (e.g. `Arch`, `Bookshelves`) under
`three/` if `Room.tsx` grows past one clear purpose.

### 3. Grimoire detail — `Grimoire.tsx` / `CoverArt` + page CSS

- **Cover:** red leather color (`LEATHER`), keep the existing gold ornament
  (`CoverArt`: border, sigil ring, corner studs), and make the central **gem
  emissive magenta** with a small dedicated point light for glow. Cost is one
  extra light (allowed under "look first").
- **Pages:** the open-book pages render via drei `<Html>`, so restyling is
  cheap CSS — add an **ornate border**, a **violet bookmark ribbon** down the
  spine, and a drop-cap on the "El grimorio aguarda…" intro text. The chat input
  styling on the right page is preserved (only its frame is dressed up).

### 4. Side props — `three/Props.tsx` (new)

Low-poly procedural clutter on the table flanking the grimoire:

- a **potion** bottle with purple liquid (emissive-ish),
- **1–2 skulls** (simple sculpted/low-poly geometry),
- **violet crystals** (cones/octahedra, faintly emissive),
- a **small stack of books**.

Each is cheap geometry; grouped and positioned so they don't crowd the
read-pose camera framing. Placement respects the existing CameraRig poses.

### 5. Minimal HTML UI — `App.tsx` + `styles/overlay.css`

A decorative **"IA WIKI" wordmark + gem icon** in a top corner, as a DOM overlay
above the canvas. Purely cosmetic; no routing, no menu, no search, no avatar, no
bottom cards. Styled to match the palette (gold/violet). Must not block pointer
events on the canvas controls.

### 6. Lighting & postprocessing — `Scene.tsx`

- Keep the violet "altar" spotlight and warm candles; add the gem point light.
- Tune `ambientLight` / `hemisphereLight` toward the warm+purple blend.
- Keep `EffectComposer` (Bloom + Vignette) and the pixelated render
  (`PIXEL_SCALE = 0.45`, `antialias: false`).
- "Look first": extra lights/props are acceptable; if fps suffers noticeably we
  optimize at the end (reduce light count, instance more, lower prop detail).

## Data flow

Unchanged. No new state, no new props across the `<Canvas>` boundary beyond what
already exists. New components are presentational (read palette constants, take
simple position/agitation props where relevant). The `agitation`/`reduced`
signals already threaded through the scene can drive subtle prop/gem reactions
if desired, but that is optional polish, not required.

## Testing

- **No Playwright** (explicit user request) — do not add or run E2E browser
  tests for this work.
- Existing Vitest unit tests (reducer, `framePolicy`, history, stream client)
  must stay green.
- `tsc -b` must stay clean and `vite build` must succeed.
- WebGL can't run in jsdom, so the 3D pieces are verified by type-check + build
  + the user's own visual inspection at the dev server, not automated tests.

## Out of scope

- Nav menu, search bar, avatar, bottom feature cards.
- External image/texture assets; 2D illustrated backdrops.
- Backend, SSE contract, fonts.
- Playwright / browser E2E tests.
- Unrelated refactors or the pre-existing lint baseline issues.

## Risks

- **Performance regression** from added geometry/lights. Mitigation: instanced
  bookshelves, low-poly props, single gem light, pixelated render retained;
  "look first" accepts some cost with end-of-work optimization as the fallback.
- **Procedural ceiling:** procedural geometry won't match the illustrated detail
  of the reference images. Mitigation: agreed expectation — we target the
  *mood/atmosphere*, not 1:1 fidelity.
