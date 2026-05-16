import type { AttendanceRecord } from "../types/domain";
import type { CurrentBroadcastSlot } from "../utils/scheduleClock";
import type { AnnouncerProfile } from "../data/radioData";
import {
  findAnnouncerProfile,
  formatAnnouncerDisplay,
  resolveAnnouncerText
} from "../utils/announcerResolver";

function toDate(value: AttendanceRecord["checkInAt"]): Date {
  return value instanceof Date ? value : new Date(value);
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function attendanceNames(record: AttendanceRecord): string[] {
  return [record.airName, record.displayName, record.userId]
    .map(normalize)
    .filter(Boolean);
}

function isAnnouncerProfile(value: AnnouncerProfile | null): value is AnnouncerProfile {
  return Boolean(value);
}

export function resolveOnAirAnnouncerFromAttendance(
  slot: CurrentBroadcastSlot,
  records: AttendanceRecord[],
  now = new Date()
): string {
  if (slot.type !== "main") {
    return "";
  }

  const scheduledProfiles = resolveAnnouncerText(slot.announcer)
    .map((part) => (part.kind === "announcer" ? part.profile : findAnnouncerProfile(part.label)))
    .filter(isAnnouncerProfile);

  if (scheduledProfiles.length === 0) {
    return "";
  }

  const presentRecords = records.filter((record) => {
    const checkInAt = toDate(record.checkInAt);
    return (
      record.status === "present" &&
      isSameLocalDay(checkInAt, now) &&
      !record.checkOutAt
    );
  });

  const presentProfiles = scheduledProfiles.filter((profile) => {
    const profileNames = [profile.fullName, profile.airName, ...profile.scheduleNames].map(normalize);
    return presentRecords.some((record) =>
      attendanceNames(record).some((name) => profileNames.includes(name))
    );
  });

  return presentProfiles.map((profile) => formatAnnouncerDisplay(profile.airName)).join(" / ");
}
