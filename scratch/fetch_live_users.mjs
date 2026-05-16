import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load env manual karena kita di Node scratch
const envPath = resolve(".env.local");
const envContent = readFileSync(envPath, "utf8");
const config = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join("=").trim();
    config[key] = value;
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  appId: config.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Konversi timestamps Firebase ke string agar bisa dibaca di JSON
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key].toDate === 'function') {
          data[key] = data[key].toDate().toISOString();
        }
      });
      users.push({ id: doc.id, ...data });
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

fetchUsers();
