# Wizard Table Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Pixel Quest AI frontend as an immersive "wizard's table" scene (wood surface, central parchment scroll, quill input, wax-seal status, hourglass history popup), preserving only chat and session history.

**Architecture:** A single-page Next.js 15 app with a fixed wood background, a centered parchment scroll for the chat, floating magical UI objects, and the existing `ChatContext` for state/localStorage. Unused dependencies and old Good-Fella components are removed.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Framer Motion, `next/font/google`.

---

## File map

| File | Responsibility |
|------|----------------|
| `frontend/src/app/globals.css` | Design tokens (wood, parchment, ink, gold, wax), utility classes for parchment, seal, quill, animations, reduced-motion overrides. |
| `frontend/src/app/layout.tsx` | Load `Cinzel` and `EB_Garamond` fonts, apply CSS variables. |
| `frontend/src/app/page.tsx` | Mount `ChatProvider` + `OracleLayout` + `ChatArea`. |
| `frontend/src/components/OracleLayout.tsx` | Full-screen wizard-table scene: background, wax seal, hourglass, children inside. |
| `frontend/src/components/WizardTableBackground.tsx` | Wood texture, vignette, candle-flicker shadows. |
| `frontend/src/components/ScrollContainer.tsx` | Centered parchment scroll with torn edges and inner padding. |
| `frontend/src/components/WaxSeal.tsx` | Corner status seal: "Oracle Online". |
| `frontend/src/components/HourglassHistory.tsx` | Floating hourglass button that toggles the history popup. |
| `frontend/src/components/HistoryPopup.tsx` | Parchment popup listing sessions and actions. |
| `frontend/src/components/MessageInk.tsx` | Chat message with ink-reveal animation; user left, oracle right. |
| `frontend/src/components/QuillInput.tsx` | Bottom input bar with quill/inkwell styling. |
| `frontend/src/components/ChatArea.tsx` | Orchestrates scroll, messages, input, loading/error states. |
| `frontend/src/context/ChatContext.tsx` | Kept as-is (sessions, localStorage). |
| `frontend/src/lib/utils.ts` | Kept as-is (`cn`). |

Files to delete:
- `frontend/src/components/Header.tsx`
- `frontend/src/components/RightSidebar.tsx`
- `frontend/src/components/ClientLayout.tsx`
- `frontend/src/components/SmoothScroll.tsx`
- `frontend/src/components/effects/*`
- `frontend/src/hooks/*`

---

### Task 1: Backup current source before replacing it

**Files:**
- Modify: none
- Create: `frontend/_legacy-goodfella/` (copy of current `frontend/src/`)
- Test: verify copy exists

- [ ] **Step 1: Copy current src**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai"
cp -r frontend/src frontend/_legacy-goodfella
```

- [ ] **Step 2: Verify backup**

```bash
ls frontend/_legacy-goodfella/components/ChatArea.tsx
```

Expected: file exists.

- [ ] **Step 3: Commit**

```bash
git add frontend/_legacy-goodfella
git commit -m "chore: backup Good-Fella rebuild before wizard-table redesign"
```

---

### Task 2: Remove unused dependencies

**Files:**
- Modify: `frontend/package.json`, `frontend/package-lock.json`

- [ ] **Step 1: Uninstall packages no longer needed**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai/frontend"
npm uninstall gsap lenis three @types/three
```

Keep `framer-motion` (used for scroll unroll, ink reveal, hourglass).

- [ ] **Step 2: Verify build still works**

```bash
npm run build 2>&1 | tail -15
```

Expected: build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai"
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(deps): remove gsap, lenis, three for wizard redesign"
```

---

### Task 3: Rewrite global design tokens and utility classes

**Files:**
- Modify: `frontend/src/app/globals.css`

Replace the entire file content.

- [ ] **Step 1: Write new globals.css**

```css
@import "tailwindcss";

@theme {
  --color-wood: #1f140d;
  --color-wood-light: #2e2016;
  --color-wood-dark: #120c08;
  --color-parchment: #e8dcc4;
  --color-parchment-dark: #d4c5a9;
  --color-parchment-edge: #c4b49a;
  --color-ink: #2a1d12;
  --color-ink-muted: #5c4a3a;
  --color-gold: #bfa046;
  --color-gold-light: #d4b76a;
  --color-wax: #8b2222;
  --color-wax-light: #a82e2e;
  --color-wax-shadow: #5a1515;

  --font-cinzel: "Cinzel", serif;
  --font-garamond: "EB Garamond", serif;
}

@layer base {
  *, *::before, *::after { box-sizing: border-box; }

  html {
    color-scheme: dark;
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    padding: 0;
    background: var(--color-wood);
    color: var(--color-ink);
    font-family: var(--font-garamond);
    overflow: hidden;
  }

  ::selection {
    background: var(--color-gold);
    color: var(--color-wood);
  }
}

@layer components {
  .wood-grain {
    background-color: var(--color-wood);
    background-image:
      radial-gradient(ellipse at 20% 30%, var(--color-wood-light) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, var(--color-wood-dark) 0%, transparent 45%),
      repeating-linear-gradient(90deg, transparent 0, transparent 48px, rgba(0,0,0,0.08) 50px);
  }

  .vignette {
    box-shadow: inset 0 0 120px 40px rgba(0, 0, 0, 0.7);
  }

  .parchment {
    background: var(--color-parchment);
    background-image:
      radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 40%),
      radial-gradient(circle at 70% 80%, rgba(0,0,0,0.04) 0%, transparent 40%);
    border: 1px solid var(--color-parchment-edge);
    box-shadow:
      0 20px 60px rgba(0,0,0,0.6),
      inset 0 0 80px rgba(139, 90, 43, 0.12);
  }

  .parchment-edge {
    position: relative;
  }
  .parchment-edge::before,
  .parchment-edge::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 12px;
    background: var(--color-parchment-edge);
    opacity: 0.5;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 12' preserveAspectRatio='none'%3E%3Cpath d='M0 6 Q5 0 10 6 T20 6 T30 6 T40 6 T50 6 T60 6 T70 6 T80 6 T90 6 T100 6 V12 H0 Z' fill='black'/%3E%3C/svg%3E");
    mask-size: 100% 100%;
  }
  .parchment-edge::before { top: -6px; transform: rotate(180deg); }
  .parchment-edge::after { bottom: -6px; }

  .wax-seal {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--color-wax-light), var(--color-wax) 55%, var(--color-wax-shadow) 100%);
    box-shadow:
      inset -4px -4px 10px rgba(0,0,0,0.3),
      inset 4px 4px 10px rgba(255,255,255,0.15),
      0 6px 16px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: var(--font-cinzel);
    font-size: 0.55rem;
    line-height: 1.1;
    color: rgba(255,255,255,0.9);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  }

  .wax-seal-pulse {
    animation: sealPulse 3s ease-in-out infinite;
  }

  .quill-input {
    background: linear-gradient(180deg, var(--color-parchment) 0%, var(--color-parchment-dark) 100%);
    border: 1px solid var(--color-parchment-edge);
    border-radius: 9999px;
    box-shadow:
      0 8px 24px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.25);
  }

  .ink-text {
    color: var(--color-ink);
    text-shadow: 0 0 1px rgba(42, 29, 18, 0.15);
  }

  .gold-accent {
    color: var(--color-gold);
  }
}

@keyframes sealPulse {
  0%, 100% { box-shadow: inset -4px -4px 10px rgba(0,0,0,0.3), inset 4px 4px 10px rgba(255,255,255,0.15), 0 6px 16px rgba(0,0,0,0.5); }
  50% { box-shadow: inset -4px -4px 10px rgba(0,0,0,0.3), inset 4px 4px 10px rgba(255,255,255,0.25), 0 6px 24px rgba(168, 46, 46, 0.35); }
}

@keyframes flicker {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
  25% { opacity: 0.85; }
  75% { opacity: 0.95; }
}

.candle-flicker {
  animation: flicker 4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .wax-seal-pulse,
  .candle-flicker {
    animation: none;
  }
}
```

- [ ] **Step 2: Run lint**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai/frontend"
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai"
git add frontend/src/app/globals.css
git commit -m "feat(styles): wizard-table design tokens and utility classes"
```

---

### Task 4: Load new fonts in root layout

**Files:**
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

```tsx
import type { Metadata } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixel Quest AI - Ethereal Oracle",
  description: "Ask the Oracle about Pixel Quest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cinzel.variable} ${ebGaramond.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/layout.tsx
git commit -m "feat(layout): load Cinzel and EB Garamond fonts"
```

---

### Task 5: Create the wood-table background component

**Files:**
- Create: `frontend/src/components/WizardTableBackground.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React from "react";

export default function WizardTableBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 wood-grain vignette"
      aria-hidden="true"
    >
      <div className="absolute inset-0 candle-flicker bg-gradient-to-br from-black/20 via-transparent to-black/30" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/WizardTableBackground.tsx
git commit -m "feat(ui): add wizard table background"
```

---

### Task 6: Create the wax-seal status indicator

**Files:**
- Create: `frontend/src/components/WaxSeal.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React from "react";

export default function WaxSeal() {
  return (
    <div
      className="fixed top-6 right-6 z-40 wax-seal wax-seal-pulse"
      aria-label="Oracle Online"
      title="Oracle Online"
    >
      Oracle<br />Online
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/WaxSeal.tsx
git commit -m "feat(ui): add wax seal status indicator"
```

---

### Task 7: Create the history popup

**Files:**
- Create: `frontend/src/components/HistoryPopup.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "../context/ChatContext";

export default function HistoryPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { chats, activeChatId, setActiveChat, createNewChat, deleteAllChats } = useChat();

  const formatDate = (ts: number) =>
    new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ts));

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed top-24 right-6 z-40 w-80 parchment parchment-edge rounded-lg p-4"
          >
            <h3
              className="text-lg font-bold mb-3 ink-text"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              Memorias del Oráculo
            </h3>

            <button
              onClick={() => {
                createNewChat();
                onClose();
              }}
              className="w-full mb-3 py-2 px-3 rounded-md text-sm transition-colors"
              style={{
                fontFamily: "var(--font-cinzel)",
                background: "var(--color-gold)",
                color: "var(--color-wood)",
              }}
            >
              Nueva sesión
            </button>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {chats.length === 0 && (
                <p className="text-sm italic" style={{ color: "var(--color-ink-muted)" }}>
                  El Oráculo aún no guarda memorias.
                </p>
              )}
              {chats.map((chat) => {
                const firstUser = chat.messages.find((m) => m.role === "user");
                const title = firstUser
                  ? firstUser.content.slice(0, 36) + "..."
                  : `Sesión ${chat.id.slice(0, 6)}`;
                const isActive = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setActiveChat(chat.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-md border transition-all text-sm ${
                      isActive
                        ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
                        : "border-[var(--color-parchment-edge)] hover:bg-black/5"
                    }`}
                  >
                    <div className="font-medium ink-text truncate">{title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>
                      {formatDate(chat.updatedAt)}
                    </div>
                  </button>
                );
              })}
            </div>

            {chats.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("¿Borrar todas las memorias?")) {
                    deleteAllChats();
                    onClose();
                  }
                }}
                className="w-full mt-3 py-2 px-3 rounded-md text-xs border transition-colors"
                style={{
                  fontFamily: "var(--font-cinzel)",
                  borderColor: "var(--color-wax)",
                  color: "var(--color-wax)",
                }}
              >
                Purga de memorias
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/HistoryPopup.tsx
git commit -m "feat(ui): add history popup component"
```

---

### Task 8: Create the hourglass history toggle

**Files:**
- Create: `frontend/src/components/HourglassHistory.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import HistoryPopup from "./HistoryPopup";

export default function HourglassHistory() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ rotate: 15, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed top-28 right-8 z-40 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(232, 220, 196, 0.12)",
          border: "1px solid rgba(232, 220, 196, 0.25)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        }}
        aria-label="Abrir historial"
        title="Historial"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 22h14" />
          <path d="M5 2h14" />
          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
        </svg>
      </motion.button>
      <HistoryPopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/HourglassHistory.tsx
git commit -m "feat(ui): add hourglass history toggle"
```

---

### Task 9: Create the parchment scroll container

**Files:**
- Create: `frontend/src/components/ScrollContainer.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ScrollContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[900px] mx-auto parchment parchment-edge rounded-lg"
      style={{ minHeight: "60vh", maxHeight: "calc(100vh - 220px)" }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)]/40 to-transparent opacity-60" />
      <div className="h-full overflow-y-auto p-6 md:p-10 scrollbar-thin">
        {children}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ScrollContainer.tsx
git commit -m "feat(ui): add parchment scroll container"
```

---

### Task 10: Create ink-reveal message bubbles

**Files:**
- Create: `frontend/src/components/MessageInk.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { marked } from "marked";

function parseMarkdown(content: string): string {
  const result = marked.parse(content);
  const html = typeof result === "string" ? result : "";
  return html.replace(
    /<a href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );
}

function sanitizeContent(content: string): string {
  return content
    .replace(/<｜｜DSML｜｜tool_calls>[\s\S]*?<\/｜｜DSML｜｜tool_calls>/g, "")
    .replace(/<｜｜DSML｜｜invoke[^>]*>[\s\S]*?<\/｜｜DSML｜｜invoke>/g, "")
    .replace(/<｜｜DSML｜｜parameter[^>]*>[\s\S]*?<\/｜｜DSML｜｜parameter>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type MessageInkProps = {
  role: "user" | "assistant";
  content: string;
  index: number;
};

export default function MessageInk({ role, content, index }: MessageInkProps) {
  const html = useMemo(
    () => parseMarkdown(sanitizeContent(content)),
    [content]
  );

  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`flex ${isUser ? "justify-start" : "justify-end"} mb-6`}
    >
      <div
        className={`relative max-w-[85%] md:max-w-[75%] p-4 rounded-sm ${
          isUser ? "rounded-br-2xl" : "rounded-bl-2xl"
        }`}
        style={{
          background: isUser
            ? "rgba(42, 29, 18, 0.06)"
            : "rgba(191, 160, 70, 0.08)",
          border: `1px solid ${isUser ? "rgba(42,29,18,0.12)" : "rgba(191,160,70,0.25)"}`,
        }}
      >
        <div
          className="text-base leading-relaxed ink-text prose prose-invert max-w-none"
          style={{ fontFamily: "var(--font-garamond)" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div
          className="mt-2 text-xs uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "var(--color-ink-muted)",
          }}
        >
          {isUser ? "Adventurer" : "Oracle"}
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/MessageInk.tsx
git commit -m "feat(ui): add ink-reveal message component"
```

---

### Task 11: Create the quill input bar

**Files:**
- Create: `frontend/src/components/QuillInput.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";

export default function QuillInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-10"
      style={{
        background:
          "linear-gradient(to top, var(--color-wood) 40%, transparent)",
      }}
    >
      <div className="max-w-[900px] mx-auto quill-input flex items-center gap-3 px-4 py-3">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-ink-muted)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Escribe tu pregunta al Oráculo..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none resize-none text-base ink-text placeholder:text-[var(--color-ink-muted)]"
          style={{ fontFamily: "var(--font-garamond)" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
          style={{
            background: "var(--color-gold)",
            color: "var(--color-wood)",
          }}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/QuillInput.tsx
git commit -m "feat(ui): add quill input bar"
```

---

### Task 12: Create the oracle layout wrapper

**Files:**
- Create: `frontend/src/components/OracleLayout.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import React from "react";
import WizardTableBackground from "./WizardTableBackground";
import WaxSeal from "./WaxSeal";
import HourglassHistory from "./HourglassHistory";

export default function OracleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <WizardTableBackground />
      <WaxSeal />
      <HourglassHistory />
      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-12 pb-32">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/OracleLayout.tsx
git commit -m "feat(ui): add oracle layout wrapper"
```

---

### Task 13: Rewrite ChatArea for the wizard table

**Files:**
- Modify: `frontend/src/components/ChatArea.tsx`

- [ ] **Step 1: Replace ChatArea.tsx**

```tsx
"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useChat } from "../context/ChatContext";
import ScrollContainer from "./ScrollContainer";
import MessageInk from "./MessageInk";
import QuillInput from "./QuillInput";

export default function ChatArea() {
  const { activeChatId, activeChat, createNewChat, addMessage } = useChat();
  const messages = activeChat?.messages || [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

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
    <>
      <ScrollContainer>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-4xl font-bold mb-4 ink-text"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              El Oráculo te escucha
            </motion.h1>
            <p
              className="text-lg max-w-md"
              style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-garamond)" }}
            >
              Pregunta sobre builds, items, enemigos o lugares de tu aventura.
            </p>
          </div>
        ) : (
          <div className="pt-4 pb-8">
            {messages.map((msg, idx) => (
              <MessageInk
                key={idx}
                role={msg.role}
                content={msg.content}
                index={idx}
              />
            ))}
            {isLoading && (
              <div
                className="flex items-center gap-2 my-4"
                style={{ color: "var(--color-ink-muted)" }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--color-gold)" }}
                />
                <span
                  className="inline-block w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--color-gold)", animationDelay: "0.15s" }}
                />
                <span
                  className="inline-block w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--color-gold)", animationDelay: "0.3s" }}
                />
                <span
                  className="text-sm italic"
                  style={{ fontFamily: "var(--font-garamond)" }}
                >
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
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ChatArea.tsx
git commit -m "feat(chat): rewrite ChatArea for wizard-table scene"
```

---

### Task 14: Rewrite the main page

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx**

```tsx
import OracleLayout from "../components/OracleLayout";
import ChatArea from "../components/ChatArea";
import { ChatProvider } from "../context/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <OracleLayout>
        <ChatArea />
      </OracleLayout>
    </ChatProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat(page): mount wizard-table chat in oracle layout"
```

---

### Task 15: Delete obsolete components, hooks and effects

**Files:**
- Delete:
  - `frontend/src/components/Header.tsx`
  - `frontend/src/components/RightSidebar.tsx`
  - `frontend/src/components/ClientLayout.tsx`
  - `frontend/src/components/SmoothScroll.tsx`
  - `frontend/src/components/effects/GSAPProvider.tsx`
  - `frontend/src/components/effects/GridWipe.tsx`
  - `frontend/src/components/effects/ParticleCanvas.tsx`
  - `frontend/src/components/effects/ScrambleGroup.tsx`
  - `frontend/src/components/effects/ScrambleLink.tsx`
  - `frontend/src/components/effects/ScrambleText.tsx`
  - `frontend/src/components/effects/TextScramble.ts`
  - `frontend/src/hooks/useLenis.ts`
  - `frontend/src/hooks/useScrollAnimation.ts`
  - `frontend/src/hooks/useDualLayerScramble.ts`

- [ ] **Step 1: Remove files**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai"
rm -f frontend/src/components/Header.tsx
rm -f frontend/src/components/RightSidebar.tsx
rm -f frontend/src/components/ClientLayout.tsx
rm -f frontend/src/components/SmoothScroll.tsx
rm -rf frontend/src/components/effects
rm -f frontend/src/hooks/useLenis.ts
rm -f frontend/src/hooks/useScrollAnimation.ts
rm -f frontend/src/hooks/useDualLayerScramble.ts
```

- [ ] **Step 2: Check for leftover references**

```bash
grep -r "GSProvider\|GridWipe\|ParticleCanvas\|Scramble\|useLenis\|useScrollAnimation\|useDualLayerScramble\|Header\|RightSidebar\|ClientLayout\|SmoothScroll" frontend/src/ || echo "No leftover references"
```

Expected: no references (or only in `_legacy` backups).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(ui): remove obsolete Good-Fella components, effects and hooks"
```

---

### Task 16: Build, lint and verify no fullscreen regression

**Files:**
- Modify: none
- Test: build output + Playwright at 1920×1080

- [ ] **Step 1: Lint**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai/frontend"
npm run lint
```

Expected: no ESLint errors.

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: static export succeeds.

- [ ] **Step 3: Start backend and capture 1920×1080 screenshot**

```bash
cd "C:/Users/dean/Documents/pixel-quest-ai"
.venv/Scripts/python web_app.py
```

Then with Playwright:
1. Navigate to `http://localhost:8080`.
2. Resize viewport to `1920x1080`.
3. Send the prompt "¿Cuál es el mejor arco para empezar?".
4. Wait for response.
5. Screenshot full page.
6. Assert no horizontal overflow, parchment centered, text readable.

- [ ] **Step 4: Commit final verification results**

```bash
git add -A
git commit -m "feat(wizard-table): complete redesign and verify fullscreen layout"
```

---

## Self-review checklist

1. **Spec coverage:**
   - Wood table background → Task 5.
   - Parchment scroll → Task 9.
   - Quill input → Task 11.
   - Wax seal → Task 6.
   - Hourglass history popup → Tasks 7–8.
   - Chat preserved → Tasks 13–14.
   - Item search and wiki changes removed → Task 15.
   - 1920×1080 verification → Task 16.

2. **Placeholder scan:** no TBD, TODO, or vague steps.

3. **Type consistency:** all components use `React.ReactNode` and matching prop shapes; `ChatContext` API is unchanged.
