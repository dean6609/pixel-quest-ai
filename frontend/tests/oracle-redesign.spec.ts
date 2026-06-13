import { test, expect } from "@playwright/test";

test.describe("Oracle redesign", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("pq_ai_chats");
      localStorage.removeItem("pq_ai_active_chat_id");
    });
    await page.reload();
  });

  test("book, orb and hourglass are visible", async ({ page }) => {
    await expect(page.getByText("El Oráculo te escucha")).toBeVisible();
    await expect(page.locator("[data-testid='oracle-book']")).toBeVisible();
    await expect(page.locator("[data-testid='pixel-orb']")).toBeVisible();
    await expect(page.locator("[data-testid='hourglass-button']")).toBeVisible();
  });

  test("can ask a question and receive a response", async ({ page }) => {
    const input = page.locator("textarea[aria-label='Escribe tu pregunta al Oráculo']");
    await input.fill("¿Qué es Pixel Quest?");
    await input.press("Enter");

    await expect(page.getByText("Adventurer")).toBeVisible();
    await expect(page.getByText("Oracle")).toBeVisible({ timeout: 30000 });
  });

  test("hourglass opens history popup", async ({ page }) => {
    await page.locator("[data-testid='hourglass-button']").click();
    await expect(page.getByText("Memorias del Oráculo")).toBeVisible();
  });

  test("mobile viewport stacks elements vertically", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    const book = page.locator("[data-testid='oracle-book']");
    const orb = page.locator("[data-testid='pixel-orb']");
    const hourglass = page.locator("[data-testid='hourglass-button']");

    const bookBox = await book.boundingBox();
    const orbBox = await orb.boundingBox();
    const hourglassBox = await hourglass.boundingBox();

    expect(orbBox && bookBox && hourglassBox).toBeTruthy();
    if (orbBox && bookBox && hourglassBox) {
      expect(orbBox.y).toBeLessThan(bookBox.y);
      expect(bookBox.y).toBeLessThan(hourglassBox.y);
    }
  });
});
