import { describe, expect, it } from "vitest";
import {
  resolveOnAirAttendanceRecords,
  resolveOnAirAnnouncerFromAttendance,
  resolveOnAirAnnouncersFromAttendance
} from "../services/onAir.service";
import type { AppUser, AttendanceRecord } from "../types/domain";
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
  it("shows scheduled announcer when matching attendance exists", () => {
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
    ).toBe("Miah Jufri");
  });

  it("hides announcer when the scheduled person has not checked in", () => {
    expect(resolveOnAirAnnouncerFromAttendance(slot, [], new Date("2026-05-15T02:00:00.000Z"))).toBe("");
  });

  it("returns every checked-in announcer for multi-announcer programs", () => {
    const multiSlot: CurrentBroadcastSlot = {
      ...slot,
      announcer: "Miah / Amar"
    };
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
      },
      {
        id: "attendance-2",
        userId: "user-2",
        displayName: "Akhmad Amiruddin",
        airName: "Amar",
        checkInAt: "2026-05-15T01:05:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-2",
        status: "needs_review"
      }
    ];

    expect(resolveOnAirAnnouncersFromAttendance(multiSlot, records, new Date("2026-05-15T02:00:00.000Z"))).toEqual([
      "Miah Jufri",
      "Amar"
    ]);
    expect(resolveOnAirAnnouncerFromAttendance(multiSlot, records, new Date("2026-05-15T02:00:00.000Z"))).toBe(
      "Miah Jufri / Amar"
    );
  });

  it("matches older attendance records by WhatsApp user id when airName is missing", () => {
    const records: AttendanceRecord[] = [
      {
        id: "attendance-1",
        userId: "08114441006",
        displayName: "Pengguna Radio SBL",
        checkInAt: "2026-05-15T01:00:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-1",
        status: "present"
      }
    ];

    expect(resolveOnAirAnnouncerFromAttendance(slot, records, new Date("2026-05-15T02:00:00.000Z"))).toBe(
      "Miah Jufri"
    );
  });

  it("matches attendance Firebase uid through registered user profile", () => {
    const users: AppUser[] = [
      {
        id: "firebase-uid-amar",
        email: "amar@example.com",
        displayName: "Akhmad Amiruddin",
        role: "announcer",
        airName: "Amar",
        announcerNames: ["Amar"],
        whatsapp: "085397286112",
        active: true
      }
    ];
    const records: AttendanceRecord[] = [
      {
        id: "attendance-1",
        userId: "firebase-uid-amar",
        displayName: "Akun Login Radio",
        checkInAt: "2026-05-15T01:00:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-1",
        status: "present"
      }
    ];
    const amarSlot: CurrentBroadcastSlot = {
      ...slot,
      announcer: "Amar"
    };

    expect(resolveOnAirAnnouncerFromAttendance(amarSlot, records, new Date("2026-05-15T02:00:00.000Z"), users)).toBe(
      "Amar"
    );
  });

  it("matches active announcers when attendance names contain schedule air names", () => {
    const multiSlot: CurrentBroadcastSlot = {
      ...slot,
      announcer: "Amar & Riska / Tokoh / Komunitas"
    };
    const records: AttendanceRecord[] = [
      {
        id: "attendance-1",
        userId: "firebase-uid-amar",
        displayName: "Akhmad Amiruddin",
        checkInAt: "2026-05-15T01:00:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-1",
        status: "present"
      },
      {
        id: "attendance-2",
        userId: "firebase-uid-riska",
        displayName: "Riska Dwi Ayanti",
        checkInAt: "2026-05-15T01:05:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-2",
        status: "present"
      }
    ];

    expect(resolveOnAirAnnouncersFromAttendance(multiSlot, records, new Date("2026-05-15T02:00:00.000Z"))).toEqual([
      "Amar",
      "Riska"
    ]);
  });

  it("returns attendance records for the active scheduled announcer, not the logged-in operator", () => {
    const riskaSlot: CurrentBroadcastSlot = {
      ...slot,
      title: "Halo Bumi Lasinrang",
      announcer: "Riska"
    };
    const records: AttendanceRecord[] = [
      {
        id: "attendance-admin",
        userId: "admin-1",
        displayName: "Operator Studio",
        checkInAt: "2026-05-15T00:30:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-admin",
        status: "present"
      },
      {
        id: "attendance-riska",
        userId: "firebase-uid-riska",
        displayName: "Riska Dwi Ayanti",
        airName: "Riska",
        checkInAt: "2026-05-15T01:05:00.000Z",
        latitude: -3.7931,
        longitude: 119.6522,
        selfieDriveFileId: "drive-riska",
        status: "present"
      }
    ];

    expect(resolveOnAirAttendanceRecords(riskaSlot, records, new Date("2026-05-15T02:00:00.000Z"))).toEqual([
      records[1]
    ]);
  });
});
