import { shouldUseLocalFallback } from "../../../lib/env";
import type { BroadcastRundown, PreBroadcastChecklist } from "../../../types/domain";
import {
  createDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  subscribeDocuments
} from "../../../services/firestore.service";
import { where, orderBy, type Unsubscribe } from "firebase/firestore";
import { writeAuditLog } from "../../securityAudit/services/auditLog.service";

const RUNDOWNS_LOCAL_KEY = "radiosbl_broadcast_rundowns";
const CHECKLISTS_LOCAL_KEY = "radiosbl_pre_broadcast_checklists";

// Helper Local Storage
function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalRundowns(): BroadcastRundown[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(RUNDOWNS_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalRundowns(rundowns: BroadcastRundown[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(RUNDOWNS_LOCAL_KEY, JSON.stringify(rundowns));
  } catch (err) {
    console.warn("Gagal menyimpan rundown lokal:", err);
  }
}

function readLocalChecklists(): PreBroadcastChecklist[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(CHECKLISTS_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalChecklists(checklists: PreBroadcastChecklist[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(CHECKLISTS_LOCAL_KEY, JSON.stringify(checklists));
  } catch (err) {
    console.warn("Gagal menyimpan checklist lokal:", err);
  }
}

// RUNDOWN SERVICE
export async function submitRundown(
  input: Omit<BroadcastRundown, "id" | "createdAt" | "updatedAt">
): Promise<BroadcastRundown> {
  const now = new Date().toISOString();
  const rundown: BroadcastRundown = {
    ...input,
    id: `rundown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now
  };

  if (shouldUseLocalFallback()) {
    const list = readLocalRundowns();
    writeLocalRundowns([rundown, ...list]);
    return rundown;
  }

  // Catat audit log secara fail-safe setelah data tersimpan lokal
  void writeAuditLog({
    actorUserId: rundown.createdBy,
    actorName: rundown.createdBy,
    action: "create_rundown",
    targetCollection: "broadcastRundowns",
    targetId: rundown.id,
    after: { programTitle: rundown.programTitle, date: rundown.date, status: rundown.status }
  });

  try {
    const id = await createDocument("broadcastRundowns", {
      programId: rundown.programId,
      programTitle: rundown.programTitle,
      date: rundown.date,
      startTime: rundown.startTime,
      endTime: rundown.endTime,
      hostIds: rundown.hostIds,
      operatorId: rundown.operatorId || "",
      status: rundown.status,
      segments: rundown.segments,
      createdBy: rundown.createdBy,
      updatedAt: now
    });
    return { ...rundown, id };
  } catch {
    const list = readLocalRundowns();
    writeLocalRundowns([rundown, ...list]);
    return rundown;
  }
}

export async function updateRundown(id: string, updates: Partial<BroadcastRundown>, actorUserId?: string): Promise<void> {
  const now = new Date().toISOString();

  // Catat audit log perubahan rundown secara fail-safe
  void writeAuditLog({
    actorUserId: actorUserId || "system",
    action: "update_rundown",
    targetCollection: "broadcastRundowns",
    targetId: id,
    after: Object.fromEntries(Object.entries(updates))
  });

  if (shouldUseLocalFallback()) {
    const list = readLocalRundowns();
    const index = list.findIndex((r) => r.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates, updatedAt: now };
      writeLocalRundowns(list);
    }
    return;
  }

  try {
    await updateDocument("broadcastRundowns", id, {
      ...updates,
      updatedAt: now
    });
  } catch {
    const list = readLocalRundowns();
    const index = list.findIndex((r) => r.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates, updatedAt: now };
      writeLocalRundowns(list);
    }
  }
}

export async function deleteRundown(id: string, actorUserId?: string): Promise<void> {
  // Catat audit log penghapusan rundown secara fail-safe
  void writeAuditLog({
    actorUserId: actorUserId || "system",
    action: "delete_rundown",
    targetCollection: "broadcastRundowns",
    targetId: id
  });

  if (shouldUseLocalFallback()) {
    const list = readLocalRundowns();
    writeLocalRundowns(list.filter((r) => r.id !== id));
    return;
  }

  try {
    await deleteDocument("broadcastRundowns", id);
  } catch {
    const list = readLocalRundowns();
    writeLocalRundowns(list.filter((r) => r.id !== id));
  }
}

export async function listRundownsByDate(date: string): Promise<BroadcastRundown[]> {
  if (shouldUseLocalFallback()) {
    return readLocalRundowns().filter((r) => r.date === date);
  }

  try {
    return await listDocuments<BroadcastRundown>("broadcastRundowns", [
      where("date", "==", date),
      orderBy("startTime", "asc")
    ]);
  } catch {
    return readLocalRundowns().filter((r) => r.date === date);
  }
}

export function subscribeRundowns(
  date: string,
  onNext: (rundowns: BroadcastRundown[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      onNext(readLocalRundowns().filter((r) => r.date === date));
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    return () => window.removeEventListener("storage", checkAndTrigger);
  }

  try {
    return subscribeDocuments<BroadcastRundown>(
      "broadcastRundowns",
      (docs) => {
        onNext(docs.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      },
      () => {
        onNext(readLocalRundowns().filter((r) => r.date === date));
      },
      [where("date", "==", date)]
    );
  } catch {
    const checkAndTrigger = () => {
      onNext(readLocalRundowns().filter((r) => r.date === date));
    };
    checkAndTrigger();
    return () => {};
  }
}

// CHECKLIST SERVICE
export async function getPreBroadcastChecklist(
  programId: string,
  date: string
): Promise<PreBroadcastChecklist | null> {
  const localList = readLocalChecklists();
  const match = localList.find((c) => c.programId === programId && c.date === date);

  if (shouldUseLocalFallback()) {
    return match || null;
  }

  try {
    const docs = await listDocuments<PreBroadcastChecklist>("preBroadcastChecklists", [
      where("programId", "==", programId),
      where("date", "==", date)
    ]);
    return docs[0] || match || null;
  } catch {
    return match || null;
  }
}

export async function savePreBroadcastChecklist(
  input: Omit<PreBroadcastChecklist, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<PreBroadcastChecklist> {
  const now = new Date().toISOString();
  const id = input.id || `checklist-${Date.now()}`;
  
  const checklist: PreBroadcastChecklist = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now
  };

  const localList = readLocalChecklists();
  const filtered = localList.filter((c) => c.id !== id);
  writeLocalChecklists([checklist, ...filtered]);

  if (shouldUseLocalFallback()) {
    return checklist;
  }

  try {
    if (input.id) {
      await updateDocument("preBroadcastChecklists", input.id, {
        programId: input.programId,
        programTitle: input.programTitle,
        date: input.date,
        items: input.items,
        status: input.status,
        issueNotes: input.issueNotes || "",
        updatedAt: now
      });
      return checklist;
    } else {
      const docId = await createDocument("preBroadcastChecklists", {
        programId: input.programId,
        programTitle: input.programTitle,
        date: input.date,
        items: input.items,
        status: input.status,
        issueNotes: input.issueNotes || "",
        updatedAt: now
      });
      return { ...checklist, id: docId };
    }
  } catch {
    return checklist;
  }
}

export function subscribePreBroadcastChecklist(
  programId: string,
  date: string,
  onNext: (checklist: PreBroadcastChecklist | null) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      const item = readLocalChecklists().find(
        (c) => c.programId === programId && c.date === date
      );
      onNext(item || null);
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    return () => window.removeEventListener("storage", checkAndTrigger);
  }

  try {
    return subscribeDocuments<PreBroadcastChecklist>(
      "preBroadcastChecklists",
      (docs) => {
        onNext(docs[0] || null);
      },
      () => {
        const item = readLocalChecklists().find(
          (c) => c.programId === programId && c.date === date
        );
        onNext(item || null);
      },
      [where("programId", "==", programId), where("date", "==", date)]
    );
  } catch {
    const checkAndTrigger = () => {
      const item = readLocalChecklists().find(
        (c) => c.programId === programId && c.date === date
      );
      onNext(item || null);
    };
    checkAndTrigger();
    return () => {};
  }
}
