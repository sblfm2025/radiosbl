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

test("Pinrang Berkabar page is searchable and responsive", async ({ page }) => {
  await setDemoSession(page);
  await page.goto("/?page=pinrangBerkabar");

  await expect(page.getByRole("heading", { name: "Pinrang Berkabar" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Buka playlist/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Cari judul/i)).toBeVisible();
  await expect(page.locator(".pinrang-video-identity img")).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) < 900) {
    const menuButton = page.getByRole("button", { name: "Menu", exact: true });
    await expect(menuButton).toHaveClass(/active/);
    await menuButton.click();
    await expect(page.getByRole("heading", { name: "Semua fitur Radio SBL" })).toBeVisible();
    await expect(page.locator(".menu-recent-panel").getByRole("button", { name: /Pinrang Berkabar/i })).toBeVisible();
    await page.goto("/?page=pinrangBerkabar");
    await expect(page.getByRole("heading", { name: "Pinrang Berkabar" })).toBeVisible();
  }

  await expect.poll(async () => page.locator(".pinrang-video-card:not(.loading)").count()).toBeGreaterThan(0);
  const initialCards = await page.locator(".pinrang-video-card:not(.loading)").count();
  expect(initialCards).toBeGreaterThan(0);
  await expect(page.locator(".pinrang-video-player iframe")).toBeVisible();
  await expect(page.locator(".pinrang-video-player").getByText("Now Playing")).toBeVisible();
  await expect(page.getByText("Video Lainnya")).toBeVisible();
  await expect(page.locator(".pinrang-video-carousel")).toBeVisible();

  const loadMore = page.getByRole("button", { name: /Muat lagi/i });
  if (await loadMore.isVisible().catch(() => false)) {
    await loadMore.click();
    await expect.poll(async () => page.locator(".pinrang-video-card:not(.loading)").count()).toBeGreaterThan(initialCards);
  }

  await page.getByPlaceholder(/Cari judul/i).fill("zzzz-tidak-ada-video");
  await expect(page.getByText("Video tidak ditemukan")).toBeVisible();
  await page.getByRole("button", { name: /Reset pencarian/i }).click();
  await expect(page.getByText("Video tidak ditemukan")).toHaveCount(0);

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
