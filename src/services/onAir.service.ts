import type { AppUser, AttendanceRecord } from "../types/domain";
import type { CurrentBroadcastSlot } from "../utils/scheduleClock";
import type { AnnouncerProfile } from "../data/radioData";
import {
  findAnnouncerProfile,
  formatAnnouncerDisplay,
  resolveAnnouncerText
} from "../utils/announcerResolver";

function toDate(value: AttendanceRecord["checkInAt"]): Date {
  if (value instanceof Date) return value;
  const timestampLike = value as unknown;
  if (
    timestampLike &&
    typeof timestampLike === "object" &&
    "toDate" in timestampLike &&
    typeof timestampLike.toDate === "function"
  ) {
    return timestampLike.toDate();
  }
  return new Date(value);
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

function normalizeCompact(value?: string): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function namesMatch(left: string, right: string): boolean {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;

  const compactLeft = normalizeCompact(left);
  const compactRight = normalizeCompact(right);
  if (!compactLeft || !compactRight) return false;
  if (compactLeft === compactRight) return true;

  const shorter = compactLeft.length <= compactRight.length ? compactLeft : compactRight;
  const longer = compactLeft.length > compactRight.length ? compactLeft : compactRight;
  return shorter.length >= 4 && longer.includes(shorter);
}

function digitsOnly(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

function localPhoneVariants(value?: string): string[] {
  const digits = digitsOnly(value);
  if (!digits) return [];

  const variants = new Set([digits]);
  if (digits.startsWith("62")) {
    variants.add(`0${digits.slice(2)}`);
  }
  if (digits.startsWith("0")) {
    variants.add(`62${digits.slice(1)}`);
  }

  return Array.from(variants);
}

function userNames(user?: AppUser): string[] {
  return [user?.airName, user?.displayName, ...(user?.announcerNames ?? [])]
    .map(normalize)
    .filter(Boolean);
}

function userPhones(user?: AppUser): string[] {
  return [...localPhoneVariants(user?.id), ...localPhoneVariants(user?.whatsapp)];
}

function userCandidatesForRecord(record: AttendanceRecord, users: AppUser[]): AppUser[] {
  const recordId = normalize(record.userId);
  const recordPhones = localPhoneVariants(record.userId);

  return users.filter((user) => {
    const idMatches = normalize(user.id) === recordId;
    const phoneMatches = userPhones(user).some((phone) => recordPhones.includes(phone));
    return idMatches || phoneMatches;
  });
}

function attendanceNames(record: AttendanceRecord, users: AppUser[]): string[] {
  const candidates = userCandidatesForRecord(record, users);
  return [record.airName, record.displayName, record.userId, ...candidates.flatMap(userNames)]
    .map(normalize)
    .filter(Boolean);
}

function attendancePhones(record: AttendanceRecord, users: AppUser[]): string[] {
  const candidates = userCandidatesForRecord(record, users);
  return [...localPhoneVariants(record.userId), ...candidates.flatMap(userPhones)];
}

function isAnnouncerProfile(value: AnnouncerProfile | null): value is AnnouncerProfile {
  return Boolean(value);
}

function isActiveAttendanceRecord(record: AttendanceRecord): boolean {
  return !record.status || !["rejected", "sick", "leave"].includes(record.status);
}

function getScheduledAnnouncerProfiles(slot: CurrentBroadcastSlot): AnnouncerProfile[] {
  if (slot.type !== "main") {
    return [];
  }

  return resolveAnnouncerText(slot.announcer)
    .map((part) => (part.kind === "announcer" ? part.profile : findAnnouncerProfile(part.label)))
    .filter(isAnnouncerProfile);
}

function getActiveAttendanceRecords(
  records: AttendanceRecord[],
  now: Date
): AttendanceRecord[] {
  return records.filter((record) => {
    const checkInAt = toDate(record.checkInAt);
    return (
      !Number.isNaN(checkInAt.getTime()) &&
      isActiveAttendanceRecord(record) &&
      isSameLocalDay(checkInAt, now) &&
      !record.checkOutAt
    );
  });
}

function recordMatchesProfile(
  record: AttendanceRecord,
  profile: AnnouncerProfile,
  users: AppUser[]
): boolean {
  const profileNames = [profile.fullName, profile.airName, ...profile.scheduleNames].map(normalize);
  const profilePhones = localPhoneVariants(profile.id);
  const recordNames = attendanceNames(record, users);
  const recordNameMatches = recordNames.some((recordName) =>
    profileNames.some((profileName) => namesMatch(recordName, profileName))
  );
  const recordPhones = attendancePhones(record, users);
  const phoneMatches = recordPhones.some((phone) => profilePhones.includes(phone));

  return recordNameMatches || phoneMatches;
}

export function resolveOnAirAttendanceRecords(
  slot: CurrentBroadcastSlot,
  records: AttendanceRecord[],
  now = new Date(),
  users: AppUser[] = []
): AttendanceRecord[] {
  const scheduledProfiles = getScheduledAnnouncerProfiles(slot);

  if (scheduledProfiles.length === 0) {
    return [];
  }

  const activeRecords = getActiveAttendanceRecords(records, now)
    .sort((left, right) => toDate(right.checkInAt).getTime() - toDate(left.checkInAt).getTime());
  const matchedRecords = new Map<string, AttendanceRecord>();

  scheduledProfiles.forEach((profile) => {
    const record = activeRecords.find((item) => recordMatchesProfile(item, profile, users));
    if (record) {
      matchedRecords.set(record.id, record);
    }
  });

  return Array.from(matchedRecords.values());
}

export function resolveOnAirAnnouncersFromAttendance(
  slot: CurrentBroadcastSlot,
  records: AttendanceRecord[],
  now = new Date(),
  users: AppUser[] = []
): string[] {
  const scheduledProfiles = getScheduledAnnouncerProfiles(slot);

  if (scheduledProfiles.length === 0) {
    return [];
  }

  const activeRecords = getActiveAttendanceRecords(records, now);

  const activeProfiles = scheduledProfiles.filter((profile) => {
    return activeRecords.some((record) => recordMatchesProfile(record, profile, users));
  });

  return activeProfiles.map((profile) => formatAnnouncerDisplay(profile.airName));
}

export function resolveOnAirAnnouncerFromAttendance(
  slot: CurrentBroadcastSlot,
  records: AttendanceRecord[],
  now = new Date(),
  users: AppUser[] = []
): string {
  return resolveOnAirAnnouncersFromAttendance(slot, records, now, users).join(" / ");
}
