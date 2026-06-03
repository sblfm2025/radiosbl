import { shouldUseLocalFallback } from "../../../lib/env";
import type { BroadcastLog } from "../../../types/domain";
import {
  createDocument,
  updateDocument,
  listDocuments,
  subscribeDocuments
} from "../../../services/firestore.service";
import { orderBy, type Unsubscribe } from "firebase/firestore";

const LOGS_LOCAL_KEY = "radiosbl_broadcast_logs";

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalLogs(): BroadcastLog[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOGS_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalLogs(logs: BroadcastLog[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(LOGS_LOCAL_KEY, JSON.stringify(logs.slice(0, 50))); // Batasi 50 entri lokal terbaru
  } catch (err) {
    console.warn("Gagal menyimpan log siaran lokal:", err);
  }
}

export async function submitBroadcastLog(
  input: Omit<BroadcastLog, "id" | "createdAt" | "updatedAt">
): Promise<BroadcastLog> {
  const now = new Date().toISOString();
  const log: BroadcastLog = {
    ...input,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now
  };

  const list = readLocalLogs();
  writeLocalLogs([log, ...list]);

  if (shouldUseLocalFallback()) {
    return log;
  }

  try {
    const id = await createDocument("broadcastLogs", {
      programId: log.programId,
      programTitle: log.programTitle,
      date: log.date,
      actualStartTime: log.actualStartTime || "",
      actualEndTime: log.actualEndTime || "",
      hostIds: log.hostIds,
      operatorId: log.operatorId || "",
      topics: log.topics,
      songsPlayed: log.songsPlayed || [],
      guestNames: log.guestNames || [],
      technicalIssues: log.technicalIssues || "",
      publicFeedbackSummary: log.publicFeedbackSummary || "",
      documentationLinks: log.documentationLinks || [],
      status: log.status,
      createdBy: log.createdBy,
      updatedAt: now
    });
    return { ...log, id };
  } catch {
    return log;
  }
}

export async function updateBroadcastLog(
  id: string,
  updates: Partial<BroadcastLog>
): Promise<void> {
  const now = new Date().toISOString();

  const list = readLocalLogs();
  const index = list.findIndex((l) => l.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates, updatedAt: now };
    writeLocalLogs(list);
  }

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    await updateDocument("broadcastLogs", id, {
      ...updates,
      updatedAt: now
    });
  } catch (err) {
    console.warn("Gagal memperbarui log siaran di Firestore:", err);
  }
}

export async function listBroadcastLogs(): Promise<BroadcastLog[]> {
  if (shouldUseLocalFallback()) {
    return readLocalLogs();
  }

  try {
    return await listDocuments<BroadcastLog>("broadcastLogs", [
      orderBy("date", "desc"),
      orderBy("createdAt", "desc")
    ]);
  } catch {
    return readLocalLogs();
  }
}

export function subscribeBroadcastLogs(
  onNext: (logs: BroadcastLog[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      onNext(readLocalLogs());
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    return () => window.removeEventListener("storage", checkAndTrigger);
  }

  try {
    return subscribeDocuments<BroadcastLog>(
      "broadcastLogs",
      (docs) => {
        onNext(docs.sort((a, b) => b.date.localeCompare(a.date)));
      },
      () => {
        onNext(readLocalLogs());
      },
      [orderBy("date", "desc")]
    );
  } catch {
    const checkAndTrigger = () => {
      onNext(readLocalLogs());
    };
    checkAndTrigger();
    return () => {};
  }
}
