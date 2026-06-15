# Grimoire Scene Redesign — Floating Book, 3D Hourglass, Subtle Pixel-Art + GPU Diet

Date: 2026-06-15
Status: Approved (pending spec review)
Scope: Frontend only (`frontend/`). Backend SSE contract unchanged.

## Goal

Rebuild the grimoire scene composition and interaction toward the original
vision, while making it render with a **subtle pixel-art** look and a much
**smaller GPU footprint** (the current scene pegs the GPU and spins up fans).
These ship as **one combined effort**: the interaction redesign reshapes the
scene, so performance and pixelation are baked in from the start rather than
applied to soon-to-change code.

## Target Experience

1. **Intro (kept):** camera flies in toward a book **floating in the centre,
   closed**, gently bobbing, then settles facing it. With
   `prefers-reduced-motion` the fly-in is skipped (as today).
2. **Click the book:** it **opens and descends to the table**; in parallel the
   camera **descends to a reading angle** over the open book. A candle lights
   the table.
3. **Open book pages:** **left page = model/persona** (streaming answer + live
   reasoning); **right page = the user** (an ink line to type the question).
4. **Hourglass:** a **clickable 3D model** on the far side of the table (not a
   corner icon). Click → **popup showing conversation history**.
5. The book **stays open on the table for the whole session**. Loading a past
   conversation from history rewrites the pages. There is no "close/refloat".

## Non-Goals (out of scope)

- Backend changes (the SSE `reasoning/status/answer/done/error` contract stays).
- Colour quantisation / dithering (the pixel look is deliberately **subtle**).
- Changing fonts (pixel-art fonts are explicitly unwanted; UI text stays DOM).
- Mobile / touch layout — desktop-only, as before.

## Architecture

### Scene state machine

The chat phase model gains a pre-open state. Phases:

- `floating-closed` — initial; book floats centre, closed; awaiting the click.
- `idle` — book open on the table, waiting for input.
- `thinking` — a request is streaming.

`ChatContext` owns the phase and exposes an `openBook()` action triggered by the
book's click handler. The intro/`prefers-reduced-motion` skip advances the
camera intro but does **not** auto-open the book — the user clicks to open.

### Rendering / pixelation (single lever for look + GPU)

In `Scene.tsx`:

- **Low internal resolution:** render at a fixed scale factor `PIXEL_SCALE`
  (≈0.45, a tunable constant) instead of `dpr={[1,2]}`. Half-ish the pixels to
  shade.
- **`antialias: false`** — crisp pixels and cheaper.
- **CSS `image-rendering: pixelated`** on `.scene-canvas` so the browser
  upscales the low-res buffer with nearest-neighbour → the pixel-art look.
- The DOM page content and history popup render **above** the canvas, crisp and
  unpixelated (this is how fonts stay sharp).

### Shadows (the biggest GPU win)

The current `Candles.tsx` has **4 point lights each with `castShadow`** and
512² maps, recomputed every frame (point-light shadows are cubemaps = 6 renders
each → ~24 shadow renders/frame). The candles never translate (only intensity
flickers), so the shadows are effectively static.

- Render shadow maps **once**, then set `gl.shadowMap.autoUpdate = false` and
  request a single update on first settled frame (`shadowMap.needsUpdate`).
- Reduce shadow maps to **256²**.
- Only **2 of the 4** candles cast shadows.

### Postprocessing

- **Remove `DepthOfField`** (expensive full-screen pass; pointless once
  pixelated).
- **Keep `Bloom`** (cheap at low resolution, gives candle/flame glow) and
  **`Vignette`**, with bloom intensity reduced.

### Frame loop

- Switch to `frameloop="demand"` driven by a throttled invalidator:
  **24 fps** while `idle`/`floating-closed`, **~30 fps** while `thinking`.
- **Pause** rendering on `visibilitychange` (hidden) and window `blur`; resume
  on focus/visible.
- Existing `prefers-reduced-motion` on-demand behaviour is preserved.

### Camera

`CameraRig.tsx` poses:

- `FLOAT_VIEW` — settled pose facing the floating closed book (end of intro).
- `READ_VIEW` — descended, tilted reading angle over the open book on the table,
  framed roughly head-on to the pages so `<Html>` text is legible.

Transition `FLOAT_VIEW → READ_VIEW` is driven by `openBook()` with a frame-rate
independent eased lerp. Idle drift continues as a small breathe around the
active pose.

### Pages as anchored DOM

Each page is a drei `<Html transform>` parented to its page mesh inside
`Grimoire`, so the DOM moves and scales with the book as it descends:

- Left page hosts `ChatPanel` + `ReasoningStream`.
- Right page hosts `InkInput`.

These components are reused as-is for content; only their mounting changes from a
flat overlay to anchored `<Html>`.

### Hourglass + history popup

- **New `Hourglass.tsx`** — a 3D hourglass mesh on the far side of the table,
  with `onPointerOver/Out` hover state (drei `useCursor`) and an `onClick`
  (R3F raycast) that toggles history.
- History popup reuses `HistoryDrawer`'s list/logic, mounted as an `<Html>`
  anchored near the hourglass (or a screen-space popup) over the canvas — crisp
  DOM. History stays in `localStorage` (`lib/history.ts`).
- **Remove** `HourglassButton.tsx` (the corner SVG button) and the `.tools`
  overlay region.

## Components Touched

| File | Change |
|------|--------|
| `three/Scene.tsx` | low-res render, `antialias:false`, pixelated CSS, drop DoF, throttled demand loop, hidden/blur pause, frozen shadows setup |
| `three/Grimoire.tsx` | `floating-closed → open-on-table` state; descend + open; `<Html>` pages (left=model, right=user) |
| `three/CameraRig.tsx` | `FLOAT_VIEW` and `READ_VIEW` poses; descend transition on open |
| `three/Candles.tsx` | 2 shadow-casting candles, 256² maps, static (frozen) shadows |
| `three/Table.tsx` | **new** — table replacing the lectern |
| `three/Hourglass.tsx` | **new** — clickable 3D hourglass, hover cursor, toggles history |
| `state/ChatContext.tsx` | add `floating-closed` phase + `openBook()` action |
| `App.tsx` | click-to-open wiring; remove `.tools`; mount history popup from hourglass |
| `ui/HourglassButton.tsx` | **removed** |
| `styles/overlay.css` | `.scene-canvas { image-rendering: pixelated }`; remove `.tools`; page/popup styling |

Reused unchanged in content: `ui/ChatPanel.tsx`, `ui/ReasoningStream.tsx`,
`ui/InkInput.tsx`, `ui/HistoryDrawer.tsx` (as popup content), `lib/*`.

## Data Flow

Unchanged request path: `InkInput.onSubmit` → `ChatContext.send()` →
`streamClient` SSE → `reasoning`/`answer` state → rendered on the **left page**.
On a completed `thinking → idle` transition the conversation is persisted and the
history list refreshes (as today). The only new flow is `openBook()` moving the
phase out of `floating-closed` and triggering the book descent + camera move.

## Error Handling

- SSE `error` events surface on the left page as today (existing behaviour).
- Click handlers are idempotent: clicking the book while already open is a no-op;
  toggling the hourglass popup is safe to spam.
- If `<Html transform>` content fails to mount, the scene still renders (pages
  empty) — no hard crash.

## Performance Verification

Because the goal is GPU/heat, measure **before vs after** on the same machine:

- FPS overlay (R3F stats / browser devtools).
- GPU process utilisation (browser task manager GPU %) — the primary metric;
  expect a large drop from frozen shadows + low-res render + demand loop.
- Confirm idle holds ~24 fps and pauses when the tab is backgrounded.

## Testing

- **Vitest:** the new scene state machine (`floating-closed → idle → thinking`,
  `openBook()` idempotency, history toggle).
- **Playwright E2E (update existing):** click the book → it opens and the pages
  appear; type a question on the right page and get a streamed answer on the
  left; click the 3D hourglass → history popup shows; selecting a past
  conversation rewrites the pages.

## Open Questions

None. All design decisions are settled:
- Pixel look: subtle (low-res upscale, no quantisation).
- Idle render: alive at 24 fps, throttled, paused when hidden.
- Page text: drei `<Html>` anchored DOM.
- Camera: descends to a reading angle on open.
- Input: right page = user, left page = model.
- Book stays open all session; intro kept.
