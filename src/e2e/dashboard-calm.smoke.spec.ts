import { expect, test, type Page } from "@playwright/test";

const adminSession = {
  user: {
    id: "demo-admin",
    email: "admin@radiosbl.go.id",
    displayName: "Admin Radio SBL",
    role: "admin",
    active: true
  },
  provider: "demo"
};

async function setDemoSession(page: Page) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("sbl_demo_local_session", JSON.stringify(value));
  }, adminSession);
}

test("dashboard keeps shortcut grid calm by default", async ({ page }) => {
  await setDemoSession(page);
  await page.goto("/?page=dashboard");

  await expect(page.locator(".dashboard-radio-player")).toBeVisible();
  await expect(page.locator(".dashboard-focus-strip")).toBeVisible();
  await expect(page.locator(".dashboard-briefing-grid > .dashboard-briefing-card")).toHaveCount(1);
  await expect(page.getByText("Prioritas lain")).toBeVisible();
  await expect(page.locator(".dashboard-shortcut-grid .dashboard-shortcut-card")).toHaveCount(4);
  await expect(page.locator(".dashboard-stack").getByText("Aktivitas Terbaru", { exact: true })).toBeHidden();

  await page.getByText("Prioritas lain").click();
  await expect(page.locator(".dashboard-briefing-more .dashboard-briefing-card").first()).toBeVisible();

  await page.getByRole("button", { name: "Semua Menu" }).click();
  await expect(page.getByRole("heading", { name: "Semua fitur Radio SBL" })).toBeVisible();
  await expect.poll(async () => page.locator(".menu-tile").count()).toBeGreaterThan(4);

  await page.goto("/?page=dashboard");
  await page.getByText("Aktivitas Terbaru & Podcast").click();
  await expect(page.locator(".dashboard-stack").getByText("Aktivitas Terbaru", { exact: true })).toBeVisible();
  await expect(page.locator(".dashboard-stack").getByText("Podcast Unggulan", { exact: true })).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    badButtons: Array.from(document.querySelectorAll("button")).filter((button) => (
      !button.disabled &&
      !button.getAttribute("aria-label") &&
      !button.textContent?.trim()
    )).length
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.badButtons).toBe(0);
});
