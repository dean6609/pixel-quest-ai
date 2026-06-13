import { test, expect } from "@playwright/test";

test("book, orb and hourglass are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("El Oráculo te escucha")).toBeVisible();
  await expect(page.locator("[data-testid='oracle-book']")).toBeVisible();
  await expect(page.locator("[data-testid='pixel-orb']")).toBeVisible();
  await expect(page.locator("[data-testid='hourglass-button']")).toBeVisible();
});
