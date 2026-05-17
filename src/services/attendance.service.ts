import type { AttendanceRecord } from "../types/domain";
import { createDocument, listDocuments, queryDocuments, subscribeDocuments, updateDocument } from "./firestore.service";
import { isWithinRadius, distanceInMeters, type GeoPoint } from "../utils/geolocation";
import { shouldUseLocalFallback } from "../lib/env";
import { moduleFileRules, validateFile, type UploadCandidate } from "../utils/fileValidation";
import { uploadAttendanceSelfieToStorage } from "./storage.service";

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
  aiVerificationText?: string;
  isAiValid?: boolean;
  clientTime?: string;
  userAgent?: string;
  outOfOfficeReason?: string;
  attendanceType?: "present" | "sick" | "leave" | "out_of_office";
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
  const isInsideOfficeRadius = isWithinRadius(input.position, input.officeCenter, input.radiusMeters);
  const distanceToCenter = Math.round(distanceInMeters(input.position, input.officeCenter));
  const accuracyMeters = Math.round(input.position.accuracy || 9999);
  
  let score = 0;

  // 1. Lokasi (Maks 40)
  if (distanceToCenter <= input.radiusMeters) {
    score += 40;
  } else if (distanceToCenter <= input.radiusMeters + 150) {
    score += 20;
  }

  // 2. Akurasi (Maks 20)
  if (accuracyMeters < 30) score += 20;
  else if (accuracyMeters <= 100) score += 10;

  // 3. AI (Maks 25)
  if (input.isAiValid) score += 25;
  else if (input.aiVerificationText) score += 10;

  // 4. Perangkat (Maks 15)
  if (input.clientTime) {
    const diff = Math.abs(new Date(input.clientTime).getTime() - Date.now());
    if (diff < 120_000) score += 5;
  }
  if (input.userAgent) score += 10;

  let status: AttendanceRecord["status"] = isInsideOfficeRadius ? "present" : "outside_radius";

  if (input.attendanceType === "sick") {
    status = "sick";
  } else if (input.attendanceType === "leave") {
    status = "leave";
  } else if (input.isAiValid === false) {
    status = "rejected";
  } else if (input.outOfOfficeReason && status === "outside_radius") {
    status = "needs_review";
  }

  return {
    userId: input.userId,
    displayName: input.displayName || "",
    airName: input.airName || "",
    checkInAt: new Date().toISOString(),
    clientTime: input.clientTime || "",
    latitude: input.position.latitude,
    longitude: input.position.longitude,
    accuracyMeters,
    distanceToCenter,
    userAgent: input.userAgent || "",
    confidenceScore: score,
    aiVerificationText: input.aiVerificationText || "",
    outOfOfficeReason: input.outOfOfficeReason || "",
    selfieDriveFileId: input.selfieDriveFileId || "",
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

  const checkInInput: AttendanceCheckInInput = {
    userId: input.userId,
    displayName: input.displayName,
    airName: input.airName,
    position: input.position,
    officeCenter: input.officeCenter,
    radiusMeters: input.radiusMeters,
    selfieDriveFileId: "uploading...",
    aiVerificationText: input.aiVerificationText,
    isAiValid: input.isAiValid,
    clientTime: input.clientTime,
    userAgent: input.userAgent,
    outOfOfficeReason: input.outOfOfficeReason,
    attendanceType: input.attendanceType
  };
  
  const attendanceRecordId = await checkIn(checkInInput);
  
  writeLocalAttendanceRecord({
    id: attendanceRecordId,
    ...buildAttendanceRecordDraft(checkInInput)
  });

  // Eksekusi upload di background agar tidak memblokir loading UI
  uploadAttendanceSelfieToStorage(input.selfieFile, input.userId)
    .then((driveFile) => {
      if (!shouldUseLocalFallback()) {
        updateDocument("attendanceRecords", attendanceRecordId, { selfieDriveFileId: driveFile.driveFileId }).catch(() => {});
      }
    })
    .catch((err) => {
      console.error("Background upload gagal:", err);
      if (!shouldUseLocalFallback()) {
        updateDocument("attendanceRecords", attendanceRecordId, { selfieDriveFileId: "gagal_upload" }).catch(() => {});
      }
    });

  return {
    attendanceRecordId,
    selfieDriveFileId: "uploading..."
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

export async function updateAttendanceStatus(
  recordId: string,
  newStatus: AttendanceRecord["status"]
): Promise<void> {
  if (shouldUseLocalFallback()) {
    const records = readLocalAttendanceRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index !== -1) {
      records[index].status = newStatus;
      getSafeLocalStorage()?.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(records));
    }
    return Promise.resolve();
  }

  return updateDocument("attendanceRecords", recordId, { status: newStatus });
}

export async function getTodayAttendance(userId: string): Promise<AttendanceRecord | null> {
  const records = await listMyAttendanceRecords(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cari absen hari ini
  const todayRecord = records.find(r => {
    const checkInDate = new Date(r.checkInAt as string | number | Date);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === today.getTime();
  });

  return todayRecord || null;
}

export async function checkOut(recordId: string): Promise<void> {
  if (shouldUseLocalFallback()) {
    const records = readLocalAttendanceRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index !== -1) {
      records[index].checkOutAt = new Date().toISOString();
      getSafeLocalStorage()?.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(records));
    }
    return Promise.resolve();
  }

  return updateDocument("attendanceRecords", recordId, { checkOutAt: new Date().toISOString() });
}
