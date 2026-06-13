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
