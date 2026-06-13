"use client";

import React, { useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import HistoryPopup from "./HistoryPopup";

export default function HourglassHistory() {
  const [open, setOpen] = useState(false);
  const [spins, setSpins] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion() ?? true;

  const handleToggle = () => {
    setOpen((v) => !v);
    setSpins((n) => n + 1);
  };

  return (
    <>
      <motion.button
        ref={triggerRef}
        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
        animate={shouldReduceMotion ? {} : { rotate: spins * 360 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 16 }}
        onClick={handleToggle}
        className="fixed top-28 right-8 z-40 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(232, 220, 196, 0.12)",
          border: "1px solid rgba(232, 220, 196, 0.25)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        }}
        aria-label={open ? "Cerrar historial" : "Abrir historial"}
        title="Historial"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 22h14" />
          <path d="M5 2h14" />
          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
        </svg>
      </motion.button>
      <HistoryPopup open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} />
    </>
  );
}
