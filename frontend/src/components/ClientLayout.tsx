"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "./Header";
import ChatArea from "./ChatArea";
import RightSidebar from "./RightSidebar";
import { ChatProvider } from "../context/ChatContext";
import ParticleCanvas from "./effects/ParticleCanvas";
import GridWipe from "./effects/GridWipe";

export default function ClientLayout() {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [gridDebug, setGridDebug] = useState(false);
  const [gridWipeActive, setGridWipeActive] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const brandColors = ["#fd551d", "#fb460d", "#ff6b4a", "#fd8d68"];

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        setGridDebug((prev) => !prev);
      }

      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        const currentColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--color-brand")
          .trim();
        const currentIndex = brandColors.indexOf(currentColor);
        const nextIndex = (currentIndex + 1) % brandColors.length;
        document.documentElement.style.setProperty(
          "--color-brand",
          brandColors[nextIndex]
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMenuClick = () => {
    if (!rightSidebarOpen) {
      setGridWipeActive(true);
      setTimeout(() => {
        setRightSidebarOpen(true);
        setGridWipeActive(false);
      }, 800);
    } else {
      setRightSidebarOpen(false);
    }
  };

  return (
    <ChatProvider>
      <div
        className={`relative min-h-[100svh] w-full overflow-hidden ${
          gridDebug ? "grid-debug" : ""
        }`}
        style={{ background: "var(--color-background)" }}
      >
        {/* Three.js Particle Canvases */}
        <ParticleCanvas side="left" />
        <ParticleCanvas side="right" />

        {/* Header */}
        <Header onMenuClick={handleMenuClick} />

        {/* Main Content - Chat */}
        <main className="relative z-10 min-h-[100svh]">
          <ChatArea />
        </main>

        {/* Right Sidebar */}
        <AnimatePresence mode="sync">
          {rightSidebarOpen && (
            <RightSidebar
              isOpen={rightSidebarOpen}
              onClose={() => setRightSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Grid Wipe Transition Overlay */}
        <GridWipe isOpen={gridWipeActive} />
      </div>
    </ChatProvider>
  );
}
