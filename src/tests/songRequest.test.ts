import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSongRequestDraft,
  listLocalSongRequests,
  saveSongRequest,
  submitSongRequest,
  updateSongRequestStatus
} from "../services/songRequest.service";

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

describe("song request service", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("window", { localStorage: storage });
  });

  it("builds WhatsApp notification text for the active announcer", () => {
    const request = createSongRequestDraft({
      requesterName: "Andi",
      requesterWhatsapp: "085122561992",
      artist: "Rossa",
      title: "Firefly",
      message: "Untuk teman studio",
      programTitle: "Selamat Pagi Pinrang",
      announcer: {
        fullName: "Salmiah",
        airName: "Miah",
        scheduleNames: ["Miah"],
        photoUrl: "/crew/Miah.png",
        whatsapp: "081234567890",
        decreeOrder: 7,
        active: true
      }
    });

    expect(request).toMatchObject({
      requesterName: "Andi",
      artist: "Rossa",
      title: "Firefly",
      announcerName: "Miah",
      announcerWhatsapp: "081234567890",
      status: "notified"
    });
    expect(request.notificationText).toContain("Lagu: Rossa - Firefly");
    expect(request.whatsappUrl).toContain("https://wa.me/6281234567890");
  });

  it("stores local queue for in-app notifications", () => {
    saveSongRequest({
      requesterName: "Pendengar",
      title: "Indonesia Pusaka",
      programTitle: "Musik Pilihan"
    });

    expect(listLocalSongRequests()).toHaveLength(1);
  });

  it("submits through local fallback in test mode", async () => {
    await submitSongRequest({
      requesterName: "Pendengar",
      title: "Tanah Airku",
      programTitle: "Musik Pilihan"
    });

    expect(listLocalSongRequests()[0].title).toBe("Tanah Airku");
  });

  it("updates local request status", async () => {
    const request = saveSongRequest({
      requesterName: "Pendengar",
      title: "Bersama Kita Bisa",
      programTitle: "Musik Pilihan"
    });

    const updated = await updateSongRequestStatus(request, "queued");

    expect(updated.status).toBe("queued");
    expect(listLocalSongRequests()[0].status).toBe("queued");
  });
});
