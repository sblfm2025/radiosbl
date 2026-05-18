import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.DOCS_SCREENSHOT_BASE_URL || "http://127.0.0.1:5174";
const outputDir = "docs/screenshots";

const demoSession = {
  user: {
    id: "demo-admin",
    email: "admin@radiosbl.go.id",
    displayName: "Admin Radio SBL",
    role: "admin",
    active: true
  },
  provider: "demo"
};

const demoRequest = [{
  id: "docs-demo-request-1",
  requesterName: "Pendengar Demo",
  title: "Lagu Semangat Pagi",
  artist: "SBL Band",
  message: "Untuk kru pagi",
  status: "new",
  createdAt: new Date().toISOString(),
  notificationText: "Request demo untuk dokumentasi"
}];

async function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server tidak merespons: ${url}`);
}

function startServer() {
  if (process.env.DOCS_SCREENSHOT_BASE_URL) {
    return null;
  }

  const viteBin = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
  const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1", "--port", "5174", "--strictPort", "--mode", "test"], {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: "inherit"
  });

  return child;
}

async function seedDemoState(page) {
  await page.addInitScript(({ session, requests }) => {
    window.localStorage.setItem("sbl_demo_local_session", JSON.stringify(session));
    window.localStorage.setItem("radio-sbl-song-requests", JSON.stringify(requests));
    window.localStorage.setItem("radiosbl.recentPages:demo-admin", JSON.stringify(["attendance", "schedule", "requests"]));
  }, { session: demoSession, requests: demoRequest });
}

async function capture(page, path, options = {}) {
  await page.goto(`${baseUrl}/${options.query || ""}`, { waitUntil: "domcontentloaded" });
  if (options.authenticated) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(options.waitMs ?? 900);
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.allSettled(images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      if ("decode" in image) {
        await image.decode();
        return;
      }
      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }));
  });
  await page.screenshot({ path: `${outputDir}/${path}`, fullPage: options.fullPage ?? true });
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const server = startServer();

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await capture(mobile, "login-mobile.png", { fullPage: true });
    await seedDemoState(mobile);
    await capture(mobile, "dashboard-mobile.png", { authenticated: true });
    await capture(mobile, "attendance-mobile.png", { authenticated: true, query: "?page=attendance" });
    await capture(mobile, "schedule-mobile.png", { authenticated: true, query: "?page=schedule" });
    await capture(mobile, "song-request-mobile.png", { authenticated: true, query: "?page=requests" });
    await capture(mobile, "pinrang-berkabar-mobile.png", { authenticated: true, query: "?page=pinrangBerkabar", waitMs: 1600 });
    await capture(mobile, "ai-script-mobile.png", { authenticated: true, query: "?page=aiScript" });
    await capture(mobile, "users-mobile.png", { authenticated: true, query: "?page=users" });
    await capture(mobile, "profile-mobile.png", { authenticated: true, query: "?page=profile" });
    await capture(mobile, "menu-mobile.png", { authenticated: true, query: "?page=menu" });
    await mobile.close();

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await seedDemoState(desktop);
    await capture(desktop, "dashboard-desktop.png", { authenticated: true, fullPage: false });
    await capture(desktop, "menu-desktop.png", { authenticated: true, query: "?page=dashboard", fullPage: false });
    await desktop.close();

    await browser.close();
    console.log(`Screenshot dokumentasi tersimpan di ${outputDir}`);
  } finally {
    if (server) {
      server.kill();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
