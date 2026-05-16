import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const firebaseToolsConfig = join(homedir(), ".config", "configstore", "firebase-tools.json");

async function loadLocalEnv() {
  const envFile = resolve(".env.local");
  try {
    const content = await readFile(envFile, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function loadFirebaseCliAccessToken() {
  try {
    const configJson = await readFile(firebaseToolsConfig, "utf8");
    const config = JSON.parse(configJson);
    return config.tokens?.access_token;
  } catch (e) {
    return null;
  }
}

function fromFirestoreValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return parseInt(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, fromFirestoreValue(v)])
    );
  }
  return null;
}

async function runAdminAudit() {
  console.log("🚀 Menjalankan Audit Admin (Via REST API)...");
  await loadLocalEnv();
  
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const accessToken = await loadFirebaseCliAccessToken();

  if (!accessToken) {
    console.error("❌ Token Firebase CLI tidak ditemukan. Mohon pastikan 'firebase login' sudah dilakukan di terminal.");
    return;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;
  
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const documents = data.documents || [];

    console.log(`✅ Berhasil mengambil ${documents.length} user langsung dari Firebase!\n`);
    
    const tableData = documents.map(doc => {
      const fields = doc.fields;
      const id = doc.name.split('/').pop();
      return {
        ID: id,
        Nama: fields.displayName?.stringValue || "-",
        Role: fields.role?.stringValue || "-",
        WA: fields.whatsapp?.stringValue || "-",
        Email: fields.email?.stringValue || "-"
      };
    });

    console.table(tableData);

  } catch (error) {
    console.error("❌ Audit Gagal:", error.message);
  }
}

runAdminAudit();
