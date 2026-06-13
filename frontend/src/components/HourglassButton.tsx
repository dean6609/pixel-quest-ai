"use client";

import React, { useState } from "react";
import HistoryPopup from "./HistoryPopup";

export default function HourglassButton() {
  const [open, setOpen] = useState(false);
  const [spins, setSpins] = useState(0);

  const handleClick = () => {
    setOpen((v) => !v);
    setSpins((n) => n + 1);
  };

  return (
    <>
      <button
        data-testid="hourglass-button"
        onClick={handleClick}
        className="hourglass-spin fixed top-28 right-8 z-40 w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          transform: `rotate(${spins * 180}deg)`,
          background: "rgba(232, 220, 196, 0.12)",
          border: "1px solid rgba(232, 220, 196, 0.25)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        }}
        aria-label={open ? "Cerrar historial" : "Abrir historial"}
        title="Historial"
      >
        <svg width="40" height="40" viewBox="0 0 100 140">
          {/* Frame */}
          <path
            d="M10 10 L90 10 L90 20 L10 20 Z"
            fill="#d4b76a"
          />
          <path
            d="M10 120 L90 120 L90 130 L10 130 Z"
            fill="#d4b76a"
          />
          <path
            d="M15 20 L85 20 L50 70 Z"
            fill="rgba(6, 182, 212, 0.2)"
            stroke="#bfa046"
            strokeWidth="2"
          />
          <path
            d="M15 120 L85 120 L50 70 Z"
            fill="rgba(6, 182, 212, 0.2)"
            stroke="#bfa046"
            strokeWidth="2"
          />
          {/* Animated sand */}
          <clipPath id="top-sand">
            <path d="M18 23 L82 23 L50 67 Z" />
          </clipPath>
          <clipPath id="bottom-sand">
            <path d="M18 117 L82 117 L50 73 Z" />
          </clipPath>
          <rect
            x="0"
            y="0"
            width="100"
            height="140"
            fill="#06b6d4"
            opacity="0.6"
            clipPath="url(#top-sand)"
            className="hourglass-sand"
          />
          <rect
            x="0"
            y="0"
            width="100"
            height="140"
            fill="#06b6d4"
            opacity="0.6"
            clipPath="url(#bottom-sand)"
            className="hourglass-sand"
            style={{ animationDelay: "1s" }}
          />
        </svg>
      </button>
      <HistoryPopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}
