"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface GridWipeProps {
  isOpen: boolean;
  onComplete?: () => void;
}

const COLUMN_COUNT = 12;
const BASE_DURATION = 1.5; // 1500ms
const STAGGER_DELAY = 0.03; // 30ms per column

export default function GridWipe({ isOpen, onComplete }: GridWipeProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none flex"
          aria-hidden="true"
        >
          {Array.from({ length: COLUMN_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 h-full"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : BASE_DURATION,
                delay: shouldReduceMotion ? 0 : i * STAGGER_DELAY,
                ease: [0.65, 0, 0.35, 1], // --ease-in-out-cubic
              }}
              onAnimationComplete={() => {
                if (i === COLUMN_COUNT - 1 && onComplete) {
                  onComplete();
                }
              }}
              style={{
                background: "rgba(253, 85, 29, 0.1)",
                transformOrigin: "top",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
