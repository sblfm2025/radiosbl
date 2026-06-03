import { shouldUseLocalFallback } from "../../../lib/env";
import type { ApprovalRequest } from "../../../types/domain";
import {
  createDocument,
  updateDocument,
  listDocuments,
  subscribeDocuments
} from "../../../services/firestore.service";
import { writeAuditLog } from "./auditLog.service";
import { orderBy, where, type Unsubscribe } from "firebase/firestore";

const APPROVAL_LOCAL_KEY = "radiosbl_approval_requests";

function getSafeLocalStorage(): Storage | null {
  if (typeof window !== "undefined") {
    try {
      return window.localStorage;
    } catch {}
  }
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
}

export function readLocalApprovals(): ApprovalRequest[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(APPROVAL_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeLocalApprovals(approvals: ApprovalRequest[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(APPROVAL_LOCAL_KEY, JSON.stringify(approvals.slice(0, 50)));
  } catch (err) {
    console.warn("Gagal menyimpan data persetujuan lokal:", err);
  }
}

export async function createApprovalRequest(
  input: Omit<ApprovalRequest, "id" | "status" | "createdAt">
): Promise<ApprovalRequest> {
  const now = new Date().toISOString();
  const reqItem: ApprovalRequest = {
    ...input,
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: "pending",
    createdAt: now
  };

  const list = readLocalApprovals();
  writeLocalApprovals([reqItem, ...list]);

  // Log audit saat pengajuan dibuat
  void writeAuditLog({
    actorUserId: input.requestedBy,
    actorName: input.requestedByName || "Operator",
    actorRole: "operator",
    action: "create_approval_request",
    targetCollection: "approvalRequests",
    targetId: reqItem.id,
    after: reqItem as any,
    metadata: { type: input.type, title: input.title }
  });

  if (shouldUseLocalFallback()) {
    return reqItem;
  }

  try {
    const id = await createDocument("approvalRequests", {
      type: reqItem.type,
      title: reqItem.title,
      payload: reqItem.payload,
      requestedBy: reqItem.requestedBy,
      requestedByName: reqItem.requestedByName || "",
      status: "pending",
      createdAt: now
    });
    return { ...reqItem, id };
  } catch (err) {
    console.warn("Gagal membuat approval request di Firestore:", err);
    return reqItem;
  }
}

export async function processApprovalRequest(params: {
  approvalId: string;
  status: "approved" | "rejected" | "cancelled";
  reviewerUserId: string;
  reviewerUserName: string;
  reviewerUserRole: string;
  reviewNote?: string;
}): Promise<void> {
  const now = new Date().toISOString();

  const list = readLocalApprovals();
  const index = list.findIndex((r) => r.id === params.approvalId);
  let affectedRequest: ApprovalRequest | undefined;

  if (index !== -1) {
    const current = list[index]!;
    affectedRequest = {
      ...current,
      status: params.status,
      reviewedBy: params.reviewerUserId,
      reviewedByName: params.reviewerUserName,
      reviewNote: params.reviewNote,
      reviewedAt: now
    };
    list[index] = affectedRequest;
    writeLocalApprovals(list);
  }

  // Tulis audit log aksi review
  void writeAuditLog({
    actorUserId: params.reviewerUserId,
    actorName: params.reviewerUserName,
    actorRole: params.reviewerUserRole,
    action: `review_approval_request_${params.status}`,
    targetCollection: "approvalRequests",
    targetId: params.approvalId,
    before: affectedRequest ? { status: "pending" } : undefined,
    after: affectedRequest ? { status: params.status, note: params.reviewNote } : undefined,
    metadata: { type: affectedRequest?.type }
  });

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    await updateDocument("approvalRequests", params.approvalId, {
      status: params.status,
      reviewedBy: params.reviewerUserId,
      reviewedByName: params.reviewerUserName,
      reviewNote: params.reviewNote || "",
      reviewedAt: now
    });
  } catch (err) {
    console.warn("Gagal memperbarui status approval request di Firestore:", err);
  }
}

export function subscribeApprovalQueue(
  onNext: (requests: ApprovalRequest[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      onNext(readLocalApprovals());
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    return () => window.removeEventListener("storage", checkAndTrigger);
  }

  try {
    return subscribeDocuments<ApprovalRequest>(
      "approvalRequests",
      (docs) => {
        onNext(docs.sort((a, b) => b.createdAt.toString().localeCompare(a.createdAt.toString())));
      },
      () => {
        onNext(readLocalApprovals());
      },
      [orderBy("createdAt", "desc")]
    );
  } catch {
    const checkAndTrigger = () => {
      onNext(readLocalApprovals());
    };
    checkAndTrigger();
    return () => {};
  }
}
