import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitEpisode, updateEpisode, subscribeActiveEpisodes } from "../features/contentHub/services/episode.service";
import type { ProgramEpisode } from "../features/contentHub/services/episode.service";
import { submitVideoItem, updateVideoItem, subscribeActiveVideoItems } from "../features/contentHub/services/videoHub.service";
import type { VideoItem } from "../features/contentHub/services/videoHub.service";
import { useEpisodeProgress } from "../features/contentHub/hooks/useEpisodeProgress";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn
  };
});

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

describe("Content Hub (Podcast & Video Hub) Services & Hooks", () => {
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

  describe("Episode / Podcast Service", () => {
    it("dapat menyimpan episode baru dengan status draft", async () => {
      const ep = await submitEpisode({
        title: "Bincang Sore Pinrang",
        programId: "bincang-sore",
        programTitle: "Bincang Sore",
        description: "Obrolan santai",
        audioUrl: "https://example.com/audio.mp3",
        tags: ["bincang", "lokal"],
        status: "draft",
        createdBy: "Admin"
      });

      expect(ep).toMatchObject({
        title: "Bincang Sore Pinrang",
        status: "draft",
        programTitle: "Bincang Sore"
      });
      expect(ep.episodeId).toBeDefined();
      expect(ep.slug).toBe("bincang-sore-pinrang");
    });

    it("dapat memperbarui status episode podcast", async () => {
      const ep = await submitEpisode({
        title: "Bincang Religi",
        programId: "religi",
        programTitle: "Program Religi",
        audioUrl: "https://example.com/religi.mp3",
        tags: ["religi"],
        status: "draft",
        createdBy: "Admin"
      });

      await updateEpisode(ep.episodeId, { status: "published" });

      let list: ProgramEpisode[] = [];
      subscribeActiveEpisodes((items) => {
        list = items;
      });

      expect(list.some(item => item.episodeId === ep.episodeId)).toBe(true);
    });
  });

  describe("Video Hub Service", () => {
    it("dapat menyimpan item video baru", async () => {
      const vid = await submitVideoItem({
        title: "Dokumentasi Festival Budaya",
        description: "Liputan festival",
        source: "youtube",
        embedUrl: "https://www.youtube.com/embed/12345",
        tags: ["event", "budaya"],
        status: "published"
      });

      expect(vid).toMatchObject({
        title: "Dokumentasi Festival Budaya",
        source: "youtube",
        status: "published"
      });
      expect(vid.videoId).toBeDefined();
    });

    it("dapat mengedit detail video", async () => {
      const vid = await submitVideoItem({
        title: "Siaran Tunda Rapat",
        source: "external",
        embedUrl: "https://example.com/embed/rapat",
        tags: ["rapat"],
        status: "draft"
      });

      await updateVideoItem(vid.videoId, { title: "Siaran Rapat Pleno", status: "published" });

      let list: VideoItem[] = [];
      subscribeActiveVideoItems((items) => {
        list = items;
      });

      const updated = list.find(v => v.videoId === vid.videoId);
      expect(updated?.title).toBe("Siaran Rapat Pleno");
    });
  });

  describe("Episode Playback Progress Hook", () => {
    it("dapat menyimpan dan memulihkan progres pemutaran", () => {
      const { getProgress, saveProgress } = useEpisodeProgress();

      saveProgress("episode-1", 120, 600); // 20%
      const prog = getProgress("episode-1");

      expect(prog).not.toBeNull();
      expect(prog?.currentTime).toBe(120);
      expect(prog?.duration).toBe(600);
    });

    it("akan menghapus progres secara otomatis jika sudah selesai (> 95%)", () => {
      const { getProgress, saveProgress } = useEpisodeProgress();

      // Simpan progres di 96%
      saveProgress("episode-2", 580, 600);
      const prog = getProgress("episode-2");

      expect(prog).toBeNull();
    });
  });
});
