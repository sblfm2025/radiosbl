import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  addDoc,
  serverTimestamp,
  where
} from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import type { BroadcastProgramSlot, ScheduleOverride } from "../types/domain";
import { weeklyBroadcastSchedule as fallbackSchedule } from "../data/radioData";

const COLLECTION_NAME = "weekly_schedule_slots";
const OVERRIDES_COLLECTION = "scheduleOverrides";
let hasReportedScheduleFallback = false;

function isPermissionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybeError = err as { code?: unknown; message?: unknown };
  return (
    maybeError.code === "permission-denied" ||
    (typeof maybeError.message === "string" &&
      maybeError.message.toLowerCase().includes("missing or insufficient permissions"))
  );
}

function padNumber(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatScheduleDate(date: Date): string {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

export function parseScheduleDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function getScheduleDayName(dateValue: string | Date): string {
  const date = typeof dateValue === "string" ? parseScheduleDate(dateValue) : dateValue;
  return ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][date.getDay()];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getScheduleSlotId(slot: Pick<BroadcastProgramSlot, "day" | "time" | "program">): string {
  return [
    slugify(slot.day),
    slugify(slot.time.replace(/\s+/g, "")),
    slugify(slot.program)
  ].filter(Boolean).join("-");
}

function normalizeSlot(slot: BroadcastProgramSlot, date?: string): BroadcastProgramSlot {
  return {
    ...slot,
    id: slot.id || getScheduleSlotId(slot),
    date,
    source: slot.source || "regular"
  };
}

function applyOverrides(
  slots: BroadcastProgramSlot[],
  overrides: ScheduleOverride[],
  date: string
): BroadcastProgramSlot[] {
  const byId = new Map(slots.map((slot) => [slot.id || getScheduleSlotId(slot), normalizeSlot(slot, date)]));

  for (const override of overrides) {
    const existing = byId.get(override.slotId);

    if (override.type === "add") {
      const addedSlot: BroadcastProgramSlot = normalizeSlot({
        id: override.slotId,
        day: getScheduleDayName(date),
        time: override.newTime || "00.00 - 00.00",
        program: override.newProgram || "Program Khusus",
        description: override.description || override.reason,
        announcer: override.newAnnouncer || "Radio SBL",
        source: "special",
        overrideType: override.type,
        reason: override.reason
      }, date);
      byId.set(addedSlot.id || override.slotId, addedSlot);
      continue;
    }

    if (!existing) {
      continue;
    }

    if (override.type === "cancel") {
      byId.set(override.slotId, {
        ...existing,
        source: "override",
        overrideType: override.type,
        isCancelled: true,
        reason: override.reason
      });
      continue;
    }

    byId.set(override.slotId, {
      ...existing,
      time: override.newTime || existing.time,
      program: override.newProgram || existing.program,
      announcer: override.newAnnouncer || existing.announcer,
      description: override.description || existing.description,
      source: "override",
      overrideType: override.type,
      originalProgram: existing.program,
      originalAnnouncer: existing.announcer,
      originalTime: existing.time,
      reason: override.reason
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Mengambil jadwal mingguan dari Firestore.
 */
export async function getWeeklySchedule(): Promise<BroadcastProgramSlot[]> {
  try {
    const db = getFirebaseFirestore();
    const q = query(collection(db, COLLECTION_NAME), orderBy("day"), orderBy("time"));
    const snap = await getDocs(q);
    
    if (snap.empty) return fallbackSchedule;

    return snap.docs.map(doc => normalizeSlot(doc.data() as BroadcastProgramSlot));
  } catch (err) {
    if (!isPermissionError(err) && !hasReportedScheduleFallback) {
      console.warn("Jadwal Firestore belum tersedia. Menggunakan jadwal lokal.", err);
      hasReportedScheduleFallback = true;
    }
    return fallbackSchedule;
  }
}

export async function getScheduleOverridesByDate(date: string): Promise<ScheduleOverride[]> {
  try {
    const db = getFirebaseFirestore();
    const q = query(collection(db, OVERRIDES_COLLECTION), where("date", "==", date));
    const snap = await getDocs(q);
    return snap.docs
      .map((item) => ({ id: item.id, ...item.data() } as ScheduleOverride))
      .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  } catch (err) {
    if (!isPermissionError(err) && !hasReportedScheduleFallback) {
      console.warn("Override jadwal belum tersedia. Menggunakan jadwal reguler.", err);
      hasReportedScheduleFallback = true;
    }
    return [];
  }
}

export async function getActualScheduleForDate(
  date: string,
  baseSchedule: BroadcastProgramSlot[] = fallbackSchedule
): Promise<BroadcastProgramSlot[]> {
  const day = getScheduleDayName(date);
  const weeklySlots = (await mergeScheduleSlotsRemote(baseSchedule))
    .filter((slot) => slot.day === day)
    .map((slot) => normalizeSlot(slot, date));
  const overrides = await getScheduleOverridesByDate(date);
  return applyOverrides(weeklySlots, overrides, date);
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
  return baseSchedule.map((slot) => normalizeSlot(slot)); // Sementara kembalikan base jika belum ada data lokal
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

export async function saveScheduleOverrideRemote(
  payload: Omit<ScheduleOverride, "id" | "createdAt">
): Promise<string> {
  const db = getFirebaseFirestore();
  const docRef = await addDoc(collection(db, OVERRIDES_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}
