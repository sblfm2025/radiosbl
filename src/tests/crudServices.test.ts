import { describe, expect, it } from "vitest";
import { listAnnouncers, saveAnnouncer } from "../services/announcer.service";
import {
  listPrograms,
  listSchedules,
  requestScheduleSwap,
  saveProgram,
  saveSchedule
} from "../services/schedule.service";

describe("official CRUD service fallbacks", () => {
  it("lists official announcers without Firebase env", async () => {
    const announcers = await listAnnouncers();

    expect(announcers).toHaveLength(7);
    expect(announcers.find((announcer) => announcer.id === "miah")).toMatchObject({
      fullName: "Salmiah",
      airName: "Miah"
    });
  });

  it("lists official programs and schedules without Firebase env", async () => {
    await expect(listPrograms()).resolves.toHaveLength(19);
    await expect(listSchedules()).resolves.toHaveLength(28);
  });

  it("returns deterministic ids for demo saves", async () => {
    const [announcer] = await listAnnouncers();
    const [program] = await listPrograms();
    const [schedule] = await listSchedules();

    await expect(saveAnnouncer(announcer)).resolves.toBe(announcer.id);
    await expect(saveProgram(program)).resolves.toBe(program.id);
    await expect(saveSchedule(schedule)).resolves.toBe(schedule.id);
    await expect(
      requestScheduleSwap({
        scheduleId: schedule.id,
        requesterId: "demo-user",
        targetAnnouncerId: "miah",
        reason: "Uji alur demo"
      })
    ).resolves.toBe("demo-schedule-swap-request");
  });
});
