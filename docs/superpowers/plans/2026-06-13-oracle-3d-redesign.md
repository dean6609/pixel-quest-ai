# Oracle 3D Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Pixel Quest AI frontend so it matches the Gemini reference image: a 3D open book in the center of a dungeon, a pixelated magic orb on the left, a golden hourglass on the right, floating pixel particles, torchlit shelves, and a quill with inkwell, while preserving the existing chat functionality.

**Architecture:** Build the scene entirely with CSS and inline SVG. A new `OracleBook3D` component hosts the chat history on its pages. Decorative components (`DungeonBackground`, `PixelOrb`, `HourglassButton`, `PixelParticles`, `QuillInkwell`) surround the book. `ChatArea` orchestrates loading state and passes it to the orb and particles. The existing `ChatContext`, API endpoints, and `web_app.py` remain unchanged.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Playwright.

**Worktree:** `.worktrees/feat-oracle-3d-redesign` on branch `feat/oracle-3d-redesign`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `frontend/src/components/DungeonBackground.tsx` | Dungeon wall, torches, potion shelves, vignette. |
| `frontend/src/components/OracleBook3D.tsx` | 3D CSS open book with parchment pages; hosts chat content. |
| `frontend/src/components/PixelOrb.tsx` | Pixelated green magic orb with golden halo; reacts to loading. |
| `frontend/src/components/HourglassButton.tsx` | Golden hourglass SVG button that opens the history popup. |
| `frontend/src/components/PixelParticles.tsx` | Floating colored square particles; intensity tied to loading. |
| `frontend/src/components/QuillInkwell.tsx` | Static decorative quill and inkwell SVG. |
| `frontend/src/components/OracleLayout.tsx` | Arrange all scene elements around the book. |
| `frontend/src/components/ChatArea.tsx` | Wire chat, loading state, and empty state into the book. |
| `frontend/src/components/QuillInput.tsx` | Input styled to blend with the book/scene. |
| `frontend/src/components/MessageInk.tsx` | Chat bubbles adapted to fit inside book pages. |
| `frontend/src/app/page.tsx` | Root page wrapping providers and layout. |
| `frontend/src/app/globals.css` | New CSS variables, keyframes, and utility classes. |
| `frontend/src/components/WizardTableBackground.tsx` | Remove/replace with DungeonBackground. |
| `frontend/playwright.config.ts` | Playwright configuration. |
| `frontend/tests/oracle-redesign.spec.ts` | Playwright tests. |


## Task 1: Install Playwright and configure tests

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/tests/oracle-redesign.spec.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install Playwright test runner**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm install --save-dev @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Add test script to package.json**

Modify `frontend/package.json`:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Create Playwright config**

Create `frontend/playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "cd .. && python web_app.py",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

- [ ] **Step 4: Create initial failing test**

Create `frontend/tests/oracle-redesign.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test("book, orb and hourglass are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("El Oráculo te escucha")).toBeVisible();
  await expect(page.locator("[data-testid='oracle-book']")).toBeVisible();
  await expect(page.locator("[data-testid='pixel-orb']")).toBeVisible();
  await expect(page.locator("[data-testid='hourglass-button']")).toBeVisible();
});
```

- [ ] **Step 5: Run test and confirm failure**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npx playwright test tests/oracle-redesign.spec.ts --project=chromium
```
Expected: FAIL because the testid selectors do not exist yet.

- [ ] **Step 6: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/package.json frontend/package-lock.json frontend/playwright.config.ts frontend/tests/oracle-redesign.spec.ts
git commit -m "test: add Playwright scaffold for oracle redesign"
```

## Task 2: Create DungeonBackground component

**Files:**
- Create: `frontend/src/components/DungeonBackground.tsx`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add dungeon CSS classes**

Append to `frontend/src/app/globals.css` inside `@layer components`:
```css
.dungeon-wall {
  background:
    radial-gradient(ellipse at 30% 20%, rgba(60, 45, 30, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(0, 0, 0, 0.5) 0%, transparent 50%),
    repeating-linear-gradient(90deg, #0f0b08 0, #0f0b08 48px, rgba(0,0,0,0.25) 50px),
    repeating-linear-gradient(0deg, #120c08 0, #120c08 38px, rgba(0,0,0,0.2) 40px),
    linear-gradient(180deg, #1a1410 0%, #0f0b08 100%);
}

.torch-flame {
  transform-origin: center bottom;
  animation: torchFlicker 3s ease-in-out infinite;
}

@keyframes torchFlicker {
  0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
  25% { transform: scaleY(1.15) scaleX(0.9); opacity: 1; }
  50% { transform: scaleY(0.95) scaleX(1.05); opacity: 0.85; }
  75% { transform: scaleY(1.1) scaleX(0.95); opacity: 0.95; }
}

@media (prefers-reduced-motion: reduce) {
  .torch-flame { animation: none; opacity: 0.9; }
}
```

- [ ] **Step 2: Create DungeonBackground component**

Create `frontend/src/components/DungeonBackground.tsx`:
```typescript
"use client";

import React from "react";

export default function DungeonBackground() {
  return (
    <div className="fixed inset-0 -z-20 dungeon-wall" aria-hidden="true">
      <div className="absolute inset-0 vignette" />

      {/* Left torch */}
      <svg className="absolute top-[12%] left-[8%] w-24 h-48" viewBox="0 0 100 200">
        <rect x="42" y="140" width="16" height="60" fill="#2a1d12" />
        <path d="M30 140 L70 140 L60 120 L40 120 Z" fill="#3e3025" />
        <path className="torch-flame" d="M50 120 Q30 80 50 20 Q70 80 50 120" fill="#fb923c" opacity="0.95" />
        <path className="torch-flame" d="M50 110 Q38 85 50 50 Q62 85 50 110" fill="#facc15" opacity="0.9" />
      </svg>

      {/* Right torch */}
      <svg className="absolute top-[12%] right-[8%] w-24 h-48" viewBox="0 0 100 200">
        <rect x="42" y="140" width="16" height="60" fill="#2a1d12" />
        <path d="M30 140 L70 140 L60 120 L40 120 Z" fill="#3e3025" />
        <path className="torch-flame" d="M50 120 Q30 80 50 20 Q70 80 50 120" fill="#fb923c" opacity="0.95" />
        <path className="torch-flame" d="M50 110 Q38 85 50 50 Q62 85 50 110" fill="#facc15" opacity="0.9" />
      </svg>

      {/* Potion shelves */}
      <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[60%] flex justify-around opacity-60">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-1 h-16 bg-[#2a1d12]" />
            <div
              className="w-8 h-10 rounded-sm border border-black/30"
              style={{
                background:
                  i % 2 === 0
                    ? "linear-gradient(180deg, #166534, #14532d)"
                    : "linear-gradient(180deg, #7f1d1d, #991b1b)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run build to verify**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS (no TypeScript or build errors).

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/DungeonBackground.tsx frontend/src/app/globals.css
git commit -m "feat: add DungeonBackground component"
```

## Task 3: Create PixelOrb component

**Files:**
- Create: `frontend/src/components/PixelOrb.tsx`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add orb CSS classes**

Append to `frontend/src/app/globals.css` inside `@layer components`:
```css
.pixel-orb-glow {
  filter: drop-shadow(0 0 12px rgba(74, 222, 128, 0.6)) drop-shadow(0 0 30px rgba(250, 204, 21, 0.4));
  animation: orbFloat 4s ease-in-out infinite, orbPulse 3s ease-in-out infinite;
}

.pixel-orb-glow.loading {
  animation: orbFloat 4s ease-in-out infinite, orbPulseFast 0.8s ease-in-out infinite;
}

@keyframes orbFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes orbPulse {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(74, 222, 128, 0.6)) drop-shadow(0 0 30px rgba(250, 204, 21, 0.4)); }
  50% { filter: drop-shadow(0 0 20px rgba(74, 222, 128, 0.9)) drop-shadow(0 0 50px rgba(250, 204, 21, 0.7)); }
}

@keyframes orbPulseFast {
  0%, 100% { filter: drop-shadow(0 0 16px rgba(74, 222, 128, 0.8)) drop-shadow(0 0 40px rgba(250, 204, 21, 0.6)); }
  50% { filter: drop-shadow(0 0 28px rgba(74, 222, 128, 1)) drop-shadow(0 0 70px rgba(250, 204, 21, 0.9)); }
}

@media (prefers-reduced-motion: reduce) {
  .pixel-orb-glow { animation: none; }
}
```

- [ ] **Step 2: Create PixelOrb component**

Create `frontend/src/components/PixelOrb.tsx`:
```typescript
"use client";

import React from "react";

export default function PixelOrb({ isLoading = false }: { isLoading?: boolean }) {
  return (
    <div
      data-testid="pixel-orb"
      className={`pixel-orb-glow ${isLoading ? "loading" : ""}`}
      aria-label="Orbe mágico del Oráculo"
      role="img"
    >
      <svg width="140" height="140" viewBox="0 0 100 100">
        {/* Outer golden ring */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="#d4b76a" strokeWidth="3" opacity="0.9" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#bfa046" strokeWidth="1.5" opacity="0.6" />

        {/* Green pixelated face grid */}
        <rect x="20" y="20" width="60" height="60" rx="8" fill="#052e16" />
        <rect x="28" y="28" width="10" height="10" fill="#4ade80" opacity="0.9" />
        <rect x="62" y="28" width="10" height="10" fill="#4ade80" opacity="0.9" />
        <rect x="34" y="48" width="8" height="8" fill="#4ade80" opacity="0.8" />
        <rect x="42" y="56" width="16" height="8" fill="#4ade80" opacity="0.8" />
        <rect x="58" y="48" width="8" height="8" fill="#4ade80" opacity="0.8" />

        {/* Highlight pixels */}
        <rect x="32" y="24" width="4" height="4" fill="#86efac" />
        <rect x="66" y="24" width="4" height="4" fill="#86efac" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 3: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/PixelOrb.tsx frontend/src/app/globals.css
git commit -m "feat: add PixelOrb component"
```

## Task 4: Create PixelParticles component

**Files:**
- Create: `frontend/src/components/PixelParticles.tsx`

- [ ] **Step 1: Create PixelParticles component**

Create `frontend/src/components/PixelParticles.tsx`:
```typescript
"use client";

import React, { useEffect, useState } from "react";

const COLORS = ["#4ade80", "#facc15", "#fb923c", "#34d399"];

type Particle = {
  id: number;
  left: string;
  delay: number;
  duration: number;
  size: number;
  color: string;
};

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${20 + Math.random() * 60}%`,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
    size: 3 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

export default function PixelParticles({ isLoading = false }: { isLoading?: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const count = isLoading ? 40 : 20;

  useEffect(() => {
    setParticles(makeParticles(count));
  }, [count]);

  return (
    <div
      data-testid="pixel-particles"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm particle-float"
          style={{
            left: p.left,
            bottom: "15%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add particle CSS**

Append to `frontend/src/app/globals.css` inside `@layer components`:
```css
.particle-float {
  animation-name: particleRise;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
}

@keyframes particleRise {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(-40vh) translateX(10px); opacity: 0.6; }
  100% { transform: translateY(-80vh) translateX(-10px); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .particle-float { animation: none; opacity: 0; }
}
```

- [ ] **Step 3: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/PixelParticles.tsx frontend/src/app/globals.css
git commit -m "feat: add PixelParticles component"
```

## Task 5: Create QuillInkwell component

**Files:**
- Create: `frontend/src/components/QuillInkwell.tsx`

- [ ] **Step 1: Create QuillInkwell component**

Create `frontend/src/components/QuillInkwell.tsx`:
```typescript
"use client";

import React from "react";

export default function QuillInkwell() {
  return (
    <div
      data-testid="quill-inkwell"
      className="fixed bottom-8 left-8 z-10 hidden lg:block"
      aria-hidden="true"
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Inkwell */}
        <ellipse cx="55" cy="95" rx="28" ry="14" fill="#1a1410" />
        <path
          d="M35 95 L38 70 C38 62 72 62 72 70 L75 95 Z"
          fill="#0f0b08"
          stroke="#2a1d12"
          strokeWidth="1.5"
        />
        <ellipse cx="55" cy="70" rx="17" ry="6" fill="#1a1410" stroke="#2a1d12" strokeWidth="1.5" />
        <ellipse cx="55" cy="72" rx="12" ry="4" fill="#020617" />

        {/* Quill feather */}
        <path
          d="M75 75 Q95 45 90 15 Q85 40 70 70"
          fill="#e8dcc4"
          stroke="#c4b49a"
          strokeWidth="1.5"
        />
        <path
          d="M78 68 Q88 48 85 28"
          fill="none"
          stroke="#d4c5a9"
          strokeWidth="1"
        />
        <line x1="70" y1="70" x2="75" y2="75" stroke="#2a1d12" strokeWidth="2" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/QuillInkwell.tsx
git commit -m "feat: add QuillInkwell decoration"
```

## Task 6: Create HourglassButton component

**Files:**
- Create: `frontend/src/components/HourglassButton.tsx`
- Delete or leave unused: `frontend/src/components/HourglassHistory.tsx`

- [ ] **Step 1: Add hourglass CSS**

Append to `frontend/src/app/globals.css` inside `@layer components`:
```css
.hourglass-spin {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.hourglass-sand {
  animation: sandFlow 2s linear infinite;
}

@keyframes sandFlow {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .hourglass-sand { animation: none; }
}
```

- [ ] **Step 2: Create HourglassButton component**

Create `frontend/src/components/HourglassButton.tsx`:
```typescript
"use client";

import React, { useState } from "react";
import HistoryPopup from "./HistoryPopup";

export default function HourglassButton() {
  const [open, setOpen] = useState(false);
  const [spins, setSpins] = useState(0);

  const handleClick = () => {
    setOpen((v) => !v);
    setSpins((n) => n + 1);
  };

  return (
    <>
      <button
        data-testid="hourglass-button"
        onClick={handleClick}
        className="hourglass-spin fixed top-28 right-8 z-40 w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          transform: `rotate(${spins * 180}deg)`,
          background: "rgba(232, 220, 196, 0.12)",
          border: "1px solid rgba(232, 220, 196, 0.25)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        }}
        aria-label={open ? "Cerrar historial" : "Abrir historial"}
        title="Historial"
      >
        <svg width="40" height="40" viewBox="0 0 100 140">
          {/* Frame */}
          <path
            d="M10 10 L90 10 L90 20 L10 20 Z"
            fill="#d4b76a"
          />
          <path
            d="M10 120 L90 120 L90 130 L10 130 Z"
            fill="#d4b76a"
          />
          <path
            d="M15 20 L85 20 L50 70 Z"
            fill="rgba(6, 182, 212, 0.2)"
            stroke="#bfa046"
            strokeWidth="2"
          />
          <path
            d="M15 120 L85 120 L50 70 Z"
            fill="rgba(6, 182, 212, 0.2)"
            stroke="#bfa046"
            strokeWidth="2"
          />
          {/* Animated sand */}
          <clipPath id="top-sand">
            <path d="M18 23 L82 23 L50 67 Z" />
          </clipPath>
          <clipPath id="bottom-sand">
            <path d="M18 117 L82 117 L50 73 Z" />
          </clipPath>
          <rect
            x="0"
            y="0"
            width="100"
            height="140"
            fill="#06b6d4"
            opacity="0.6"
            clipPath="url(#top-sand)"
            className="hourglass-sand"
          />
          <rect
            x="0"
            y="0"
            width="100"
            height="140"
            fill="#06b6d4"
            opacity="0.6"
            clipPath="url(#bottom-sand)"
            className="hourglass-sand"
            style={{ animationDelay: "1s" }}
          />
        </svg>
      </button>
      <HistoryPopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

Note: `HistoryPopup` no longer needs a `triggerRef` prop. If the existing component requires it, pass `undefined` or update the type to optional.

- [ ] **Step 3: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/HourglassButton.tsx frontend/src/app/globals.css
git commit -m "feat: add golden hourglass history button"
```

## Task 7: Create OracleBook3D component

**Files:**
- Create: `frontend/src/components/OracleBook3D.tsx`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add book CSS classes**

Append to `frontend/src/app/globals.css` inside `@layer components`:
```css
.book-stage {
  perspective: 1200px;
}

.book {
  transform-style: preserve-3d;
  transform: rotateX(8deg) rotateY(0deg) rotateZ(-1deg);
}

.book-cover {
  background: linear-gradient(135deg, #2a1d12 0%, #120c08 100%);
  border: 2px solid #bfa046;
  box-shadow:
    inset 2px 2px 6px rgba(255,255,255,0.08),
    inset -2px -2px 6px rgba(0,0,0,0.5),
    0 30px 60px rgba(0,0,0,0.7);
}

.book-page {
  background: var(--color-parchment);
  background-image:
    radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
    radial-gradient(circle at 70% 80%, rgba(0,0,0,0.05) 0%, transparent 40%);
  box-shadow: inset 0 0 40px rgba(139, 90, 43, 0.1);
}

.book-spine {
  background: linear-gradient(90deg, #120c08, #2a1d12, #120c08);
}

@media (max-width: 768px) {
  .book-stage { perspective: none; }
  .book { transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .book { transform: none; }
}
```

- [ ] **Step 2: Create OracleBook3D component**

Create `frontend/src/components/OracleBook3D.tsx`:
```typescript
"use client";

import React from "react";

export default function OracleBook3D({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="oracle-book" className="book-stage w-full max-w-4xl mx-auto px-4">
      <div className="book relative w-full aspect-[16/10]">
        {/* Back cover */}
        <div className="absolute inset-0 book-cover rounded-lg" />

        {/* Spine */}
        <div
          className="absolute left-1/2 top-2 bottom-2 w-6 -translate-x-1/2 book-spine z-10"
          style={{ transform: "translateX(-50%) translateZ(6px)" }}
        />

        {/* Left page */}
        <div
          className="absolute left-2 top-3 bottom-3 w-[calc(50%-14px)] book-page rounded-l-md border-r border-[var(--color-parchment-edge)]"
          style={{ transform: "rotateY(8deg) translateZ(8px)" }}
        />

        {/* Right page */}
        <div
          className="absolute right-2 top-3 bottom-3 w-[calc(50%-14px)] book-page rounded-r-md border-l border-[var(--color-parchment-edge)]"
          style={{ transform: "rotateY(-8deg) translateZ(8px)" }}
        />

        {/* Content area spans both pages */}
        <div className="absolute inset-0 z-20 flex">
          <div className="w-1/2 h-full p-6 md:p-10" />
          <div className="w-1/2 h-full p-6 md:p-10" />
        </div>

        {/* Actual scrollable content */}
        <div className="absolute inset-[3%] z-30 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/OracleBook3D.tsx frontend/src/app/globals.css
git commit -m "feat: add OracleBook3D component"
```

## Task 8: Integrate scene layout

**Files:**
- Modify: `frontend/src/components/OracleLayout.tsx`
- Modify: `frontend/src/app/page.tsx`
- Delete or leave unused: `frontend/src/components/WizardTableBackground.tsx`

- [ ] **Step 1: Update OracleLayout**

Replace `frontend/src/components/OracleLayout.tsx` with:
```typescript
"use client";

import React from "react";
import DungeonBackground from "./DungeonBackground";
import PixelOrb from "./PixelOrb";
import HourglassButton from "./HourglassButton";
import PixelParticles from "./PixelParticles";
import QuillInkwell from "./QuillInkwell";
import OracleBook3D from "./OracleBook3D";

export default function OracleLayout({
  children,
  isLoading = false,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <DungeonBackground />
      <PixelParticles isLoading={isLoading} />
      <QuillInkwell />

      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen px-4 py-8 gap-6 lg:gap-12">
        <div className="order-1 lg:order-1 shrink-0">
          <PixelOrb isLoading={isLoading} />
        </div>

        <div className="order-2 lg:order-2 w-full max-w-4xl">
          <OracleBook3D>{children}</OracleBook3D>
        </div>

        <div className="order-3 lg:order-3 shrink-0">
          <HourglassButton />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update page.tsx to pass loading state**

Replace `frontend/src/app/page.tsx` with:
```typescript
"use client";

import OracleLayout from "../components/OracleLayout";
import ChatArea from "../components/ChatArea";
import { ChatProvider } from "../context/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <ChatArea />
    </ChatProvider>
  );
}
```

Note: `ChatArea` will internally use `OracleLayout` and pass `isLoading`.

- [ ] **Step 3: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/OracleLayout.tsx frontend/src/app/page.tsx
git commit -m "feat: integrate scene layout with book, orb and hourglass"
```

## Task 9: Wire ChatArea into OracleBook3D

**Files:**
- Modify: `frontend/src/components/ChatArea.tsx`

- [ ] **Step 1: Replace ChatArea content**

Replace `frontend/src/components/ChatArea.tsx` with:
```typescript
"use client";

import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useChat } from "../context/ChatContext";
import ScrollContainer from "./ScrollContainer";
import MessageInk from "./MessageInk";
import QuillInput from "./QuillInput";
import OracleLayout from "./OracleLayout";

export default function ChatArea() {
  const { activeChatId, activeChat, createNewChat, addMessage } = useChat();
  const messages = activeChat?.messages || [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion() ?? true;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [messages.length, isLoading, shouldReduceMotion]);

  const handleSend = async (text: string) => {
    let chatId = activeChatId;
    if (!chatId) chatId = createNewChat();
    addMessage(chatId, { role: "user", content: text });
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          history: messages.slice(-10),
        }),
      });
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      addMessage(chatId, { role: "assistant", content: data.response });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      addMessage(chatId, {
        role: "assistant",
        content: "⚠️ El Oráculo no ha podido responder. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OracleLayout isLoading={isLoading}>
      <ScrollContainer>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8 }}
              className="text-2xl md:text-4xl font-bold mb-3 ink-text"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              El Oráculo te escucha
            </motion.h1>
            <p
              className="text-base md:text-lg max-w-md"
              style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-garamond)" }}
            >
              Pregunta sobre builds, items, enemigos o lugares de tu aventura.
            </p>
          </div>
        ) : (
          <div className="pt-2 pb-6">
            {messages.map((msg, idx) => (
              <MessageInk key={idx} role={msg.role} content={msg.content} index={idx} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 my-4" style={{ color: "var(--color-ink-muted)" }}>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${shouldReduceMotion ? "" : "animate-bounce"}`}
                  style={{ background: "var(--color-gold)" }}
                />
                <span
                  className={`inline-block w-2 h-2 rounded-full ${shouldReduceMotion ? "" : "animate-bounce"}`}
                  style={{ background: "var(--color-gold)", animationDelay: "0.15s" }}
                />
                <span
                  className={`inline-block w-2 h-2 rounded-full ${shouldReduceMotion ? "" : "animate-bounce"}`}
                  style={{ background: "var(--color-gold)", animationDelay: "0.3s" }}
                />
                <span className="text-sm italic" style={{ fontFamily: "var(--font-garamond)" }}>
                  El Oráculo escribe...
                </span>
              </div>
            )}
            {error && (
              <div
                className="p-3 rounded-md text-sm border"
                style={{
                  borderColor: "var(--color-wax)",
                  color: "var(--color-wax)",
                  background: "rgba(139,34,34,0.08)",
                }}
              >
                Error: {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollContainer>
      <QuillInput onSend={handleSend} disabled={isLoading} />
    </OracleLayout>
  );
}
```

- [ ] **Step 2: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/ChatArea.tsx
git commit -m "feat: wire ChatArea into OracleLayout and book"
```

## Task 10: Adapt QuillInput and MessageInk to the book

**Files:**
- Modify: `frontend/src/components/QuillInput.tsx`
- Modify: `frontend/src/components/MessageInk.tsx`

- [ ] **Step 1: Update QuillInput styling**

Modify `frontend/src/components/QuillInput.tsx`. Keep the existing logic, only change the container style. Replace the `form` inline style and container classes with:
```tsx
<form
  onSubmit={handleSubmit}
  className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-12"
  style={{
    background: "linear-gradient(to top, rgba(15, 11, 8, 0.95) 30%, transparent)",
  }}
>
  <div className="max-w-[760px] mx-auto quill-input flex items-center gap-3 px-4 py-3">
```

Also adjust max-width from `900px` to `760px` so it fits within the book pages.

- [ ] **Step 2: Update MessageInk max-widths**

Modify `frontend/src/components/MessageInk.tsx`. Change the message container max-width:
```tsx
className={`relative max-w-[90%] md:max-w-[85%] p-4 rounded-sm ${
  isUser ? "rounded-br-2xl" : "rounded-bl-2xl"
}`}
```

Ensure text does not overflow the parchment pages by adding `break-words` to the inner div:
```tsx
className="text-base leading-relaxed ink-text max-w-none break-words"
```

- [ ] **Step 3: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/QuillInput.tsx frontend/src/components/MessageInk.tsx
git commit -m "feat: adapt QuillInput and MessageInk to book layout"
```

## Task 11: Ensure ScrollContainer fits inside the book

**Files:**
- Modify: `frontend/src/components/ScrollContainer.tsx`

- [ ] **Step 1: Update ScrollContainer**

Replace `frontend/src/components/ScrollContainer.tsx` with:
```typescript
"use client";

import React from "react";

export default function ScrollContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full h-full overflow-y-auto overflow-x-hidden px-2 md:px-6"
      style={{
        maxHeight: "calc(100% - 120px)",
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/ScrollContainer.tsx
git commit -m "feat: adjust ScrollContainer to fit inside book pages"
```

## Task 12: Expand Playwright tests and run them

**Files:**
- Modify: `frontend/tests/oracle-redesign.spec.ts`

- [ ] **Step 1: Expand test file**

Replace `frontend/tests/oracle-redesign.spec.ts` with:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Oracle redesign", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("book, orb and hourglass are visible", async ({ page }) => {
    await expect(page.getByText("El Oráculo te escucha")).toBeVisible();
    await expect(page.locator("[data-testid='oracle-book']")).toBeVisible();
    await expect(page.locator("[data-testid='pixel-orb']")).toBeVisible();
    await expect(page.locator("[data-testid='hourglass-button']")).toBeVisible();
  });

  test("can ask a question and receive a response", async ({ page }) => {
    const input = page.locator("textarea[aria-label='Escribe tu pregunta al Oráculo']");
    await input.fill("¿Qué es Pixel Quest?");
    await input.press("Enter");

    await expect(page.getByText("Adventurer")).toBeVisible();
    await expect(page.getByText("Oracle")).toBeVisible({ timeout: 30000 });
  });

  test("hourglass opens history popup", async ({ page }) => {
    await page.locator("[data-testid='hourglass-button']").click();
    await expect(page.getByText("Memorias del Oráculo")).toBeVisible();
  });

  test("mobile viewport stacks elements vertically", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    const book = page.locator("[data-testid='oracle-book']");
    const orb = page.locator("[data-testid='pixel-orb']");
    const hourglass = page.locator("[data-testid='hourglass-button']");

    const bookBox = await book.boundingBox();
    const orbBox = await orb.boundingBox();
    const hourglassBox = await hourglass.boundingBox();

    expect(orbBox && bookBox && hourglassBox).toBeTruthy();
    if (orbBox && bookBox && hourglassBox) {
      expect(orbBox.y).toBeLessThan(bookBox.y);
      expect(bookBox.y).toBeLessThan(hourglassBox.y);
    }
  });
});
```

- [ ] **Step 2: Build frontend**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 3: Run Playwright tests**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npx playwright test
```
Expected: All tests PASS.

Note: If the backend API is not loaded with data, the chat test may fail at the response assertion. In that case, mock `/api/ask` in the test or verify the database is loaded.

- [ ] **Step 4: Commit**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/tests/oracle-redesign.spec.ts
git commit -m "test: expand Playwright coverage for oracle redesign"
```

## Task 13: Make HistoryPopup triggerRef optional

**Files:**
- Modify: `frontend/src/components/HistoryPopup.tsx`

- [ ] **Step 1: Update HistoryPopup prop type**

The existing `HistoryPopup` expects `triggerRef?: React.RefObject<HTMLButtonElement | null>;`. If `HourglassButton` calls it without `triggerRef`, verify the type is optional. If not, change the prop to optional.

No code change needed if already optional. If not, modify:
```typescript
triggerRef?: React.RefObject<HTMLButtonElement | null>;
```

- [ ] **Step 2: Run build**

Run:
```bash
cd .worktrees/feat-oracle-3d-redesign/frontend
npm run build
```
Expected: PASS.

- [ ] **Step 3: Commit if changed**

```bash
cd .worktrees/feat-oracle-3d-redesign
git add frontend/src/components/HistoryPopup.tsx
git commit -m "fix: make HistoryPopup triggerRef optional"
```
