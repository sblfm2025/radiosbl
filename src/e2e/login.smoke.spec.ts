import { expect, test } from "@playwright/test";

test("login screen renders without horizontal overflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Masuk ke studio digital/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Masuk dashboard/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Masuk dengan Google/i })).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    textLength: document.body.innerText.length
  }));

  expect(metrics.textLength).toBeGreaterThan(100);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test("core app navigation and streaming actions are usable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Masuk dashboard/i }).click();
  await expect(page.locator("body")).toContainText("ON AIR");

  const assertPageControls = async () => {
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      unlabeledIconButtons: [...document.querySelectorAll("button")].filter(
        (button) => !button.disabled && !button.getAttribute("aria-label") && !button.textContent?.trim()
      ).length,
      emptyLinks: [...document.querySelectorAll("a")].filter((link) => !link.getAttribute("href")).length
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.unlabeledIconButtons).toBe(0);
    expect(metrics.emptyLinks).toBe(0);
  };

  const navigateByText = async (label: string) => {
    await page.evaluate((text) => {
      const buttons = [...document.querySelectorAll("button")];
      const button =
        buttons.find((item) => item.textContent?.trim() === text) ??
        buttons.find((item) => item.textContent?.includes(text));
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }, label);
  };

  await assertPageControls();

  await page.getByRole("button", { name: /Buka notifikasi request lagu/i }).click();
  await expect(page.locator("body")).toContainText("Antrean request lagu");
  await assertPageControls();

  await navigateByText("Jadwal");
  await expect(page.locator("body")).toContainText("Naskah siaran otomatis");
  await page.getByPlaceholder("Contoh: buka dengan sapaan untuk petani").fill(
    "Buka dengan sapaan untuk pendengar pagi dan ajak request lagu."
  );
  await page.getByRole("button", { name: "Buat naskah" }).click();
  await expect(page.locator("body")).toContainText("Draft bisa diedit penyiar");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page.locator("body")).toContainText("Arsip naskah terbaru");
  await assertPageControls();

  await navigateByText("Streaming");
  await expect(page.locator("body")).toContainText("Sedang Mengudara");
  await page.getByRole("button", { name: /Buka request lagu/i }).click();
  await expect(page.getByPlaceholder("Judul lagu")).toBeVisible();
  await expect(page.getByRole("link", { name: /Website/i })).toHaveAttribute(
    "href",
    /https:\/\/sbl\.pinrangkab\.go\.id/
  );
  await expect(page.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute(
    "href",
    /https:\/\/wa\.me\/6285122561992/
  );
  await assertPageControls();

  await page.getByRole("button", { name: /Kembali ke dashboard/i }).click();
  await expect(page.locator("body")).toContainText("ON AIR");

  await navigateByText("Live OB");
  await expect(page.locator("body")).toContainText("Live / OB");
  await page.getByRole("button", { name: /Kirim notifikasi kru/i }).click();
  await expect(page.locator("body")).toContainText("Buat event Live/OB");
  await assertPageControls();

  await navigateByText("Liputan");
  await expect(page.locator("body")).toContainText("Daftar Tugas Liputan");
  await page.getByRole("button", { name: /Penugasan Baru/i }).click();
  await expect(page.locator("body")).toContainText("Form penugasan baru");
  await assertPageControls();
});
