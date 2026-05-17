import type { DocumentData } from "firebase/firestore";
import type { AppUser, UserRole } from "../types/domain";
import { getDocument } from "./firestore.service";

const validRoles: UserRole[] = [
  "super_admin",
  "admin",
  "leader",
  "announcer",
  "reporter",
  "operator",
  "employee",
  "public"
];

export type FirebaseUserFallback = {
  email: string;
  displayName: string;
  photoUrl?: string;
  whatsapp?: string;
};

const writableUserProfileFields = [
  "email",
  "displayName",
  "airName",
  "announcerNames",
  "role",
  "employeeId",
  "announcerId",
  "photoUrl",
  "whatsapp",
  "active",
  "createdAt",
  "updatedAt"
] as const;

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && validRoles.includes(value as UserRole);
}

function toWritableUserProfile(profile: DocumentData): DocumentData {
  const payload: DocumentData = {};

  for (const field of writableUserProfileFields) {
    if (profile[field] !== undefined) {
      payload[field] = profile[field];
    }
  }

  return payload;
}

export function normalizeUserProfile(
  uid: string,
  fallback: FirebaseUserFallback,
  profile?: DocumentData | null
): AppUser {
  const role = isUserRole(profile?.role) ? profile.role : "public";
  const active = typeof profile?.active === "boolean" ? profile.active : true;
  const displayName =
    typeof profile?.displayName === "string" && profile.displayName.trim()
      ? profile.displayName
      : fallback.displayName;
  const email =
    typeof profile?.email === "string" && profile.email.trim() ? profile.email : fallback.email;
  const employeeId =
    typeof profile?.employeeId === "string" && profile.employeeId.trim()
      ? profile.employeeId
      : undefined;
  const photoUrl =
    typeof profile?.photoUrl === "string" && profile.photoUrl.trim()
      ? profile.photoUrl
      : fallback.photoUrl;
  const whatsapp =
    typeof profile?.whatsapp === "string" ? profile.whatsapp : undefined;
  const airName =
    typeof profile?.airName === "string" ? profile.airName : undefined;
  const announcerNames =
    Array.isArray(profile?.announcerNames) ? profile.announcerNames : [];

  return {
    id: uid,
    email,
    displayName,
    employeeId,
    airName,
    announcerNames,
    photoUrl,
    whatsapp,
    role,
    active
  };
}

/**
 * Menormalkan nomor WhatsApp dari format internasional (+62) ke format lokal (08)
 */
function normalizeWhatsApp(phone?: string): string | undefined {
  if (!phone) return undefined;
  let cleaned = phone.replace(/\D/g, ""); // Ambil angka saja
  if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.slice(2);
  }
  if (!cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

export async function getUserProfile(
  uid: string,
  fallback: FirebaseUserFallback
): Promise<AppUser> {
  const { getDocument, queryDocuments, upsertDocument, deleteDocument } = await import("./firestore.service");
  
  try {
    // 1. Coba cari berdasarkan ID Dokumen (UID)
    let profile = await getDocument<DocumentData>("users", uid);

    // Jika tidak ditemukan atau perannya masih 'public', coba cari di data Staff yang sudah disinkronkan
    if (!profile || profile.role === "public") {
      const waSearch = normalizeWhatsApp(fallback.whatsapp);
      let staffProfile = null;

      // A. Cari berdasarkan ID wa-nomor (Prioritas)
      if (waSearch) {
        staffProfile = await getDocument<DocumentData>("users", `wa-${waSearch}`);
      }

      // B. Cari berdasarkan field whatsapp
      if (!staffProfile && waSearch) {
        const results = await queryDocuments<DocumentData>("users", "whatsapp", "==", waSearch);
        if (results.length > 0) staffProfile = results[0];
      }

      // C. Cari berdasarkan Email
      if (!staffProfile && fallback.email) {
        const results = await queryDocuments<DocumentData>("users", "email", "==", fallback.email);
        if (results.length > 0) staffProfile = results[0];
      }

      // Jika ditemukan data Staff yang cocok, hubungkan ke akun login ini (UID)
      if (staffProfile) {
        console.log(`Mendeteksi profil staff yang cocok: ${staffProfile.displayName}`);
        
        // Buat profil gabungan untuk sesi saat ini
        profile = {
          ...staffProfile,
          id: uid,
          updatedAt: new Date()
        };

        // Coba simpan ke Firestore di latar belakang, jangan biarkan gagal login jika ini error
        try {
          const linkedData = toWritableUserProfile({
            ...staffProfile,
            email: fallback.email,
            updatedAt: new Date()
          });
          await upsertDocument("users", uid, linkedData);
          console.log("Berhasil memperbarui tautan profil di Firestore.");
          
          // Hapus dokumen lama (wa-XXX) jika berhasil terhubung
          if (staffProfile.id && staffProfile.id.startsWith("wa-")) {
            await deleteDocument("users", staffProfile.id);
            console.log(`Dokumen lama (${staffProfile.id}) dihapus untuk menghindari duplikat.`);
          }
        } catch (syncErr) {
          console.warn("Gagal menyimpan tautan profil ke Firestore (tapi login tetap dilanjutkan):", syncErr);
        }
      } else if (!profile) {
        const guestData = {
          email: fallback.email,
          displayName: fallback.displayName,
          photoUrl: fallback.photoUrl || null,
          whatsapp: fallback.whatsapp || null,
          role: "public",
          active: true,
          updatedAt: new Date(),
          createdAt: new Date()
        };
        try {
          await upsertDocument("users", uid, guestData);
          profile = { id: uid, ...guestData };
          console.log("Berhasil merekam user baru ke tabel Users.");
        } catch (syncErr) {
          console.warn("Gagal merekam user baru ke Firestore:", syncErr);
        }
      }
    }

    return normalizeUserProfile(uid, fallback, profile);
  } catch (err) {
    console.error("Gagal mengambil profil user:", err);
    return normalizeUserProfile(uid, fallback, null);
  }
}

export async function upsertUserProfile(uid: string, payload: Partial<AppUser>): Promise<void> {
  const { upsertDocument } = await import("./firestore.service");
  // Pastikan kita tidak menimpa role jika sudah ada dan kita hanya update data minor
  await upsertDocument("users", uid, payload);
}

function buildLocalProfiles(announcers: any[], employees: any[]): AppUser[] {
  const profiles: AppUser[] = [];

  for (const ann of announcers) {
    // Konsisten dengan pola syncSblStaff/firestore: id user announcer = wa-{nomorWA}
    const waId = `wa-${ann.id}`;
    profiles.push({
      id: waId,
      email: `${ann.id}@radiosbl.com`,
      displayName: ann.fullName,
      role: "announcer",
      airName: ann.airName,
      announcerNames: ann.scheduleNames,
      photoUrl: ann.photoUrl,
      whatsapp: ann.id,
      active: true,
      employeeId: undefined
    });
  }

  for (const emp of employees) {
    const role: UserRole =
      emp.role.toLowerCase().includes("direktur") || emp.role.toLowerCase().includes("pengawas")
        ? "super_admin"
        : emp.role.toLowerCase().includes("manajemen") ||
            emp.role.toLowerCase().includes("kabid") ||
            emp.role.toLowerCase().includes("sekretaris")
          ? "admin"
          : emp.role.toLowerCase().includes("it") || emp.role.toLowerCase().includes("engineer")
            ? "operator"
            : emp.role.toLowerCase().includes("reporter")
              ? "reporter"
              : "employee";

    profiles.push({
      id: emp.id,
      email: `${emp.wa}@radiosbl.com`,
      displayName: emp.name,
      role,
      employeeId: emp.id,
      airName: undefined,
      announcerNames: [],
      photoUrl: undefined,
      whatsapp: emp.wa,
      active: true
    });
  }

  return profiles;
}

export async function listUserProfiles(): Promise<AppUser[]> {
  const { shouldUseLocalFallback } = await import("../lib/env");
  const { announcers, employees } = await import("../data/radioData");

  if (shouldUseLocalFallback()) {
    return buildLocalProfiles(announcers, employees);
  }

  const { listDocuments } = await import("./firestore.service");
  try {
    const docs = await listDocuments<DocumentData>("users", []);

    if (!docs || docs.length === 0) {
      return buildLocalProfiles(announcers, employees);
    }

    return docs.map((doc) => {
      const id = doc.id || "";
      return normalizeUserProfile(
        id,
        {
          email: doc.email || "",
          displayName: doc.displayName || doc.name || "User",
          whatsapp: doc.whatsapp || ""
        },
        doc
      );
    });
  } catch (err) {
    console.error("Gagal list profil user:", err);
    return buildLocalProfiles(announcers, employees);
  }
}

/**
 * Fungsi terpusat untuk mensinkronkan 16 staf (Penyiar & Manajemen) ke Firestore.
 * Digunakan untuk inisialisasi awal atau update data personil massal.
 */
export async function syncSblStaff(): Promise<{ success: boolean; count: number; failed: string[] }> {
  const failed: string[] = [];
  let successCount = 0;

  try {
    const { announcers, employees } = await import("../data/radioData");
    const { upsertDocument, queryDocuments, deleteDocument } = await import("./firestore.service");
    const usersToSync = new Map<string, any>();

    // 1. Kumpulkan Data Penyiar
    for (const ann of announcers) {
      const waNumber = ann.id; // Sekarang id di radioData adalah nomor WA
      if (!waNumber) continue;
      
      const waId = `wa-${waNumber}`;
      usersToSync.set(waId, {
        displayName: ann.fullName,
        airName: ann.airName,
        announcerNames: ann.scheduleNames || [ann.airName], // Sinkron dengan jadwal
        email: `${waNumber}@radiosbl.com`,
        role: "announcer",
        whatsapp: waNumber,
        photoUrl: ann.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(ann.airName)}&background=1665D8&color=fff`,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 2. Kumpulkan Data Manajemen (Timpa/Gabung jika ID sama)
    for (const emp of employees) {
      const waId = `wa-${emp.wa}`;
      const isDirector = emp.role.toLowerCase().includes("direktur") || emp.role.toLowerCase().includes("pengawas");
      const isAdmin = emp.role.toLowerCase().includes("manajemen") || emp.role.toLowerCase().includes("kabid") || emp.role.toLowerCase().includes("sekretaris");
      const isOperator = emp.role.toLowerCase().includes("it") || emp.role.toLowerCase().includes("engineer");
      const isReporter = emp.role.toLowerCase().includes("reporter");

      let finalRole: UserRole = "employee";
      if (isDirector) finalRole = "super_admin";
      else if (isAdmin) finalRole = "admin";
      else if (isOperator) finalRole = "operator";
      else if (isReporter) finalRole = "reporter";

      const airName = emp.name.split(" ")[0];
      const existing = usersToSync.get(waId);

      // Jika user sudah ada (misal Hendra), gunakan role yang lebih tinggi atau gabungan
      const mergedRole = existing && existing.role === "announcer" ? finalRole : (existing?.role || finalRole);

      usersToSync.set(waId, {
        displayName: emp.name,
        airName: existing?.airName || airName,
        announcerNames: existing?.announcerNames || existing?.scheduleNames || [],
        email: `${emp.wa}@radiosbl.com`,
        role: mergedRole,
        whatsapp: emp.wa,
        photoUrl: existing?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(airName)}&background=1665D8&color=fff`,
        active: true,
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date()
      });
    }

    // 3. Eksekusi Upsert ke Firestore
    console.log(`Memulai upload ${usersToSync.size} user ke Firestore...`);
    
    const syncPromises = Array.from(usersToSync.entries()).map(async ([waId, data]) => {
      try {
        let targetId = waId;
        // Cari apakah staf ini sudah memiliki dokumen (misalnya sudah ada UID hasil login)
        const existingUsers = await queryDocuments<DocumentData>("users", "whatsapp", "==", data.whatsapp);
        
        for (const existing of existingUsers) {
           if (existing.id && !existing.id.startsWith("wa-")) {
              targetId = existing.id; // Gunakan UID login yang sebenarnya
              break;
           } else if (existing.id === waId) {
              targetId = waId; // Timpa dokumen lama
           }
        }

        await upsertDocument("users", targetId, data);
        successCount++;

        // Jika data berhasil di-upsert ke UID, pastikan dokumen 'wa-XXXX' lama dihapus jika masih ada (untuk menghindari duplikasi)
        if (targetId !== waId) {
            try {
                await deleteDocument("users", waId);
            } catch (e) {}
        }
      } catch (err: any) {
        console.error(`Gagal sinkron user ${waId}:`, err);
        failed.push(`${data.displayName} (${err.message})`);
      }
    });

    await Promise.all(syncPromises);

    return { 
      success: failed.length === 0, 
      count: successCount,
      failed
    };
  } catch (err: any) {
    console.error("Gagal total sinkron staf SBL:", err);
    return { success: false, count: successCount, failed: [err.message] };
  }
}
