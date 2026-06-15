export type Role = "user" | "assistant";
export interface Message { role: Role; content: string; }
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}
export type StreamEvent =
  | { type: "reasoning"; delta: string }
  | { type: "status"; state: "thinking" | "searching" }
  | { type: "answer"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };
