import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import type { BroadcastProgramSlot } from "../types/domain";
import { weeklyBroadcastSchedule as fallbackSchedule } from "../data/radioData";

const COLLECTION_NAME = "weekly_schedule_slots";

/**
 * Mengambil jadwal mingguan dari Firestore.
 */
export async function getWeeklySchedule(): Promise<BroadcastProgramSlot[]> {
  try {
    const db = getFirebaseFirestore();
    const q = query(collection(db, COLLECTION_NAME), orderBy("day"), orderBy("time"));
    const snap = await getDocs(q);
    
    if (snap.empty) return fallbackSchedule;

    return snap.docs.map(doc => doc.data() as BroadcastProgramSlot);
  } catch (err) {
    console.error("Gagal mengambil jadwal:", err);
    return fallbackSchedule;
  }
}

/**
 * Menggabungkan jadwal statis dengan jadwal kustom dari Firestore (Remote).
 */
export async function mergeScheduleSlotsRemote(baseSchedule: BroadcastProgramSlot[]): Promise<BroadcastProgramSlot[]> {
  const dynamicSlots = await getWeeklySchedule();
  // Logika penggabungan: Jika ada slot di hari dan jam yang sama, gunakan yang dari Firestore
  const merged = [...baseSchedule];
  
  dynamicSlots.forEach(dSlot => {
    const index = merged.findIndex(m => m.day === dSlot.day && m.time === dSlot.time);
    if (index !== -1) {
      merged[index] = dSlot;
    } else {
      merged.push(dSlot);
    }
  });

  return merged;
}

/**
 * Versi sinkronus untuk inisialisasi awal.
 */
export function mergeScheduleSlots(baseSchedule: BroadcastProgramSlot[]): BroadcastProgramSlot[] {
  return baseSchedule; // Sementara kembalikan base jika belum ada data lokal
}

/**
 * Simpan slot kustom ke Firestore.
 */
export async function saveCustomScheduleSlotRemote(nextSlot: BroadcastProgramSlot, originalSlot: BroadcastProgramSlot): Promise<void> {
  const db = getFirebaseFirestore();
  // Simpan sebagai dokumen baru atau update (untuk simplifikasi kita tambah dokumen baru di koleksi kustom)
  await addDoc(collection(db, COLLECTION_NAME), {
    ...nextSlot,
    sourceDay: originalSlot.day,
    sourceTime: originalSlot.time,
    createdAt: serverTimestamp()
  });
}
