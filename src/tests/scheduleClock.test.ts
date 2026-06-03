import { describe, expect, it } from "vitest";
import {
  findCurrentBroadcastSlot,
  getIndonesianDay,
  parseTimeRangeMinutes
} from "../utils/scheduleClock";

describe("schedule clock", () => {
  it("parses dot-separated broadcast time ranges", () => {
    expect(parseTimeRangeMinutes("08.00 - 10.00")).toEqual({
      start: 480,
      end: 600
    });
  });

  it("returns Indonesian day labels", () => {
    expect(getIndonesianDay(new Date("2026-01-02T09:00:00+08:00"))).toBe("Jumat");
  });

  it("finds a main program slot", () => {
    expect(findCurrentBroadcastSlot(new Date("2026-01-02T16:30:00+08:00"))).toMatchObject({
      type: "main",
      title: "Jumat Ceria (Program Edukasi)",
      announcer: "Miah / Dikbud, Dispusip, Sahabat KITA"
    });
  });

  it("finds an insert program slot", () => {
    expect(findCurrentBroadcastSlot(new Date("2026-01-02T11:00:00+08:00"))).toMatchObject({
      type: "insert",
      title: "Lasinrang Preneur"
    });
  });

  it("returns automatic playlist outside scheduled program hours", () => {
    expect(findCurrentBroadcastSlot(new Date("2026-01-02T02:00:00+08:00"))).toMatchObject({
      type: "offair",
      label: "Di Luar Jadwal Program",
      title: "Playlist Otomatis Radio SBL"
    });
  });
});
