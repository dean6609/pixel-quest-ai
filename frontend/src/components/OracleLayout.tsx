"use client";

import React from "react";
import DungeonBackground from "./DungeonBackground";
import PixelOrb from "./PixelOrb";
import HourglassButton from "./HourglassButton";
import PixelParticles from "./PixelParticles";
import QuillInkwell from "./QuillInkwell";
import OracleBook3D from "./OracleBook3D";

export default function OracleLayout({
  children,
  isLoading = false,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <DungeonBackground />
      <PixelParticles isLoading={isLoading} />
      <QuillInkwell />

      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen px-4 pt-6 pb-36 gap-6 lg:gap-8">
        <div className="order-1 lg:order-1 shrink-0">
          <PixelOrb isLoading={isLoading} />
        </div>

        <div className="order-2 lg:order-2 w-full max-w-4xl">
          <OracleBook3D>{children}</OracleBook3D>
        </div>

        <div className="order-3 lg:order-3 shrink-0">
          <HourglassButton />
        </div>
      </main>
    </div>
  );
}
