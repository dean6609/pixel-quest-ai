"use client";

import React from "react";

export default function WizardTableBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 wood-grain vignette"
      aria-hidden="true"
    >
      <div className="absolute inset-0 candle-flicker bg-gradient-to-br from-black/20 via-transparent to-black/30" />
    </div>
  );
}
