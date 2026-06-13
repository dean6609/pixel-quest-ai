"use client";

import React, { createContext, useContext, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrambleGroupContextType {
  register: (id: string, trigger: () => void) => void;
  unregister: (id: string) => void;
}

const ScrambleGroupContext = createContext<ScrambleGroupContextType>({
  register: () => {},
  unregister: () => {},
});

export function useScrambleGroup() {
  return useContext(ScrambleGroupContext);
}

interface ScrambleGroupProps {
  children: React.ReactNode;
  /** Stagger delay between each scramble in seconds, default 0.08 */
  stagger?: number;
  /** ScrollTrigger start position, default "top 80%" */
  triggerStart?: string;
  /** Whether to auto-trigger on scroll, default true */
  autoTrigger?: boolean;
}

export default function ScrambleGroup({
  children,
  stagger = 0.08,
  triggerStart = "top 80%",
  autoTrigger = true,
}: ScrambleGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef<Map<string, () => void>>(new Map());
  const timeoutIdsRef = useRef<number[]>([]);

  const register = useCallback((id: string, trigger: () => void) => {
    entriesRef.current.set(id, trigger);
  }, []);

  const unregister = useCallback((id: string) => {
    entriesRef.current.delete(id);
  }, []);

  const fireAll = useCallback(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const entries = Array.from(entriesRef.current.values());
    entries.forEach((trigger, i) => {
      const id = window.setTimeout(() => trigger(), i * stagger * 1000);
      timeoutIdsRef.current.push(id);
    });
  }, [stagger]);

  useEffect(() => {
    if (!autoTrigger || !groupRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const scrollTrigger = ScrollTrigger.create({
      trigger: groupRef.current,
      start: triggerStart,
      once: true,
      onEnter: fireAll,
    });

    return () => {
      scrollTrigger.kill();
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, [autoTrigger, triggerStart, fireAll]);

  return (
    <ScrambleGroupContext.Provider value={{ register, unregister }}>
      <div ref={groupRef}>{children}</div>
    </ScrambleGroupContext.Provider>
  );
}
