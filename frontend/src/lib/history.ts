import type { Conversation } from "./types";
const KEY = "pq.conversations";

function readAll(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeAll(list: Conversation[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}
export function getConversation(id: string): Conversation | null {
  return readAll().find(c => c.id === id) ?? null;
}
export function saveConversation(conv: Conversation): void {
  const list = readAll().filter(c => c.id !== conv.id);
  list.push(conv); writeAll(list);
}
export function deleteConversation(id: string): void {
  writeAll(readAll().filter(c => c.id !== id));
}
