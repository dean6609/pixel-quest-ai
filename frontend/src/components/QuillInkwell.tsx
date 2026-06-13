"use client";

import React from "react";

export default function QuillInkwell() {
  return (
    <div
      data-testid="quill-inkwell"
      className="fixed bottom-8 left-8 z-10 hidden lg:block"
      aria-hidden="true"
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Inkwell */}
        <ellipse cx="55" cy="95" rx="28" ry="14" fill="#1a1410" />
        <path
          d="M35 95 L38 70 C38 62 72 62 72 70 L75 95 Z"
          fill="#0f0b08"
          stroke="#2a1d12"
          strokeWidth="1.5"
        />
        <ellipse cx="55" cy="70" rx="17" ry="6" fill="#1a1410" stroke="#2a1d12" strokeWidth="1.5" />
        <ellipse cx="55" cy="72" rx="12" ry="4" fill="#020617" />

        {/* Quill feather */}
        <path
          d="M75 75 Q95 45 90 15 Q85 40 70 70"
          fill="#e8dcc4"
          stroke="#c4b49a"
          strokeWidth="1.5"
        />
        <path
          d="M78 68 Q88 48 85 28"
          fill="none"
          stroke="#d4c5a9"
          strokeWidth="1"
        />
        <line x1="70" y1="70" x2="75" y2="75" stroke="#2a1d12" strokeWidth="2" />
      </svg>
    </div>
  );
}
