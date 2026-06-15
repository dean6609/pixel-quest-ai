import { test, expect } from "@playwright/test";

const SSE_BODY =
  'event: reasoning\ndata: {"delta":"Consultando los tomos antiguos"}\n\n' +
  'event: status\ndata: {"state":"searching"}\n\n' +
  'event: answer\ndata: {"delta":"La espada reposa en el Templo del Alba."}\n\n' +
  'event: done\ndata: {}\n\n';

test.beforeEach(async ({ page }) => {
  await page.route("**/api/ask/stream", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: SSE_BODY,
    });
  });
});

test("open the book, ask, then revisit it from history", async ({ page }) => {
  await page.goto("/");

  // The 3D scene keeps the main thread busy; dispatch DOM clicks directly so
  // React onClick handlers fire deterministically.
  const click = (sel: ReturnType<typeof page.getByRole>) => sel.dispatchEvent("click");

  // Skip the cinematic intro if its affordance is still on screen.
  const skip = page.getByRole("button", { name: /saltar la intro/i });
  if (await skip.isVisible().catch(() => false)) {
    await click(skip);
  }

  // The closed book floats; open it via its accessible twin.
  const openBook = page.getByRole("button", { name: /abrir el grimorio/i });
  await expect(openBook).toBeVisible();
  await click(openBook);

  const input = page.getByRole("textbox", { name: /consulta para el grimorio/i });
  await expect(input).toBeVisible();

  const question = "¿Dónde está la Master Sword?";
  await input.fill(question);
  await input.press("Enter");

  const conversationLog = page.getByRole("log");
  await expect(conversationLog.getByText("La espada reposa en el Templo del Alba.")).toBeVisible();
  await expect(conversationLog.getByText(question)).toBeVisible();

  const reasoningToggle = page.getByRole("button", { name: /razonamiento/i });
  await expect(reasoningToggle).toBeVisible();
  await click(reasoningToggle);
  await expect(page.getByText(/Consultando los tomos antiguos/)).toBeVisible();

  // Open history via the hourglass twin; the conversation should be listed.
  await click(page.getByRole("button", { name: /conversaciones pasadas/i }));
  const historyEntry = page.getByRole("button", { name: question });
  await expect(historyEntry).toBeVisible();

  // Reopen it and confirm the messages are restored in the conversation log.
  await click(historyEntry);
  await expect(conversationLog.getByText("La espada reposa en el Templo del Alba.")).toBeVisible();
  await expect(conversationLog.getByText(question)).toBeVisible();
});
