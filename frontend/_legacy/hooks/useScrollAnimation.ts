"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ScrollAnimationOptions {
  /** ScrollTrigger start position, default "top 80%" */
  start?: string;
  /** Animation duration in seconds, default 0.8 */
  duration?: number;
  /** Stagger delay in seconds, default 0.05 */
  stagger?: number;
  /** Y offset for slide-up animation, default 30 */
  y?: number;
  /** Whether to respect reduced motion, default true */
  respectReducedMotion?: boolean;
  /** If true, animate on mount with delay instead of waiting for scroll */
  triggerOnMount?: boolean;
  /** Delay in seconds before mount trigger fires, default 0.3 */
  mountDelay?: number;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
) {
  const ref = useRef<T>(null);
  const {
    start = "top 80%",
    duration = 0.8,
    stagger = 0.05,
    y = 30,
    respectReducedMotion = true,
    triggerOnMount = false,
    mountDelay = 0.3,
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion =
      respectReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(element, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(element, { opacity: 0, y });

    // If triggerOnMount, animate on mount with a delay
    if (triggerOnMount) {
      const timeout = setTimeout(() => {
        gsap.to(element, {
          opacity: 1,
          y: 0,
          duration,
          ease: "power3.out",
        });
      }, mountDelay * 1000);
      return () => clearTimeout(timeout);
    }

    // Otherwise, use ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start,
      once: true,
      onEnter: () => {
        gsap.to(element, {
          opacity: 1,
          y: 0,
          duration,
          ease: "power3.out",
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [start, duration, stagger, y, respectReducedMotion, triggerOnMount, mountDelay]);

  return ref;
}

export function useStaggerScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions & { childSelector?: string } = {}
) {
  const ref = useRef<T>(null);
  const {
    start = "top 80%",
    duration = 0.6,
    stagger = 0.08,
    y = 20,
    childSelector = "[data-animate]",
    respectReducedMotion = true,
    triggerOnMount = false,
    mountDelay = 0.3,
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion =
      respectReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const children = element.querySelectorAll(childSelector);
    if (children.length === 0) return;

    if (prefersReducedMotion) {
      gsap.set(children, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(children, { opacity: 0, y });

    // If triggerOnMount, animate on mount with a delay
    if (triggerOnMount) {
      const timeout = setTimeout(() => {
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: "power3.out",
        });
      }, mountDelay * 1000);
      return () => clearTimeout(timeout);
    }

    // Otherwise, use ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start,
      once: true,
      onEnter: () => {
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: "power3.out",
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [start, duration, stagger, y, childSelector, respectReducedMotion, triggerOnMount, mountDelay]);

  return ref;
}
