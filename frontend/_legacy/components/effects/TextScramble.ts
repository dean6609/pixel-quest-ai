"use client";

import gsap from "gsap";

export class TextScramble {
  el: HTMLElement;
  chars: string;
  frameRequest: number | null = null;
  frame: number = 0;
  queue: Array<{ from: string; to: string; start: number; end: number; char?: string }> = [];
  resolve: (() => void) | null = null;
  private _cancelled = false;

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  }

  setText(newText: string): Promise<void> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this._cancelled = false;
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || "";
        const to = newText[i] || "";
        const start = Math.floor(Math.random() * 30);
        const end = start + Math.floor(Math.random() * 30);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest!);
      this.frame = 0;
      this.update();
    });
  }

  cancel() {
    this._cancelled = true;
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
  }

  update = () => {
    if (this._cancelled) return;

    let output = "";
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span style="color:var(--color-brand);opacity:0.7">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve?.();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  };
}

/**
 * Dual-layer scramble: two sequential phases
 * Phase 1: Random chars appear in brand color
 * Phase 2: Random chars resolve to real text in foreground
 */
export class DualLayerScramble {
  private brandLayer: HTMLElement;
  private foregroundLayer: HTMLElement;
  private chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  private _cancelled = false;
  private frameRequest: number | null = null;

  constructor(brandLayer: HTMLElement, foregroundLayer: HTMLElement) {
    this.brandLayer = brandLayer;
    this.foregroundLayer = foregroundLayer;
  }

  async animate(
    text: string,
    config: { duration?: number; speed?: number; stagger?: number; revealDelay?: number } = {}
  ): Promise<void> {
    const { duration = 1, speed = 1, stagger = 0.08, revealDelay = 0.1 } = config;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      this.foregroundLayer.textContent = text;
      this.brandLayer.textContent = "";
      return;
    }

    this._cancelled = false;

    // Phase 1: Scramble in brand color
    await this.scramblePhase(this.brandLayer, text, duration * 0.4, speed);
    if (this._cancelled) return;

    // Brief overlap
    await this.delay(revealDelay * 1000);
    if (this._cancelled) return;

    // Phase 2: Resolve to real text in foreground
    await this.resolvePhase(this.foregroundLayer, text, duration * 0.6, speed);
    if (this._cancelled) return;

    // Clean up brand layer
    this.brandLayer.textContent = "";
  }

  private scramblePhase(el: HTMLElement, targetText: string, duration: number, speed: number): Promise<void> {
    return new Promise((resolve) => {
      const totalFrames = Math.floor(duration * 60 * speed);
      let frame = 0;

      const update = () => {
        if (this._cancelled) { resolve(); return; }

        let output = "";
        const progress = frame / totalFrames;
        const visibleChars = Math.floor(progress * targetText.length);

        for (let i = 0; i < targetText.length; i++) {
          if (i < visibleChars) {
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            output += char;
          } else {
            output += " ";
          }
        }
        el.textContent = output;

        frame++;
        if (frame <= totalFrames) {
          this.frameRequest = requestAnimationFrame(update);
        } else {
          resolve();
        }
      };

      this.frameRequest = requestAnimationFrame(update);
    });
  }

  private resolvePhase(el: HTMLElement, targetText: string, duration: number, speed: number): Promise<void> {
    return new Promise((resolve) => {
      const totalFrames = Math.floor(duration * 60 * speed);
      let frame = 0;

      const update = () => {
        if (this._cancelled) { resolve(); return; }

        let output = "";
        const progress = frame / totalFrames;
        const resolvedChars = Math.floor(progress * targetText.length);

        for (let i = 0; i < targetText.length; i++) {
          if (i < resolvedChars) {
            output += targetText[i];
          } else if (i < targetText.length) {
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            output += char;
          }
        }
        el.textContent = output;

        frame++;
        if (frame <= totalFrames) {
          this.frameRequest = requestAnimationFrame(update);
        } else {
          el.textContent = targetText;
          resolve();
        }
      };

      this.frameRequest = requestAnimationFrame(update);
    });
  }

  cancel() {
    this._cancelled = true;
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
