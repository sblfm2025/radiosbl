import { shouldUseLocalFallback } from "../lib/env";
import type { Complaint } from "../types/domain";
import {
  createDocument,
  listDocuments,
  subscribeDocuments,
  updateDocument
} from "./firestore.service";

const COMPLAINTS_KEY = "radio-sbl-complaints";
const MAX_LOCAL_COMPLAINTS = 50;

export type ComplaintInput = {
  reporterName: string;
  category: Complaint["category"];
  message: string;
};

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalComplaints(): Complaint[] {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(COMPLAINTS_KEY);
    return raw ? (JSON.parse(raw) as Complaint[]) : [];
  } catch {
    return [];
  }
}

function writeLocalComplaints(complaints: Complaint[]) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints.slice(0, MAX_LOCAL_COMPLAINTS)));
}

export function listLocalComplaints(): Complaint[] {
  return readLocalComplaints();
}

export function createComplaintDraft(input: ComplaintInput): Complaint {
  if (!input.message.trim()) {
    throw new Error("Isi pengaduan atau saran wajib diisi.");
  }

  return {
    id: `complaint-${Date.now()}`,
    reporterName: input.reporterName.trim() || "Publik",
    category: input.category,
    message: input.message.trim(),
    status: "Baru",
    createdAt: new Date().toISOString()
  };
}

function saveLocalComplaint(complaint: Complaint) {
  writeLocalComplaints([complaint, ...readLocalComplaints()]);
}

function toFirestoreComplaint(complaint: Complaint): Omit<Complaint, "id"> {
  return {
    reporterName: complaint.reporterName,
    category: complaint.category,
    message: complaint.message,
    status: complaint.status,
    createdAt: complaint.createdAt
  };
}

export async function submitComplaint(input: ComplaintInput): Promise<Complaint> {
  const complaint = createComplaintDraft(input);

  if (shouldUseLocalFallback()) {
    saveLocalComplaint(complaint);
    return complaint;
  }

  try {
    const id = await createDocument<Omit<Complaint, "id">>(
      "complaints",
      toFirestoreComplaint(complaint)
    );
    return {
      ...complaint,
      id
    };
  } catch {
    saveLocalComplaint(complaint);
    return complaint;
  }
}

export async function listComplaints(): Promise<Complaint[]> {
  if (shouldUseLocalFallback()) {
    return listLocalComplaints();
  }

  try {
    return await listDocuments<Complaint>("complaints");
  } catch {
    return listLocalComplaints();
  }
}

export function subscribeComplaints(onChange: (complaints: Complaint[]) => void): () => void {
  if (shouldUseLocalFallback()) {
    onChange(listLocalComplaints());
    return () => undefined;
  }

  try {
    return subscribeDocuments<Complaint>(
      "complaints",
      onChange,
      () => onChange(listLocalComplaints())
    );
  } catch {
    onChange(listLocalComplaints());
    return () => undefined;
  }
}

export async function updateComplaintStatus(
  complaint: Complaint,
  status: Complaint["status"]
): Promise<Complaint> {
  const updated = {
    ...complaint,
    status
  };

  if (shouldUseLocalFallback()) {
    writeLocalComplaints(
      readLocalComplaints().map((item) => (item.id === complaint.id ? updated : item))
    );
    return updated;
  }

  try {
    await updateDocument<Pick<Complaint, "status">>("complaints", complaint.id, { status });
    return updated;
  } catch {
    writeLocalComplaints(
      readLocalComplaints().map((item) => (item.id === complaint.id ? updated : item))
    );
    return updated;
  }
}
