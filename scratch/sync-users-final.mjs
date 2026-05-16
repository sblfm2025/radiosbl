import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function runSync() {
  console.log("🚀 Memulai Sinkronisasi via Client SDK...");
  await loadLocalEnv();

  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(config);
  const db = getFirestore(app);

  const { announcers, employees } = await import("../src/data/radioData.ts");
  const usersMap = new Map();

  announcers.forEach(ann => {
    const waNumber = ann.id;
    const airName = ann.airName;
    const id = `wa-${waNumber}`;
    usersMap.set(id, {
      displayName: ann.fullName,
      airName: airName,
      email: `${waNumber}@radiosbl.com`,
      role: "announcer",
      whatsapp: waNumber,
      photoUrl: ann.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(airName)}&background=1665D8&color=fff`,
      active: true
    });
  });

  employees.forEach(emp => {
    const id = `wa-${emp.wa}`;
    const isDirector = emp.role.toLowerCase().includes("direktur") || emp.role.toLowerCase().includes("pengawas");
    const isAdmin = emp.role.toLowerCase().includes("manajemen") || emp.role.toLowerCase().includes("kabid") || emp.role.toLowerCase().includes("sekretaris");
    const isOperator = emp.role.toLowerCase().includes("it") || emp.role.toLowerCase().includes("engineer");
    const isReporter = emp.role.toLowerCase().includes("reporter");

    let role = "employee";
    if (isDirector) role = "super_admin";
    else if (isAdmin) role = "admin";
    else if (isOperator) role = "operator";
    else if (isReporter) role = "reporter";

    const existing = usersMap.get(id);
    const finalRole = existing && existing.role === "announcer" ? role : (existing?.role || role);
    const airName = emp.name.split(" ")[0]; // Default air name for management

    usersMap.set(id, {
      displayName: emp.name,
      airName: existing?.airName || airName,
      email: `${emp.wa}@radiosbl.com`,
      role: finalRole,
      whatsapp: emp.wa,
      photoUrl: existing?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(airName)}&background=1665D8&color=fff`,
      active: true
    });
  });

  console.log(`📦 Memproses ${usersMap.size} user...`);

  for (const [id, data] of usersMap) {
    try {
      await setDoc(doc(db, "users", id), {
        ...data,
        updatedAt: new Date()
      }, { merge: true });
      console.log(`✅ Synced: ${data.displayName} (${data.role})`);
    } catch (e) {
      console.error(`❌ Failed: ${id}`, e.message);
    }
  }

  console.log("\n✨ Sinkronisasi Selesai!");
}

runSync();
