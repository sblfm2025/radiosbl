import { readFile } from "node:fs/promises";
import { loadDotEnv, getTokenPath } from "./google-drive-lib.mjs";

const EXPECTED_APPS_SCRIPT_VERSION = "2026-05-21-drive-validation-v1";

await loadDotEnv();

async function readJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }
  return response.json();
}

async function tokenExists() {
  try {
    const raw = await readFile(getTokenPath(), "utf8");
    const token = JSON.parse(raw);
    return Boolean(token.refresh_token);
  } catch {
    return false;
  }
}

async function localDriveServerReady() {
  try {
    const response = await fetch("http://localhost:8787/upload", { method: "OPTIONS" });
    return response.status === 204;
  } catch {
    return false;
  }
}

async function getPublicTunnelUrl() {
  try {
    const payload = await readJson("http://127.0.0.1:4040/api/tunnels");
    const tunnel = payload.tunnels?.find((item) => item.proto === "https");
    return tunnel?.public_url || "";
  } catch {
    return "";
  }
}

async function appsScriptHealth(endpoint) {
  if (!endpoint) {
    return { configured: false, ok: false, message: "BELUM DISET" };
  }

  try {
    const response = await fetch(endpoint);
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (response.ok && contentType.includes("application/json")) {
      const payload = JSON.parse(text);
      if (payload.ok === true && payload.version !== EXPECTED_APPS_SCRIPT_VERSION) {
        return {
          configured: true,
          ok: false,
          message: `VERSI LAMA: ${payload.version || "tanpa versi"}; perlu ${EXPECTED_APPS_SCRIPT_VERSION}`
        };
      }

      return {
        configured: true,
        ok: payload.ok === true,
        message: payload.ok === true ? `OK (${payload.version})` : "JSON diterima, tetapi ok bukan true"
      };
    }

    if (text.includes("Fungsi skrip tidak ditemukan: doGet")) {
      return {
        configured: true,
        ok: false,
        message: "BELUM REDEPLOY: doGet belum ada di deployment Apps Script"
      };
    }

    return {
      configured: true,
      ok: false,
      message: `Respons tidak terduga (${response.status})`
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghubungi Apps Script"
    };
  }
}

const hasToken = await tokenExists();
const localReady = await localDriveServerReady();
const publicUrl = await getPublicTunnelUrl();
const configuredEndpoint = process.env.VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT || "";
const appsScriptEndpoint = process.env.VITE_GOOGLE_DRIVE_APPS_SCRIPT_ENDPOINT || "";
const appsScriptStatus = await appsScriptHealth(appsScriptEndpoint);

console.log(`Google Drive token: ${hasToken ? "OK" : "BELUM ADA"}`);
console.log(`Server lokal Drive: ${localReady ? "OK" : "MATI"} (http://localhost:8787/upload)`);
console.log(`Tunnel HTTPS: ${publicUrl ? `${publicUrl}/upload` : "MATI"}`);
console.log(`Endpoint proxy lama: ${configuredEndpoint || "KOSONG"}`);
console.log(`Endpoint Apps Script: ${appsScriptEndpoint || "BELUM DISET"}`);
console.log(`Health Apps Script: ${appsScriptStatus.message}`);

if (publicUrl && configuredEndpoint && configuredEndpoint !== `${publicUrl}/upload`) {
  console.log("PERHATIAN: endpoint frontend berbeda dari tunnel aktif.");
}

if (appsScriptEndpoint && configuredEndpoint) {
  console.log("PERHATIAN: Apps Script dan endpoint proxy lama sama-sama terisi. Aplikasi akan memilih Apps Script.");
}
