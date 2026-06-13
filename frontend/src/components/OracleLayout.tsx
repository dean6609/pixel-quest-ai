"use client";

import React from "react";
import WizardTableBackground from "./WizardTableBackground";
import WaxSeal from "./WaxSeal";
import HourglassHistory from "./HourglassHistory";

export default function OracleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <WizardTableBackground />
      <WaxSeal />
      <HourglassHistory />
      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-12 pb-32">
        {children}
      </main>
    </div>
  );
}
