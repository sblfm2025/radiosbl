import { expect, test, type Page } from "@playwright/test";

const requesterSession = {
  user: {
    id: "demo-miah",
    email: "miah@radiosbl.go.id",
    displayName: "Salmiah",
    role: "announcer",
    airName: "Miah",
    whatsapp: "08114441006",
    active: true
  },
  provider: "demo"
};

const targetSession = {
  user: {
    id: "wa-085397286112",
    email: "amar@radiosbl.go.id",
    displayName: "Amar",
    role: "announcer",
    airName: "Amar",
    whatsapp: "085397286112",
    active: true
  },
  provider: "demo"
};

async function setDemoSession(page: Page, session: typeof requesterSession) {
  await page.evaluate((value) => {
    localStorage.setItem("sbl_demo_local_session", JSON.stringify(value));
  }, session);
}

async function resetDemoState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("sbl_schedule_swaps");
    localStorage.removeItem("sbl_schedule_swap_overrides");
    localStorage.removeItem("sbl_demo_session");
    localStorage.removeItem("sbl_demo_local_session");
  });
}

test("tombol tukar jadwal aman dari pengajuan sampai persetujuan langsung", async ({ page }) => {
  const requestedDate = "2026-05-18";

  await page.goto("/");
  await resetDemoState(page);
  await setDemoSession(page, requesterSession);
  await page.reload();

  await page.getByRole("button", { name: /^Tukar Jadwal$/i }).click();
  await page.getByLabel("Tanggal Tukar").fill(requestedDate);
  await page.getByLabel("Pilih Jadwal Anda").selectOption({ index: 1 });
  await page.getByLabel("Pilih Penyiar Pengganti").selectOption({ index: 1 });
  await page.getByLabel("Alasan Pertukaran").fill("Uji alur pertukaran jadwal tanpa admin.");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: /Kirim Permintaan Tukar/i }).click();
  const whatsappPage = await popupPromise;
  const whatsappUrl = decodeURIComponent(whatsappPage.url()).replace(/\+/g, " ");
  expect(whatsappUrl).toContain("6285397286112");
  expect(whatsappUrl).toContain("page=scheduleSwap");
  expect(whatsappUrl).toContain("Permintaan tukar jadwal Radio SBL");
  await whatsappPage.close();

  await expect(page.getByText(/Permintaan dikirim/i)).toBeVisible();
  await expect(page.getByText("Menunggu rekan penyiar")).toBeVisible();
  await expect(page.getByText(new RegExp(requestedDate))).toBeVisible();

  await setDemoSession(page, targetSession);
  await page.reload();

  await page.getByRole("button", { name: /^Tukar Jadwal$/i }).click();
  await expect(page.getByText("Menunggu keputusan Anda")).toBeVisible();
  await expect(page.getByText(new RegExp(requestedDate))).toBeVisible();
  await page.getByRole("button", { name: "Setujui" }).click();

  await expect(page.getByText("Pertukaran disetujui. Jadwal otomatis diperbarui.")).toBeVisible();
  await expect(page.getByText("Disetujui, jadwal diperbarui")).toBeVisible();

  const stored = await page.evaluate(() => ({
    swaps: JSON.parse(localStorage.getItem("sbl_schedule_swaps") || "[]"),
    overrides: JSON.parse(localStorage.getItem("sbl_schedule_swap_overrides") || "[]")
  }));

  expect(stored.swaps[0].status).toBe("approved");
  expect(stored.swaps[0].targetDate).toBe(requestedDate);
  expect(stored.overrides).toHaveLength(1);
  expect(stored.overrides[0].date).toBe(requestedDate);
  expect(stored.overrides[0].createdBy).toBe(targetSession.user.id);
});

test("permintaan dan jawaban tukar jadwal tampil realtime tanpa refresh", async ({ browser }) => {
  const requestedDate = "2026-05-18";
  const context = await browser.newContext();
  const requesterPage = await context.newPage();
  const targetPage = await context.newPage();

  await requesterPage.goto("/");
  await resetDemoState(requesterPage);
  await setDemoSession(requesterPage, requesterSession);
  await requesterPage.reload();
  await requesterPage.getByRole("button", { name: /^Tukar Jadwal$/i }).click();

  await targetPage.goto("/");
  await setDemoSession(targetPage, targetSession);
  await targetPage.reload();
  await targetPage.getByRole("button", { name: /^Tukar Jadwal$/i }).click();
  await expect(targetPage.getByText("Belum ada aktivitas pertukaran jadwal.")).toBeVisible();

  await requesterPage.getByLabel("Tanggal Tukar").fill(requestedDate);
  await requesterPage.getByLabel("Pilih Jadwal Anda").selectOption({ index: 1 });
  await requesterPage.getByLabel("Pilih Penyiar Pengganti").selectOption({ index: 1 });
  await requesterPage.getByLabel("Alasan Pertukaran").fill("Uji realtime tanpa refresh.");
  const popupPromise = requesterPage.waitForEvent("popup");
  await requesterPage.getByRole("button", { name: /Kirim Permintaan Tukar/i }).click();
  const whatsappPage = await popupPromise;
  await whatsappPage.close();

  await expect(targetPage.getByText("Menunggu keputusan Anda")).toBeVisible();
  await expect(targetPage.getByText(new RegExp(requestedDate))).toBeVisible();
  await targetPage.getByRole("button", { name: "Setujui" }).click();

  await expect(requesterPage.getByText("Disetujui, jadwal diperbarui")).toBeVisible();
  await context.close();
});
