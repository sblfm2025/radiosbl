import { shouldUseLocalFallback } from "../../../lib/env";
import type { ShiftHandover } from "../../../types/domain";
import {
  createDocument,
  updateDocument,
  listDocuments,
  subscribeDocuments
} from "../../../services/firestore.service";
import { orderBy, type Unsubscribe } from "firebase/firestore";

const HANDOVER_LOCAL_KEY = "radiosbl_shift_handovers";

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalHandovers(): ShiftHandover[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(HANDOVER_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalHandovers(handovers: ShiftHandover[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(HANDOVER_LOCAL_KEY, JSON.stringify(handovers.slice(0, 30)));
  } catch (err) {
    console.warn("Gagal menyimpan handover lokal:", err);
  }
}

export async function createHandover(
  input: Omit<ShiftHandover, "id" | "createdAt" | "updatedAt">
): Promise<ShiftHandover> {
  const now = new Date().toISOString();
  const handover: ShiftHandover = {
    ...input,
    id: `handover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now
  };

  const list = readLocalHandovers();
  writeLocalHandovers([handover, ...list]);

  if (shouldUseLocalFallback()) {
    return handover;
  }

  try {
    const id = await createDocument("shiftHandovers", {
      date: handover.date,
      fromUserId: handover.fromUserId,
      fromUserName: handover.fromUserName || "",
      toUserId: handover.toUserId || "",
      toUserName: handover.toUserName || "",
      shiftLabel: handover.shiftLabel || "",
      notes: handover.notes,
      pendingRequests: handover.pendingRequests || [],
      technicalNotes: handover.technicalNotes || "",
      priority: handover.priority,
      status: handover.status,
      updatedAt: now
    });
    return { ...handover, id };
  } catch {
    return handover;
  }
}

export async function acknowledgeHandover(
  id: string,
  userId: string,
  userName: string
): Promise<void> {
  const now = new Date().toISOString();

  const list = readLocalHandovers();
  const index = list.findIndex((h) => h.id === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      status: "acknowledged",
      acknowledgedBy: userId,
      acknowledgedByName: userName,
      acknowledgedAt: now,
      updatedAt: now
    };
    writeLocalHandovers(list);
  }

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    await updateDocument("shiftHandovers", id, {
      status: "acknowledged",
      acknowledgedBy: userId,
      acknowledgedByName: userName,
      acknowledgedAt: now,
      updatedAt: now
    });
  } catch (err) {
    console.warn("Gagal menandai tanda terima handover di Firestore:", err);
  }
}

export async function listHandovers(): Promise<ShiftHandover[]> {
  if (shouldUseLocalFallback()) {
    return readLocalHandovers();
  }

  try {
    return await listDocuments<ShiftHandover>("shiftHandovers", [
      orderBy("date", "desc"),
      orderBy("createdAt", "desc")
    ]);
  } catch {
    return readLocalHandovers();
  }
}

export function subscribeHandovers(
  onNext: (handovers: ShiftHandover[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      onNext(readLocalHandovers());
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    return () => window.removeEventListener("storage", checkAndTrigger);
  }

  try {
    return subscribeDocuments<ShiftHandover>(
      "shiftHandovers",
      (docs) => {
        onNext(docs.sort((a, b) => b.createdAt.toString().localeCompare(a.createdAt.toString())));
      },
      () => {
        onNext(readLocalHandovers());
      },
      [orderBy("createdAt", "desc")]
    );
  } catch {
    const checkAndTrigger = () => {
      onNext(readLocalHandovers());
    };
    checkAndTrigger();
    return () => {};
  }
}
