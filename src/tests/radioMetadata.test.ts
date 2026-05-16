import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  cleanTrackMetadata,
  fetchRadioMetadata,
  parseTrackMetadata
} from "../services/radioMetadata.service";

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

describe("radio metadata", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage });
  });

  it("cleans noisy downloader/domain metadata", () => {
    expect(cleanTrackMetadata("Rossa - PlanetLagu.com - Firefly Official Video HD")).toBe(
      "Rossa - Firefly"
    );
  });

  it("parses artist and title with fallback", () => {
    expect(parseTrackMetadata("Rossa - PlanetLagu.com - Firefly")).toEqual({
      artist: "Rossa",
      title: "Firefly"
    });
    expect(parseTrackMetadata("")).toEqual({
      artist: "SBL RADIO",
      title: "Live Streaming"
    });
  });

  it("fetches Icecast metadata and stores recent tracks", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("status-json")) {
        return Response.json({
          icestats: {
            source: {
              title: "Rossa - PlanetLagu.com - Firefly Official Audio HQ",
              listeners: 3
            }
          }
        });
      }

      return Response.json({ results: [{ artworkUrl100: "https://art.test/100x100bb.jpg" }] });
    });
    vi.stubGlobal("fetch", fetchMock);

    const metadata = await fetchRadioMetadata("https://example.test/status-json.xsl");

    expect(metadata).toMatchObject({
      artist: "Rossa",
      title: "Firefly",
      isOnline: true,
      listeners: 3,
      albumArtUrl: "https://art.test/600x600bb.jpg"
    });
    expect(metadata.history).toHaveLength(1);
  });
});
