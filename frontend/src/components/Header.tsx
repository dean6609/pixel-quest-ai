"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="grid-container">
        <div className="grid-layout items-center h-[var(--site-header-height)]">
          <div className="grid-span-6 lg:grid-span-3 flex items-center gap-3 pointer-events-auto">
            <span
              className="text-sm font-semibold tracking-tight uppercase"
              style={{ color: "var(--color-foreground)" }}
            >
              Pixel Quest AI
            </span>
            <span
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-foreground-muted)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-custom"
                style={{ background: "var(--color-brand)" }}
              />
              Oracle Online
            </span>
          </div>

          <div className="grid-span-6 lg:grid-span-3 lg:grid-start-10 flex justify-end pointer-events-auto">
            <button
              onClick={onMenuClick}
              className="btn-press glass-panel rounded-full p-3 transition-colors duration-200 hover:bg-white/5"
              aria-label="Abrir herramientas"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
