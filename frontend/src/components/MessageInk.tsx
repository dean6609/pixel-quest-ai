"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

function parseMarkdown(content: string): string {
  const result = marked.parse(content);
  const rawHtml = typeof result === "string" ? result : "";
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
  });
  return cleanHtml.replace(
    /<a href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );
}

function sanitizeContent(content: string): string {
  return content
    .replace(/<｜｜DSML｜｜tool_calls>[\s\S]*?<\/｜｜DSML｜｜tool_calls>/g, "")
    .replace(/<｜｜DSML｜｜invoke[^>]*>[\s\S]*?<\/｜｜DSML｜｜invoke>/g, "")
    .replace(/<｜｜DSML｜｜parameter[^>]*>[\s\S]*?<\/｜｜DSML｜｜parameter>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type MessageInkProps = {
  role: "user" | "assistant";
  content: string;
  index: number;
};

export default function MessageInk({ role, content, index }: MessageInkProps) {
  const html = useMemo(
    () => parseMarkdown(sanitizeContent(content)),
    [content]
  );

  const isUser = role === "user";
  const shouldReduceMotion = useReducedMotion() ?? true;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.08 }}
      className={`flex ${isUser ? "justify-start" : "justify-end"} mb-6`}
    >
      <div
        className={`relative max-w-[90%] md:max-w-[85%] p-4 rounded-sm ${
          isUser ? "rounded-br-2xl" : "rounded-bl-2xl"
        }`}
        style={{
          background: isUser
            ? "rgba(42, 29, 18, 0.06)"
            : "rgba(191, 160, 70, 0.08)",
          border: `1px solid ${isUser ? "rgba(42,29,18,0.12)" : "rgba(191,160,70,0.25)"}`,
        }}
      >
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0.8, clipPath: "inset(0 100% 0 0)" }
          }
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }
          }
          className="text-base leading-relaxed ink-text max-w-none break-words"
          style={{ fontFamily: "var(--font-garamond)" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div
          className="mt-2 text-xs uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "var(--color-ink-muted)",
          }}
        >
          {isUser ? "Adventurer" : "Oracle"}
        </div>
      </div>
    </motion.div>
  );
}
