import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitSongRequestV2, updateSongRequestStatus, subscribeSongRequestsV2 } from "../features/engagement/services/requestSongStatus.service";
import type { SongRequestV2 } from "../features/engagement/services/requestSongStatus.service";
import { submitDedication, updateDedicationStatus, subscribeApprovedDedications } from "../features/engagement/services/dedication.service";
import type { DedicationItem } from "../features/engagement/services/dedication.service";
import { createPoll, closePoll, submitVote, checkHasVoted, subscribeActivePolls } from "../features/engagement/services/poll.service";
import type { PollItem } from "../features/engagement/services/poll.service";

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

describe("Layanan Engagement Pendengar V2", () => {
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

  describe("Request Lagu V2 Service", () => {
    it("dapat mengirim request lagu baru dengan status 'submitted'", async () => {
      const req = await submitSongRequestV2({
        senderName: "Budi",
        songTitle: "Laskar Pelangi",
        artistName: "Nidji",
        message: "Semangat pagi!"
      });

      expect(req).toMatchObject({
        songTitle: "Laskar Pelangi",
        artistName: "Nidji",
        status: "submitted"
      });
      expect(req.requestId).toBeDefined();
    });

    it("dapat mengubah status request lagu", async () => {
      const req = await submitSongRequestV2({
        songTitle: "Sempurna",
        artistName: "Andra & The Backbone"
      });

      await updateSongRequestStatus(req.requestId, "queued", "Diputar segera", "Operator A");

      let updatedReqs: SongRequestV2[] = [];
      subscribeSongRequestsV2((reqs) => {
        updatedReqs = reqs;
      });

      const updated = updatedReqs.find(r => r.requestId === req.requestId);
      if (!updated) {
        throw new Error("Request lagu tidak ditemukan setelah update status.");
      }
      expect(updated.status).toBe("queued");
      expect(updated.statusNote).toBe("Diputar segera");
      expect(updated.handledBy).toBe("Operator A");
    });
  });

  describe("Dedication / Salam Udara Service", () => {
    it("dapat mengirim salam udara", async () => {
      const dedication = await submitDedication({
        senderName: "Andi",
        recipientName: "Budi",
        message: "Selamat pagi kawan",
        isAnonymous: false
      });

      expect(dedication).toMatchObject({
        senderName: "Andi",
        recipientName: "Budi",
        message: "Selamat pagi kawan",
        status: "submitted",
        isAnonymous: false
      });
    });

    it("dapat menyetujui salam udara dan memfilternya untuk tampilan publik", async () => {
      const d1 = await submitDedication({
        senderName: "Andi",
        message: "Pesan disetujui",
        isAnonymous: false
      });

      const d2 = await submitDedication({
        senderName: "Rudi",
        message: "Pesan ditolak",
        isAnonymous: false
      });

      await updateDedicationStatus(d1.dedicationId, "approved", undefined, "Operator");
      await updateDedicationStatus(d2.dedicationId, "rejected", undefined, "Operator");

      let approved: DedicationItem[] = [];
      subscribeApprovedDedications((items) => {
        approved = items;
      });

      expect(approved.some(item => item.dedicationId === d1.dedicationId)).toBe(true);
      expect(approved.some(item => item.dedicationId === d2.dedicationId)).toBe(false);
    });
  });

  describe("Polling Service", () => {
    it("dapat membuat polling baru dan mencatat vote", async () => {
      const poll = await createPoll("Lagu favorit pagi ini?", ["Lagu A", "Lagu B"], "Operator");

      expect(poll).toMatchObject({
        title: "Lagu favorit pagi ini?",
        status: "active"
      });
      expect(poll.options).toHaveLength(2);

      const optionId = poll.options[0].id;
      const success = await submitVote(poll.pollId, optionId, "user-123");
      expect(success).toBe(true);

      const hasVoted = await checkHasVoted(poll.pollId, "user-123");
      expect(hasVoted).toBe(true);

      const doubleVote = await submitVote(poll.pollId, optionId, "user-123");
      expect(doubleVote).toBe(false);
    });

    it("dapat menutup polling", async () => {
      const poll = await createPoll("Siapa penyanyi favorit?", ["Penyanyi A", "Penyanyi B"], "Operator");
      await closePoll(poll.pollId);

      let activePolls: PollItem[] = [];
      subscribeActivePolls((pollsList) => {
        activePolls = pollsList;
      });

      const updated = activePolls.find(p => p.pollId === poll.pollId);
      if (!updated) {
        throw new Error("Polling tidak ditemukan setelah ditutup.");
      }
      expect(updated.status).toBe("closed");
      expect(updated.closedAt).toBeDefined();
    });
  });
});
