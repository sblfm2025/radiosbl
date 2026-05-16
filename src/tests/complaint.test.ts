import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createComplaintDraft,
  listLocalComplaints,
  submitComplaint,
  updateComplaintStatus
} from "../services/complaint.service";

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    }
  };
}

describe("complaint service", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("window", { localStorage: storage });
  });

  it("creates new complaint drafts with Baru status", () => {
    expect(
      createComplaintDraft({
        reporterName: "Andi",
        category: "Program",
        message: "Tambahkan program budaya."
      })
    ).toMatchObject({
      reporterName: "Andi",
      category: "Program",
      message: "Tambahkan program budaya.",
      status: "Baru"
    });
  });

  it("submits and updates complaints through local fallback", async () => {
    const complaint = await submitComplaint({
      reporterName: "Publik",
      category: "Teknis",
      message: "Streaming putus."
    });

    expect(listLocalComplaints()).toHaveLength(1);

    const updated = await updateComplaintStatus(complaint, "Diproses");

    expect(updated.status).toBe("Diproses");
    expect(listLocalComplaints()[0].status).toBe("Diproses");
  });
});
