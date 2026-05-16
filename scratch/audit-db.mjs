import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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

async function runAudit() {
  await loadLocalEnv();
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(config);
  const db = getFirestore(app);

  console.log("🔍 Memeriksa koleksi 'users'...");
  
  const snapshot = await getDocs(collection(db, "users"));
  console.log(`📊 Total dokumen ditemukan: ${snapshot.size}`);
  
  snapshot.docs.forEach(d => {
    const data = d.data();
    console.log(`- ID: ${d.id} | Name: ${data.displayName} | Role: ${data.role} | WA: ${data.whatsapp}`);
  });

  const targetWa = "wa-08114441006"; // Miah
  const docRef = doc(db, "users", targetWa);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    console.log(`\n✅ Dokumen Staff ${targetWa} DITEMUKAN!`);
    console.log(JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log(`\n❌ Dokumen Staff ${targetWa} TIDAK ADA di Firestore.`);
  }
}

runAudit();
