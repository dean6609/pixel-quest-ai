import { describe, it, expect, beforeEach } from "vitest";
import { saveConversation, listConversations, getConversation, deleteConversation } from "./history";
import type { Conversation } from "./types";

let clock = 1_000;
const conv = (id: string): Conversation => ({
  id, title: "t-" + id, createdAt: clock++, messages: [{ role: "user", content: "hi" }],
});

describe("history", () => {
  beforeEach(() => localStorage.clear());
  it("saves and lists newest-first", () => {
    saveConversation(conv("a")); saveConversation(conv("b"));
    expect(listConversations().map(c => c.id)).toEqual(["b", "a"]);
  });
  it("gets by id and deletes", () => {
    saveConversation(conv("a"));
    expect(getConversation("a")?.id).toBe("a");
    deleteConversation("a");
    expect(getConversation("a")).toBeNull();
  });
  it("upserts by id", () => {
    saveConversation(conv("a"));
    saveConversation({ ...conv("a"), title: "updated" });
    expect(listConversations()).toHaveLength(1);
    expect(getConversation("a")?.title).toBe("updated");
  });
});
