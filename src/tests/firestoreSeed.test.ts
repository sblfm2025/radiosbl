import { describe, expect, it } from "vitest";
import {
  buildAnnouncerSeed,
  buildAppSettingsSeed,
  buildFirestoreSeed,
  buildProgramSeed,
  buildScheduleSeed,
  buildStreamingSettingsSeed
} from "../data/firestoreSeed";

describe("firestore seed builder", () => {
  it("builds announcer documents from official profiles", () => {
    const announcers = buildAnnouncerSeed();

    expect(announcers).toHaveLength(7);
    expect(announcers.find((item) => item.id === "miah")).toMatchObject({
      fullName: "Salmiah",
      airName: "Miah",
      totalHours: 10
    });
  });

  it("builds unique program documents", () => {
    const programs = buildProgramSeed();
    const ids = new Set(programs.map((program) => program.id));

    expect(ids.size).toBe(programs.length);
    expect(programs.some((program) => program.id === "salam-subuh")).toBe(true);
    expect(programs.some((program) => program.id === "aga-kareba")).toBe(true);
  });

  it("builds schedule documents with announcer ids and external PICs", () => {
    const schedules = buildScheduleSeed();
    const sundayCreative = schedules.find((schedule) =>
      schedule.id.includes("pinrang-keren")
    );

    expect(schedules).toHaveLength(28);
    expect(sundayCreative).toMatchObject({
      announcerIds: ["amar", "riska"],
      externalPic: ["Tokoh", "Komunitas"]
    });
  });

  it("builds station settings documents", () => {
    expect(buildStreamingSettingsSeed()).toMatchObject({
      id: "main",
      frequency: "SBL 92,4 FM",
      streamUrl: "https://pu.klikhost.com/proxy/sbl/stream",
      publicStreamPage: "sbl.pinrangkab.go.id/radio-stream"
    });
    expect(buildAppSettingsSeed()).toMatchObject({
      id: "main",
      directorName: "Fajar Bakri",
      decreeNumber: "482/001/SBL/I/2026"
    });
  });

  it("builds the complete seed payload", () => {
    expect(Object.keys(buildFirestoreSeed())).toEqual([
      "announcers",
      "broadcastPrograms",
      "broadcastSchedules",
      "streamingSettings",
      "appSettings"
    ]);
  });
});
