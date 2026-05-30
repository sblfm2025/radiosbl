import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleFavoriteProgram, checkIsFavorite } from "../features/listening/services/programFavorite.service";

// Mock localStorage globally for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });

vi.mock("../contexts/useGlobalAudio", () => ({
  useGlobalAudio: () => ({
    playing: true,
    togglePlayback: vi.fn(),
    setPlayerStatus: vi.fn()
  })
}));

describe("Listening Experience - Favorite Program Service", () => {
  const userId = "test-user-123";
  const programId = "selamat-pagi-pinrang";
  const programTitle = "Selamat Pagi Pinrang";

  beforeEach(() => {
    localStorage.clear();
  });

  it("should toggle favorite status from false to true", async () => {
    const initialFav = await checkIsFavorite(userId, programId);
    expect(initialFav).toBe(false);

    const added = await toggleFavoriteProgram(userId, programId, programTitle);
    expect(added).toBe(true);

    const afterFav = await checkIsFavorite(userId, programId);
    expect(afterFav).toBe(true);
  });

  it("should toggle favorite status from true to false", async () => {
    await toggleFavoriteProgram(userId, programId, programTitle);
    const initialFav = await checkIsFavorite(userId, programId);
    expect(initialFav).toBe(true);

    const added = await toggleFavoriteProgram(userId, programId, programTitle);
    expect(added).toBe(false);

    const afterFav = await checkIsFavorite(userId, programId);
    expect(afterFav).toBe(false);
  });
});
