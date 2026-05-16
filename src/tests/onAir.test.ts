import { describe, expect, it } from "vitest";
import { resolveOnAirAnnouncerFromAttendance } from "../services/onAir.service";
import type { AttendanceRecord } from "../types/domain";
import type { CurrentBroadcastSlot } from "../utils/scheduleClock";

const slot: CurrentBroadcastSlot = {
  type: "main",
  label: "Program Utama",
  day: "Senin",
  time: "08.00 - 10.00",
  title: "Salam Bumi Lasinrang",
  description: "Program pagi",
  announcer: "Miah"
};

describe("on air announcer resolver", () => {
  it("shows scheduled announcer only when matching attendance exists", () => {
    const records: AttendanceRecord[] = [
      {
        id: "attendance-1",
        userId: "user-1",
        displayName: "Salmiah",
        airName: "Miah",
        checkInAt: "2026-05-15T01:00:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-1",
        status: "present"
      }
    ];

    expect(
      resolveOnAirAnnouncerFromAttendance(
        slot,
        records,
        new Date("2026-05-15T02:00:00.000Z")
      )
    ).toBe("Miah (Salmiah)");
  });

  it("hides announcer when the scheduled person has not checked in", () => {
    expect(resolveOnAirAnnouncerFromAttendance(slot, [], new Date("2026-05-15T02:00:00.000Z"))).toBe("");
  });
});
