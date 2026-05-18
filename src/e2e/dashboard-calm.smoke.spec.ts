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
  await expect(page.locator(".dashboard-menu-grid .dashboard-menu-item")).toHaveCount(4);
  await expect(page.locator(".dashboard-stack").getByText("Jadwal Berikutnya", { exact: true })).toBeHidden();

  await page.getByText("Prioritas lain").click();
  await expect(page.locator(".dashboard-briefing-more .dashboard-briefing-card").first()).toBeVisible();

  const showAllMenu = page.getByRole("button", { name: "Tampilkan semua menu" });
  await expect(showAllMenu).toBeVisible();
  await showAllMenu.click();
  await expect.poll(async () => page.locator(".dashboard-menu-grid .dashboard-menu-item").count()).toBeGreaterThan(4);

  await page.getByText("Detail siaran & arsip").click();
  await expect(page.locator(".dashboard-stack").getByText("Jadwal Berikutnya", { exact: true })).toBeVisible();
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
