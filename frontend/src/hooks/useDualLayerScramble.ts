"use client";

import { useRef, useCallback, useEffect } from "react";
import { DualLayerScramble } from "../components/effects/TextScramble";

interface UseDualLayerScrambleOptions {
  duration?: number;
  speed?: number;
  stagger?: number;
  revealDelay?: number;
  triggerOnMount?: boolean;
  triggerOnView?: boolean;
}

export function useDualLayerScramble(
  text: string,
  options: UseDualLayerScrambleOptions = {}
) {
  const brandRef = useRef<HTMLSpanElement>(null);
  const foregroundRef = useRef<HTMLSpanElement>(null);
  const scrambleRef = useRef<DualLayerScramble | null>(null);
  const hasTriggered = useRef(false);

  const {
    duration = 1,
    speed = 1,
    stagger = 0.08,
    revealDelay = 0.1,
    triggerOnMount = false,
    triggerOnView = true,
  } = options;

  useEffect(() => {
    if (brandRef.current && foregroundRef.current) {
      scrambleRef.current = new DualLayerScramble(brandRef.current, foregroundRef.current);
    }

    return () => {
      scrambleRef.current?.cancel();
    };
  }, []);

  const trigger = useCallback(() => {
    if (hasTriggered.current || !scrambleRef.current) return;
    hasTriggered.current = true;
    scrambleRef.current.animate(text, { duration, speed, stagger, revealDelay });
  }, [text, duration, speed, stagger, revealDelay]);

  // Reset and re-trigger
  const reset = useCallback(() => {
    hasTriggered.current = false;
    scrambleRef.current?.cancel();
    if (brandRef.current) brandRef.current.textContent = "";
    if (foregroundRef.current) foregroundRef.current.textContent = "";
  }, []);

  useEffect(() => {
    if (triggerOnMount) {
      trigger();
    }
  }, [triggerOnMount, trigger]);

  // IntersectionObserver for view trigger
  useEffect(() => {
    if (!triggerOnView || !foregroundRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trigger();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(foregroundRef.current);
    return () => observer.disconnect();
  }, [triggerOnView, trigger]);

  return { brandRef, foregroundRef, trigger, reset };
}
