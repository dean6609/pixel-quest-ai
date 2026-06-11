"use client";

import { useRef, useEffect } from "react";
import { TextScramble } from "./TextScramble";

export default function ScrambleLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const scrambleRef = useRef<TextScramble | null>(null);

  useEffect(() => {
    if (spanRef.current) {
      scrambleRef.current = new TextScramble(spanRef.current);
    }
  }, []);

  const handleMouseEnter = () => {
    scrambleRef.current?.setText(children);
  };

  return (
    <a
      href={href}
      className="relative inline-block whitespace-nowrap text-[var(--color-foreground-muted)] transition-colors duration-300 hover:text-[var(--color-foreground)]"
      onMouseEnter={handleMouseEnter}
    >
      <span className="sr-only">{children}</span>
      <span style={{ visibility: "hidden" }}>{children}</span>
      <span
        ref={spanRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        {children}
      </span>
    </a>
  );
}
