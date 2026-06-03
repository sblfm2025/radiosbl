import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitRundown, updateRundown, listRundownsByDate, savePreBroadcastChecklist, getPreBroadcastChecklist } from "../features/broadcastWorkflow/services/rundown.service";
import { submitBroadcastLog, listBroadcastLogs } from "../features/broadcastWorkflow/services/broadcastLog.service";
import { createHandover, acknowledgeHandover, listHandovers } from "../features/broadcastWorkflow/services/handover.service";

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

describe("Broadcast Workflow Services", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: storage,
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    });
    vi.stubGlobal("localStorage", storage);
  });

  describe("Rundown Service", () => {
    it("dapat menyimpan rundown siaran baru", async () => {
      const rundown = await submitRundown({
        programId: "selamat-pagi-pinrang",
        programTitle: "Selamat Pagi Pinrang",
        date: "2026-05-31",
        startTime: "08:00",
        endTime: "10:00",
        hostIds: ["host-1"],
        status: "draft",
        segments: [
          {
            id: "seg-1",
            order: 1,
            title: "Opening",
            type: "opening",
            plannedDurationMinutes: 5,
            notes: "Sapa"
          }
        ],
        createdBy: "Penyiar"
      });

      expect(rundown).toMatchObject({
        programTitle: "Selamat Pagi Pinrang",
        date: "2026-05-31",
        status: "draft"
      });
      expect(rundown.id).toBeDefined();

      const list = await listRundownsByDate("2026-05-31");
      expect(list.length).toBe(1);
    });

    it("dapat memperbarui rundown siaran", async () => {
      const r = await submitRundown({
        programId: "siang-ceria",
        programTitle: "Siang Ceria",
        date: "2026-05-31",
        startTime: "12:00",
        endTime: "14:00",
        hostIds: ["host-2"],
        status: "draft",
        segments: [],
        createdBy: "Penyiar"
      });

      await updateRundown(r.id, { status: "ready" });
      const list = await listRundownsByDate("2026-05-31");
      const matched = list.find((item) => item.id === r.id);
      expect(matched?.status).toBe("ready");
    });
  });

  describe("Pre-broadcast Checklist", () => {
    it("dapat menyimpan dan mengambil checklist kesiapan", async () => {
      const checklist = await savePreBroadcastChecklist({
        programId: "aga-kareba",
        programTitle: "Aga Kareba",
        date: "2026-05-31",
        items: [
          { id: "item-1", label: "Mic ready", checked: true, checkedBy: "Operator" }
        ],
        status: "draft"
      });

      expect(checklist.status).toBe("draft");

      const match = await getPreBroadcastChecklist("aga-kareba", "2026-05-31");
      expect(match).not.toBeNull();
      expect(match?.items[0]?.checked).toBe(true);
    });
  });

  describe("Broadcast Log Service", () => {
    it("dapat menyimpan log siaran baru dan mengambil riwayatnya", async () => {
      const log = await submitBroadcastLog({
        programId: "sore-ceria",
        programTitle: "Sore Ceria",
        date: "2026-05-31",
        actualStartTime: "16:00",
        actualEndTime: "18:00",
        hostIds: ["host-1"],
        topics: ["Musik Klasik", "Interaksi Pendengar"],
        status: "submitted",
        createdBy: "Operator"
      });

      expect(log.programTitle).toBe("Sore Ceria");
      
      const list = await listBroadcastLogs();
      expect(list.some(item => item.id === log.id)).toBe(true);
    });
  });

  describe("Shift Handover Service", () => {
    it("dapat membuat handover dan melakukan konfirmasi serah terima shift", async () => {
      const handover = await createHandover({
        date: "2026-05-31",
        fromUserId: "user-1",
        fromUserName: "Penyiar Pagi",
        shiftLabel: "Pagi",
        notes: "Semua aman, internet stasiun lancar.",
        priority: "normal",
        status: "open"
      });

      expect(handover.status).toBe("open");

      await acknowledgeHandover(handover.id, "user-2", "Penyiar Sore");

      const list = await listHandovers();
      const updated = list.find(h => h.id === handover.id);
      expect(updated?.status).toBe("acknowledged");
      expect(updated?.acknowledgedByName).toBe("Penyiar Sore");
    });
  });
});
