"use client";

import React from "react";
import { useDualLayerScramble } from "../../hooks/useDualLayerScramble";

interface ScrambleTextProps {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  triggerOnView?: boolean;
  triggerOnMount?: boolean;
}

export default function ScrambleText({
  text,
  as: Component = "span",
  className = "",
  triggerOnView = true,
  triggerOnMount = false,
}: ScrambleTextProps) {
  const { brandRef, foregroundRef } = useDualLayerScramble(text, {
    duration: 1,
    speed: 1,
    stagger: 0.08,
    revealDelay: 0.1,
    triggerOnView,
    triggerOnMount,
  });

  return (
    <Component className={`relative inline-block ${className}`}>
      <span className="sr-only">{text}</span>
      <span
        ref={brandRef}
        aria-hidden="true"
        className="absolute inset-0 text-[var(--color-brand)]"
      />
      <span ref={foregroundRef} aria-hidden="true" />
    </Component>
  );
}
