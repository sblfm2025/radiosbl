import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, query, limit } from "firebase/firestore";

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

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function runAudit() {
  console.log("🔍 Memulai Audit Sinkronisasi Firebase...");
  await loadLocalEnv();

  const config = {
    apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
    appId: requiredEnv("VITE_FIREBASE_APP_ID"),
  };

  const app = initializeApp(config);
  const db = getFirestore(app);

  try {
    const q = query(collection(db, "users"), limit(50));
    const snapshot = await getDocs(q);

    console.log(`✅ Koneksi Firebase Berhasil!`);
    console.log(`📊 Jumlah dokumen di koleksi 'users': ${snapshot.size}`);

    if (snapshot.size > 0) {
      console.log("\n📄 Sampel User Terdeteksi:");
      snapshot.docs.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`- [${doc.id}] ${data.displayName} (${data.role})`);
      });
      
      const missingFields = [];
      const sample = snapshot.docs[0].data();
      ['displayName', 'role', 'whatsapp', 'email'].forEach(field => {
        if (!sample[field]) missingFields.push(field);
      });

      if (missingFields.length === 0) {
        console.log("\n✨ Status Integritas: SEMUA KOLOM STANDAR TERPENUHI");
      } else {
        console.log(`\n⚠️ Peringatan: Ada kolom yang kosong pada data sample: ${missingFields.join(', ')}`);
      }
    } else {
      console.log("\n❌ Koleksi 'users' masih kosong di Firebase.");
    }
  } catch (error) {
    console.error("❌ Gagal terhubung ke Firebase:", error.message);
  }
}

runAudit();
