import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLiveEventDraft,
  createLiveEventFromDraft,
  listLocalLiveEvents
} from "../services/liveOb.service";

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

describe("live OB service", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("window", { localStorage: storage });
  });

  it("builds ready live event drafts", () => {
    expect(
      buildLiveEventDraft({
        title: "Live Pasar Murah",
        location: "Lapangan Lasinrang",
        startsAt: "2026-05-15T10:00:00.000Z",
        discordRoomUrl: "https://discord.gg/sbl",
        youtubeUrl: ""
      })
    ).toMatchObject({
      title: "Live Pasar Murah",
      location: "Lapangan Lasinrang",
      discordRoomUrl: "https://discord.gg/sbl",
      status: "ready"
    });
  });

  it("stores live events in local fallback", async () => {
    await createLiveEventFromDraft({
      title: "Live Talkshow Pendidikan",
      location: "Studio SBL",
      startsAt: "2026-05-15T12:00:00.000Z",
      discordRoomUrl: "https://discord.gg/sbl",
      youtubeUrl: "https://youtube.com/live/test"
    });

    expect(listLocalLiveEvents()).toHaveLength(1);
    expect(listLocalLiveEvents()[0].status).toBe("ready");
  });
});
