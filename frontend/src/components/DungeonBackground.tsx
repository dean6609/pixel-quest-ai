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
