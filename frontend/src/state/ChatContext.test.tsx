import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ChatProvider, useChat } from "./ChatContext";
import * as sc from "../lib/streamClient";

vi.mock("../lib/streamClient");

function Probe() {
  const { messages, reasoning, phase, send } = useChat();
  return (
    <div>
      <button onClick={() => send("hola")}>send</button>
      <span data-testid="phase">{phase}</span>
      <span data-testid="reasoning">{reasoning}</span>
      <span data-testid="answer">{messages.at(-1)?.content ?? ""}</span>
    </div>
  );
}

beforeEach(() => localStorage.clear());

it("streams reasoning then answer and returns to idle", async () => {
  (sc.streamAsk as any).mockImplementation(async (_b: any, emit: any) => {
    emit({ type: "reasoning", delta: "pen" });
    emit({ type: "answer", delta: "Respuesta" });
    emit({ type: "done" });
  });
  render(<ChatProvider><Probe /></ChatProvider>);
  await act(async () => { screen.getByText("send").click(); });
  expect(screen.getByTestId("reasoning").textContent).toContain("pen");
  expect(screen.getByTestId("answer").textContent).toContain("Respuesta");
  expect(screen.getByTestId("phase").textContent).toBe("idle");
});
