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
