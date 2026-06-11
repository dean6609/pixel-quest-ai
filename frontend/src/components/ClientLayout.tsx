"use client";

import React, { useState, useEffect } from "react";
import ChatArea from "./ChatArea";
import RightSidebar from "./RightSidebar";
import { ChatProvider } from "../context/ChatContext";
import ParticleCanvas from "./effects/ParticleCanvas";

export default function ClientLayout() {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [gridDebug, setGridDebug] = useState(false);

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
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        const currentColor = getComputedStyle(document.documentElement).getPropertyValue("--color-brand").trim();
        const currentIndex = brandColors.indexOf(currentColor);
        const nextIndex = (currentIndex + 1) % brandColors.length;
        document.documentElement.style.setProperty("--color-brand", brandColors[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ChatProvider>
      <div
        className={`relative min-h-[100svh] w-full overflow-hidden ${gridDebug ? "grid-debug" : ""}`}
        style={{ background: "var(--color-background)" }}
      >
        {/* Three.js Particle Canvases */}
        <ParticleCanvas side="left" />
        <ParticleCanvas side="right" />

        {/* Header - Solo botón menú */}
        <header className="fixed top-6 right-6 z-50">
          <button
            className="p-3 rounded-full transition-all duration-200"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              backdropFilter: "blur(2rem)",
              WebkitBackdropFilter: "blur(2rem)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
              color: "var(--color-foreground)",
            }}
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        {/* Main Content - Chat */}
        <main className="relative z-10 min-h-[100svh]">
          <ChatArea />
        </main>

        {/* Right Sidebar */}
        <RightSidebar
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
        />
      </div>
    </ChatProvider>
  );
}
