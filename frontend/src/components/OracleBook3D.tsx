"use client";

import React from "react";

export default function OracleBook3D({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="oracle-book"
      className="book-stage relative w-full max-w-5xl mx-auto"
    >
      <div className="book relative w-full bg-[#120c08] rounded-r-lg rounded-l-sm shadow-2xl overflow-hidden">
        {/* Outer cover edges */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-[#0f0b08] to-[#2a1d12]" />
        <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-[#0f0b08] to-[#2a1d12]" />
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-[#1a1410] to-[#2a1d12]" />
        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-[#0f0b08] to-[#2a1d12]" />

        {/* Gold border */}
        <div
          className="absolute inset-1 rounded-sm pointer-events-none"
          style={{ border: "1px solid rgba(191, 160, 70, 0.35)" }}
        />

        {/* Open pages background */}
        <div className="relative mx-3 my-3 min-h-[420px] md:min-h-[520px] lg:min-h-[560px] flex book-pages rounded-sm">
          {/* Left page */}
          <div className="flex-1 book-page border-r border-[var(--color-parchment-edge)] rounded-l-sm" />
          {/* Right page */}
          <div className="flex-1 book-page rounded-r-sm" />
          {/* Center fold shadow */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-6 -translate-x-1/2 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.18) 100%)",
            }}
          />
        </div>

        {/* Scrollable content overlay */}
        <div className="absolute inset-3 md:inset-5 overflow-y-auto overflow-x-hidden z-10">
          <div className="min-h-full px-3 py-4 md:px-8 md:py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
