"use client";

import React from "react";

export default function OracleBook3D({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="oracle-book" className="book-stage w-full max-w-4xl mx-auto px-4">
      <div className="book relative w-full aspect-[16/10]">
        {/* Back cover */}
        <div className="absolute inset-0 book-cover rounded-lg" />

        {/* Spine */}
        <div
          className="absolute left-1/2 top-2 bottom-2 w-6 -translate-x-1/2 book-spine z-10"
          style={{ transform: "translateX(-50%) translateZ(6px)" }}
        />

        {/* Left page */}
        <div
          className="absolute left-2 top-3 bottom-3 w-[calc(50%-14px)] book-page rounded-l-md border-r border-[var(--color-parchment-edge)]"
          style={{ transform: "rotateY(8deg) translateZ(8px)" }}
        />

        {/* Right page */}
        <div
          className="absolute right-2 top-3 bottom-3 w-[calc(50%-14px)] book-page rounded-r-md border-l border-[var(--color-parchment-edge)]"
          style={{ transform: "rotateY(-8deg) translateZ(8px)" }}
        />

        {/* Scrollable content area */}
        <div className="absolute inset-[3%] z-30 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
