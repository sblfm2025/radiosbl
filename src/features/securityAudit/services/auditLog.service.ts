import { shouldUseLocalFallback } from "../../../lib/env";
import type { SecurityAuditLog } from "../../../types/domain";
import {
  createDocument,
  listDocuments,
  subscribeDocuments
} from "../../../services/firestore.service";
import { orderBy, type Unsubscribe } from "firebase/firestore";

const AUDIT_LOCAL_KEY = "radiosbl_security_audit_logs";

function getSafeLocalStorage(): Storage | null {
  if (typeof window !== "undefined") {
    try {
      return window.localStorage;
    } catch {
      // localStorage bisa diblokir browser; audit tetap fail-safe.
    }
  }
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
}

export function readLocalAuditLogs(): SecurityAuditLog[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(AUDIT_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeLocalAuditLogs(logs: SecurityAuditLog[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(AUDIT_LOCAL_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.warn("Gagal menyimpan log audit lokal:", err);
  }
}

export async function writeAuditLog(
  input: Omit<SecurityAuditLog, "id" | "createdAt">
): Promise<SecurityAuditLog> {
  const now = new Date().toISOString();
  const logItem: SecurityAuditLog = {
    ...input,
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now
  };

  const list = readLocalAuditLogs();
  writeLocalAuditLogs([logItem, ...list]);

  if (shouldUseLocalFallback()) {
    return logItem;
  }

  try {
    const id = await createDocument("auditLogs", {
      actorUserId: logItem.actorUserId,
      actorName: logItem.actorName || "",
      actorRole: logItem.actorRole || "",
      action: logItem.action,
      targetCollection: logItem.targetCollection || "",
      targetId: logItem.targetId || "",
      before: logItem.before || null,
      after: logItem.after || null,
      metadata: logItem.metadata || null,
      createdAt: now
    });
    return { ...logItem, id };
  } catch (err) {
    console.warn("Gagal merekam audit log ke Firestore:", err);
    return logItem;
  }
}

export async function listAuditLogs(): Promise<SecurityAuditLog[]> {
  if (shouldUseLocalFallback()) {
    return readLocalAuditLogs();
  }

  try {
    return await listDocuments<SecurityAuditLog>("auditLogs", [
      orderBy("createdAt", "desc")
    ]);
  } catch {
    return readLocalAuditLogs();
  }
}

export function subscribeAuditLogs(
  onNext: (logs: SecurityAuditLog[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      onNext(readLocalAuditLogs());
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    return () => window.removeEventListener("storage", checkAndTrigger);
  }

  try {
    return subscribeDocuments<SecurityAuditLog>(
      "auditLogs",
      (docs) => {
        onNext(docs.sort((a, b) => b.createdAt.toString().localeCompare(a.createdAt.toString())));
      },
      () => {
        onNext(readLocalAuditLogs());
      },
      [orderBy("createdAt", "desc")]
    );
  } catch {
    const checkAndTrigger = () => {
      onNext(readLocalAuditLogs());
    };
    checkAndTrigger();
    return () => {};
  }
}
