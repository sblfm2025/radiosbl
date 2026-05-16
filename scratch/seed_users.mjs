import { getFirebaseFirestore } from "../src/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

const users = [
  { name: "AKHMAD AMIRUDDIN", airName: "AMAR", role: "announcer", wa: "085397286112" },
  { name: "SULAIMAN", airName: "SUL", role: "announcer", wa: "085343820280" },
  { name: "WIWIK", airName: "RENA THABITA", role: "announcer", wa: "081342103115" },
  { name: "RISKA DWIYANTI", airName: "RISKA", role: "announcer", wa: "082323334842" },
  { name: "ST. RUKIAH", airName: "RIA FINGKY", role: "announcer", wa: "085242918411" },
  { name: "SALMIAH", airName: "MIAH JUFRI", role: "announcer", wa: "08114441006" },
  { name: "MUHAMMAD CHENDRA BURHAN", airName: "HENDRA", role: "operator", wa: "085255300670" },
  { name: "ANDI AZHAR", airName: "AZHAR", role: "operator", wa: "085156919530" },
  { name: "FAJAR BAKRI", airName: "FAJAR", role: "super_admin", wa: "081343511099" },
  { name: "ANDI HASWIDY RUSTAM", airName: "ANDI WIDY", role: "super_admin", wa: "081346353287" },
  { name: "MUHAMMAD SALEH", airName: "MUHAS", role: "reporter", wa: "085242640984" },
  { name: "FAUZIAH ABBAS", airName: "CHIA", role: "employee", wa: "085242640984" },
  { name: "Tri Amri Maramat", airName: "OCCO", role: "admin", wa: "081355393997" },
  { name: "MUH. IQBAL", airName: "IQBAL", role: "admin", wa: "08114444970" },
  { name: "MURSALIM", airName: "ALIM", role: "admin", wa: "081245328224" }
];

async function seedUsers() {
  const db = getFirebaseFirestore();
  console.log("Memulai seeding data user SBL...");

  for (const u of users) {
    // Kita gunakan nomor WA sebagai ID sementara atau alias
    const userRef = doc(collection(db, "users_metadata"), u.wa); 
    await setDoc(userRef, {
      displayName: u.name,
      airName: u.airName,
      role: u.role,
      whatsapp: u.wa,
      active: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`Berhasil memproses: ${u.name}`);
  }
  console.log("Seeding selesai!");
}

seedUsers();
