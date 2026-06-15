import { test, expect } from "@playwright/test";

const SSE_BODY =
  'event: reasoning\ndata: {"delta":"Consultando los tomos antiguos"}\n\n' +
  'event: status\ndata: {"state":"searching"}\n\n' +
  'event: answer\ndata: {"delta":"La espada reposa en el Templo del Alba."}\n\n' +
  'event: done\ndata: {}\n\n';

test.beforeEach(async ({ page }) => {
  // Mock the streaming backend with a canned SSE response.
  await page.route("**/api/ask/stream", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: SSE_BODY,
    });
  });
});

test("ask a question, watch it answer, then revisit it from history", async ({ page }) => {
  await page.goto("/");

  // The 3D scene keeps the main thread busy, which makes Playwright's real-input
  // click path (actionability + synthetic mouse) flaky. Dispatching the DOM
  // click event directly drives React's onClick handlers deterministically.
  const click = (sel: ReturnType<typeof page.getByRole>) => sel.dispatchEvent("click");

  // Skip the cinematic intro if its affordance is still on screen.
  const skip = page.getByRole("button", { name: /abrir el grimorio/i });
  if (await skip.isVisible().catch(() => false)) {
    await click(skip);
  }

  const input = page.getByRole("textbox", { name: /consulta para el grimorio/i });
  await expect(input).toBeVisible();

  const question = "¿Dónde está la Master Sword?";
  await input.fill(question);
  await input.press("Enter");

  // The answer streams in.
  await expect(page.getByText("La espada reposa en el Templo del Alba.")).toBeVisible();
  // The user's question is rendered as a bubble.
  await expect(page.getByText(question)).toBeVisible();

  // Reasoning collapsed once the answer arrived; expand it to confirm it streamed.
  const reasoningToggle = page.getByRole("button", { name: /razonamiento/i });
  await expect(reasoningToggle).toBeVisible();
  await click(reasoningToggle);
  await expect(page.getByText(/Consultando los tomos antiguos/)).toBeVisible();

  // Open history; the conversation should be listed.
  await click(page.getByRole("button", { name: /conversaciones pasadas/i }));
  const historyEntry = page.getByRole("button", { name: question });
  await expect(historyEntry).toBeVisible();

  // Reopen it and confirm the messages are restored in the conversation log.
  await click(historyEntry);
  const log = page.getByRole("log");
  await expect(log.getByText("La espada reposa en el Templo del Alba.")).toBeVisible();
  await expect(log.getByText(question)).toBeVisible();
});
