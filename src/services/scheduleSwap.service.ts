import { 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import { saveCustomScheduleSlotRemote, getWeeklySchedule } from "./scheduleSlot.service";
import { getDocument } from "./firestore.service";
import { announcers as localAnnouncers } from "../data/radioData";
import type { ScheduleSwapRequest, AppUser, BroadcastProgramSlot } from "../types/domain";

const COLLECTION_NAME = "schedule_swaps";

function getCreatedAtTime(value: ScheduleSwapRequest["createdAt"]): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const timestamp = value as unknown;
  if (
    timestamp &&
    typeof timestamp === "object" &&
    "seconds" in timestamp &&
    typeof (timestamp as { seconds?: unknown }).seconds === "number"
  ) {
    return (timestamp as { seconds: number }).seconds * 1000;
  }

  return 0;
}

function sortByNewest(swaps: ScheduleSwapRequest[]): ScheduleSwapRequest[] {
  return [...swaps].sort((a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt));
}

function normalizeAnnouncerId(value: string): string {
  return value.trim().toLowerCase();
}

function findLocalAnnouncerName(targetAnnouncerId: string): string | undefined {
  const normalized = normalizeAnnouncerId(targetAnnouncerId);
  const candidate = localAnnouncers.find((profile) => {
    return (
      normalizeAnnouncerId(profile.id) === normalized ||
      normalizeAnnouncerId(`wa-${profile.id}`) === normalized ||
      normalizeAnnouncerId(profile.airName) === normalized ||
      normalizeAnnouncerId(profile.fullName) === normalized
    );
  });
  return candidate?.airName || candidate?.fullName;
}

async function resolveAnnouncerText(targetAnnouncerId: string): Promise<string | undefined> {
  const targetUser = await getDocument<AppUser>("users", targetAnnouncerId);
  if (targetUser?.airName) return targetUser.airName;
  if (targetUser?.displayName) return targetUser.displayName;
  return findLocalAnnouncerName(targetAnnouncerId);
}

/**
 * Mengajukan permintaan pertukaran jadwal baru.
 */
export async function createSwapRequest(payload: Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt">): Promise<string> {
  const db = getFirebaseFirestore();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...payload,
    status: "pending_target",
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Mendapatkan daftar permintaan pertukaran untuk user tertentu (sebagai peminta atau target).
 */
export async function getMySwapRequests(userId: string): Promise<ScheduleSwapRequest[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, COLLECTION_NAME),
    where("requesterId", "==", userId)
  );
  
  const q2 = query(
    collection(db, COLLECTION_NAME),
    where("targetAnnouncerId", "==", userId)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
  
  const results: ScheduleSwapRequest[] = [];
  
  snap1.forEach(doc => results.push({ id: doc.id, ...doc.data() } as ScheduleSwapRequest));
  snap2.forEach(doc => {
    if (!results.find(r => r.id === doc.id)) {
      results.push({ id: doc.id, ...doc.data() } as ScheduleSwapRequest);
    }
  });

  return sortByNewest(results);
}

async function applySwapToSchedule(swap: ScheduleSwapRequest): Promise<void> {
  const [day, time, program] = swap.scheduleId.split("|");
  if (!day || !time || !program) {
    throw new Error("Format scheduleId tidak valid untuk penerapan jadwal.");
  }

  const announcerText = await resolveAnnouncerText(swap.targetAnnouncerId);
  if (!announcerText) {
    throw new Error("Tidak dapat menemukan nama penyiar pengganti untuk targetAnnouncerId.");
  }

  const scheduleSlots = await getWeeklySchedule();
  const originalSlot = scheduleSlots.find((slot) => slot.day === day && slot.time === time && slot.program === program);
  const description = originalSlot?.description || "";
  const sourceAnnouncer = originalSlot?.announcer || "";

  const nextSlot: BroadcastProgramSlot = {
    day,
    time,
    program,
    description,
    announcer: announcerText
  };

  const originalSlotPayload: BroadcastProgramSlot = {
    day,
    time,
    program,
    description,
    announcer: sourceAnnouncer
  };

  await saveCustomScheduleSlotRemote(nextSlot, originalSlotPayload);
}

export async function updateSwapStatus(swapId: string, status: ScheduleSwapRequest["status"]): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, COLLECTION_NAME, swapId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    throw new Error("Swap request tidak ditemukan.");
  }

  const swapData = { ...(snapshot.data() as ScheduleSwapRequest), id: snapshot.id } as ScheduleSwapRequest;

  if (status === "approved") {
    await applySwapToSchedule(swapData);
  }

  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp()
  });
}

/**
 * Mendapatkan semua permintaan tertunda untuk Admin.
 */
export async function getPendingSwapsForAdmin(): Promise<ScheduleSwapRequest[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, COLLECTION_NAME),
    where("status", "==", "pending_admin")
  );
  const snap = await getDocs(q);
  return sortByNewest(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleSwapRequest)));
}
