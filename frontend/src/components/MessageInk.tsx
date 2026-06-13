"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { marked } from "marked";

function parseMarkdown(content: string): string {
  const result = marked.parse(content);
  const html = typeof result === "string" ? result : "";
  return html.replace(
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`flex ${isUser ? "justify-start" : "justify-end"} mb-6`}
    >
      <div
        className={`relative max-w-[85%] md:max-w-[75%] p-4 rounded-sm ${
          isUser ? "rounded-br-2xl" : "rounded-bl-2xl"
        }`}
        style={{
          background: isUser
            ? "rgba(42, 29, 18, 0.06)"
            : "rgba(191, 160, 70, 0.08)",
          border: `1px solid ${isUser ? "rgba(42,29,18,0.12)" : "rgba(191,160,70,0.25)"}`,
        }}
      >
        <div
          className="text-base leading-relaxed ink-text prose prose-invert max-w-none"
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
