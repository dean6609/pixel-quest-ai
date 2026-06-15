import { it, expect } from "vitest";
import { parseSSE } from "./streamClient";
import type { StreamEvent } from "./types";

it("parses multi-event SSE text into typed events", () => {
  const text =
    'event: reasoning\ndata: {"delta":"pen"}\n\n' +
    'event: status\ndata: {"state":"searching"}\n\n' +
    'event: answer\ndata: {"delta":"hola"}\n\n' +
    'event: done\ndata: {}\n\n';
  const got: StreamEvent[] = [];
  parseSSE(text, e => got.push(e));
  expect(got).toEqual([
    { type: "reasoning", delta: "pen" },
    { type: "status", state: "searching" },
    { type: "answer", delta: "hola" },
    { type: "done" },
  ]);
});
