import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listLocalProgramScripts,
  saveProgramScript
} from "../services/programScript.service";

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

describe("program script service", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("window", { localStorage: storage });
  });

  it("saves editable AI script drafts locally in test mode", async () => {
    const draft = await saveProgramScript({
      programTitle: "Selamat Pagi Pinrang",
      scheduleTime: "08.00 - 10.00",
      day: "Senin",
      announcerName: "Miah",
      description: "Berita dan sapaan pagi",
      provider: "openai",
      tone: "hangat",
      durationMinutes: 3,
      intervention: "Sapa pendengar di pasar.",
      content: "Opening naskah siaran",
      status: "draft",
      createdBy: "demo-admin",
      createdByName: "Admin Radio SBL"
    });

    expect(draft.id).toContain("program-script-");
    expect(listLocalProgramScripts()).toHaveLength(1);
    expect(listLocalProgramScripts()[0].content).toBe("Opening naskah siaran");
  });

  it("rejects empty script content", async () => {
    await expect(
      saveProgramScript({
        programTitle: "Musik Pilihan",
        scheduleTime: "14.00 - 16.00",
        day: "Selasa",
        announcerName: "Wiwik",
        description: "Playlist",
        provider: "demo",
        tone: "santai",
        durationMinutes: 2,
        content: " ",
        status: "draft",
        createdBy: "demo-admin",
        createdByName: "Admin Radio SBL"
      })
    ).rejects.toThrow("Isi naskah tidak boleh kosong.");
  });
});
