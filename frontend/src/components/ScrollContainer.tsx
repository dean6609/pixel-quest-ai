"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ScrollContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[900px] mx-auto parchment parchment-edge rounded-lg"
      style={{ minHeight: "60vh", maxHeight: "calc(100vh - 220px)" }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)]/40 to-transparent opacity-60" />
      <div className="h-full overflow-y-auto p-6 md:p-10 scrollbar-thin">
        {children}
      </div>
    </motion.div>
  );
}
