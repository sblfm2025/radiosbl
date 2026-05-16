import type { AttendanceRecord } from "../types/domain";
import { createDocument, listDocuments, queryDocuments, subscribeDocuments } from "./firestore.service";
import { isWithinRadius, type GeoPoint } from "../utils/geolocation";
import { shouldUseLocalFallback } from "../lib/env";
import { moduleFileRules, validateFile, type UploadCandidate } from "../utils/fileValidation";
import { uploadAttendanceSelfie } from "./googleDrive.service";

const ATTENDANCE_CACHE_KEY = "radio-sbl-attendance-records";
const MAX_LOCAL_ATTENDANCE = 50;

export type AttendanceCheckInInput = {
  userId: string;
  displayName?: string;
  airName?: string;
  position: GeoPoint;
  officeCenter: GeoPoint;
  radiusMeters: number;
  selfieDriveFileId: string;
};

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalAttendanceRecords(): AttendanceRecord[] {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(ATTENDANCE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AttendanceRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAttendanceRecord(record: AttendanceRecord) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  const nextRecords = [
    record,
    ...readLocalAttendanceRecords().filter((item) => item.id !== record.id)
  ].slice(0, MAX_LOCAL_ATTENDANCE);
  storage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(nextRecords));
}

export function listLocalAttendanceRecords(): AttendanceRecord[] {
  return readLocalAttendanceRecords();
}

export type AttendanceSelfieCheckInInput = Omit<
  AttendanceCheckInInput,
  "selfieDriveFileId"
> & {
  selfieFile: UploadCandidate;
};

export function buildAttendanceRecordDraft(
  input: AttendanceCheckInInput
): Omit<AttendanceRecord, "id"> {
  const status = isWithinRadius(input.position, input.officeCenter, input.radiusMeters)
    ? "present"
    : "outside_radius";

  return {
    userId: input.userId,
    displayName: input.displayName,
    airName: input.airName,
    checkInAt: new Date().toISOString(),
    latitude: input.position.latitude,
    longitude: input.position.longitude,
    selfieDriveFileId: input.selfieDriveFileId,
    status
  };
}

export async function checkIn(input: AttendanceCheckInInput): Promise<string> {
  if (shouldUseLocalFallback()) {
    return `demo-attendance-${input.userId}`;
  }

  return createDocument<Omit<AttendanceRecord, "id">>(
    "attendanceRecords",
    buildAttendanceRecordDraft(input)
  );
}

export async function checkInWithSelfie(input: AttendanceSelfieCheckInInput): Promise<{
  attendanceRecordId: string;
  selfieDriveFileId: string;
}> {
  const validation = validateFile(input.selfieFile, moduleFileRules.attendance);

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const driveFile = await uploadAttendanceSelfie(input.selfieFile, input.userId);
  const checkInInput = {
    userId: input.userId,
    displayName: input.displayName,
    airName: input.airName,
    position: input.position,
    officeCenter: input.officeCenter,
    radiusMeters: input.radiusMeters,
    selfieDriveFileId: driveFile.driveFileId
  };
  const attendanceRecordId = await checkIn(checkInInput);
  writeLocalAttendanceRecord({
    id: attendanceRecordId,
    ...buildAttendanceRecordDraft(checkInInput)
  });

  return {
    attendanceRecordId,
    selfieDriveFileId: driveFile.driveFileId
  };
}

export function listAttendanceRecords(): Promise<AttendanceRecord[]> {
  if (shouldUseLocalFallback()) {
    return Promise.resolve(listLocalAttendanceRecords());
  }

  return listDocuments<AttendanceRecord>("attendanceRecords").catch(() =>
    listLocalAttendanceRecords()
  );
}

export function listMyAttendanceRecords(userId: string): Promise<AttendanceRecord[]> {
  if (shouldUseLocalFallback()) {
    return Promise.resolve(
      listLocalAttendanceRecords().filter((record) => record.userId === userId)
    );
  }

  return queryDocuments<AttendanceRecord>("attendanceRecords", "userId", "==", userId).catch(() =>
    listLocalAttendanceRecords().filter((record) => record.userId === userId)
  );
}

export function subscribeAttendanceRecords(
  onChange: (records: AttendanceRecord[]) => void
): () => void {
  if (shouldUseLocalFallback()) {
    onChange(listLocalAttendanceRecords());
    return () => undefined;
  }

  try {
    return subscribeDocuments<AttendanceRecord>(
      "attendanceRecords",
      onChange,
      () => onChange(listLocalAttendanceRecords())
    );
  } catch {
    onChange(listLocalAttendanceRecords());
    return () => undefined;
  }
}
