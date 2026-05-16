import { 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import type { ScheduleSwapRequest } from "../types/domain";

const COLLECTION_NAME = "schedule_swaps";

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
    where("requesterId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const q2 = query(
    collection(db, COLLECTION_NAME),
    where("targetAnnouncerId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
  
  const results: ScheduleSwapRequest[] = [];
  
  snap1.forEach(doc => results.push({ id: doc.id, ...doc.data() } as ScheduleSwapRequest));
  snap2.forEach(doc => {
    if (!results.find(r => r.id === doc.id)) {
      results.push({ id: doc.id, ...doc.data() } as ScheduleSwapRequest);
    }
  });

  return results.sort((a, b) => {
    const timeA = a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt 
      ? (a.createdAt as any).seconds : 0;
    const timeB = b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt 
      ? (b.createdAt as any).seconds : 0;
    return timeB - timeA;
  });
}

/**
 * Update status permintaan pertukaran.
 */
export async function updateSwapStatus(swapId: string, status: ScheduleSwapRequest["status"]): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, COLLECTION_NAME, swapId);
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
    where("status", "==", "pending_admin"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleSwapRequest));
}
