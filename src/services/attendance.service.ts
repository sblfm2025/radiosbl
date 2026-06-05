import type {
  AttendanceRecord,
  AttendanceSelfieUploadStatus,
  AttendanceStatus
} from "../types/domain";
import type { FaceRecognitionResult, FaceSpoofCheckResult } from "./faceRecognition.service";
import { createDocument, listDocuments, queryDocuments, subscribeDocuments, updateDocument } from "./firestore.service";
import { limit, orderBy } from "firebase/firestore";
import { isWithinRadius, distanceInMeters, type GeoPoint } from "../utils/geolocation";
import { shouldUseLocalFallback } from "../lib/env";
import { moduleFileRules, validateFile, type UploadCandidate } from "../utils/fileValidation";
import { uploadAttendanceSelfie } from "./googleDrive.service";

const ATTENDANCE_CACHE_KEY = "radio-sbl-attendance-records";
const ATTENDANCE_PENDING_SYNC_KEY = "radio-sbl-attendance-pending-sync";
const MAX_LOCAL_ATTENDANCE = 50;
const MAX_PENDING_ATTENDANCE = 20;
const ATTENDANCE_READ_LIMIT = 300;
const PENDING_SELFIE_UPLOAD_ID = "pending_upload";
export const ATTENDANCE_SELFIE_UPLOAD_EVENT = "radio-sbl-attendance-selfie-upload";

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
  selfieUploadStatus?: AttendanceSelfieUploadStatus;
  selfieUploadError?: string;
  faceRecognition?: FaceRecognitionResult;
  faceSpoofCheck?: FaceSpoofCheckResult;
};

export type AttendanceSelfieUploadEventDetail = {
  attendanceRecordId: string;
  selfieDriveFileId: string;
  selfieUploadStatus: AttendanceSelfieUploadStatus;
  selfieUploadError?: string;
};

export type ManualAttendanceInput = {
  userId: string;
  displayName?: string;
  airName?: string;
  checkInAt: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  outOfOfficeReason?: string;
  recordedBy?: string;
  recordedByName?: string;
};

type PendingSelfiePayload = {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
};

type PendingAttendanceSyncItem = {
  localId: string;
  record: AttendanceRecord;
  selfie?: PendingSelfiePayload;
  queuedAt: string;
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

function toAttendanceDate(value: AttendanceRecord["checkInAt"] | AttendanceRecord["checkOutAt"]): Date | null {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate();
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
  }

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function mergeAttendanceRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  return Array.from(new Map(records.map((record) => [record.id, record])).values());
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

function removeLocalAttendanceRecord(recordId: string) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  const nextRecords = readLocalAttendanceRecords().filter((record) => record.id !== recordId);
  storage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(nextRecords));
}

function updateLocalAttendanceRecord(recordId: string, patch: Partial<AttendanceRecord>) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  const nextRecords = readLocalAttendanceRecords().map((record) =>
    record.id === recordId ? { ...record, ...patch } : record
  );
  storage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(nextRecords));
}

function dispatchSelfieUploadEvent(detail: AttendanceSelfieUploadEventDetail) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ATTENDANCE_SELFIE_UPLOAD_EVENT, { detail }));
}

function isNetworkOrOfflineError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    error instanceof TypeError ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("unavailable")
  );
}

function isDemoDriveFileId(value: string): boolean {
  return value.startsWith("demo-attendance-");
}

function isStorageSelfieUrl(value: string): boolean {
  return /^https:\/\/firebasestorage\.googleapis\.com\//i.test(value);
}

function getSelfieArchiveLabel(value: string): string {
  return isStorageSelfieUrl(value) ? "Firebase Storage" : "Google Drive";
}

function readPendingAttendanceSyncItems(): PendingAttendanceSyncItem[] {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(ATTENDANCE_PENDING_SYNC_KEY);
    return raw ? (JSON.parse(raw) as PendingAttendanceSyncItem[]) : [];
  } catch {
    return [];
  }
}

function writePendingAttendanceSyncItems(items: PendingAttendanceSyncItem[]) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(ATTENDANCE_PENDING_SYNC_KEY, JSON.stringify(items.slice(0, MAX_PENDING_ATTENDANCE)));
}

function queuePendingAttendanceSync(item: PendingAttendanceSyncItem) {
  const nextItems = [
    item,
    ...readPendingAttendanceSyncItems().filter((pending) => pending.localId !== item.localId)
  ];
  writePendingAttendanceSyncItems(nextItems);
}

function removePendingAttendanceSyncItem(localId: string) {
  writePendingAttendanceSyncItems(
    readPendingAttendanceSyncItems().filter((pending) => pending.localId !== localId)
  );
}

function canAttemptOnlineSync(): boolean {
  return (
    !shouldUseLocalFallback() &&
    (typeof navigator === "undefined" || navigator.onLine !== false)
  );
}

function blobToDataUrl(file: UploadCandidate): Promise<string | undefined> {
  if (!(file instanceof Blob) || typeof FileReader === "undefined") {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

async function pendingSelfieToFile(selfie: PendingSelfiePayload): Promise<UploadCandidate & Blob> {
  const response = await fetch(selfie.dataUrl);
  const blob = await response.blob();

  if (typeof File !== "undefined") {
    return new File([blob], selfie.name, { type: selfie.type });
  }

  return Object.assign(blob, { name: selfie.name });
}

export function listLocalAttendanceRecords(): AttendanceRecord[] {
  return readLocalAttendanceRecords();
}

export async function createManualAttendanceRecord(input: ManualAttendanceInput): Promise<string> {
  const record: Omit<AttendanceRecord, "id"> = {
    userId: input.userId,
    displayName: input.displayName || "",
    airName: input.airName || "",
    checkInAt: input.checkInAt,
    clientTime: new Date().toISOString(),
    latitude: -3.8112091495447213,
    longitude: 119.65144231962896,
    accuracyMeters: 0,
    distanceToCenter: 0,
    userAgent: `Manual attendance entry${input.recordedByName ? ` by ${input.recordedByName}` : ""}`,
    confidenceScore: 100,
    aiVerificationText: "Input manual oleh admin.",
    outOfOfficeReason: input.outOfOfficeReason || "",
    selfieDriveFileId: "manual_entry",
    selfieUploadStatus: "uploaded",
    selfieUploadError: "",
    status: input.status
  };
  if (input.checkOutAt) {
    record.checkOutAt = input.checkOutAt;
  }

  if (shouldUseLocalFallback()) {
    const id = `manual-attendance-${input.userId}-${Date.now()}`;
    writeLocalAttendanceRecord({ id, ...record });
    return id;
  }

  return createDocument<Omit<AttendanceRecord, "id">>("attendanceRecords", record);
}

export async function updateAttendanceRecord(
  recordId: string,
  patch: Partial<AttendanceRecord>
): Promise<void> {
  if (shouldUseLocalFallback()) {
    updateLocalAttendanceRecord(recordId, patch);
    return;
  }

  return updateDocument("attendanceRecords", recordId, patch);
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

  const faceRecognitionFields: Partial<AttendanceRecord> = {};
  if (input.faceRecognition) {
    faceRecognitionFields.faceRecognitionUsed = input.faceRecognition.faceRecognitionUsed;
    faceRecognitionFields.faceMatchStatus = input.faceRecognition.faceMatchStatus;
    faceRecognitionFields.faceRecognitionMode = input.faceRecognition.faceRecognitionMode;
    faceRecognitionFields.faceRecognitionVersion = input.faceRecognition.faceRecognitionVersion;
    faceRecognitionFields.faceEnrollmentStatus = input.faceRecognition.faceEnrollmentStatus;
    faceRecognitionFields.faceReferenceCount = input.faceRecognition.faceReferenceCount;
    faceRecognitionFields.faceModelVersion = input.faceRecognition.faceModelVersion;
    if (typeof input.faceRecognition.faceMatchDistance === "number") {
      faceRecognitionFields.faceMatchDistance = input.faceRecognition.faceMatchDistance;
    }
    if (input.faceRecognition.faceRecognitionError) {
      faceRecognitionFields.faceRecognitionError = input.faceRecognition.faceRecognitionError;
    }
  }
  if (input.faceSpoofCheck) {
    faceRecognitionFields.faceSpoofCheckUsed = input.faceSpoofCheck.faceSpoofCheckUsed;
    faceRecognitionFields.faceSpoofCheckStatus = input.faceSpoofCheck.faceSpoofCheckStatus;
    if (typeof input.faceSpoofCheck.faceMovementScore === "number") {
      faceRecognitionFields.faceMovementScore = input.faceSpoofCheck.faceMovementScore;
    }
    if (input.faceSpoofCheck.faceSpoofCheckError) {
      faceRecognitionFields.faceSpoofCheckError = input.faceSpoofCheck.faceSpoofCheckError;
    }
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
    selfieUploadStatus: input.selfieUploadStatus,
    selfieUploadError: input.selfieUploadError || "",
    ...faceRecognitionFields,
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
  selfieUploadStatus: AttendanceSelfieUploadStatus;
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
    selfieDriveFileId: PENDING_SELFIE_UPLOAD_ID,
    selfieUploadStatus: "pending",
    aiVerificationText: input.aiVerificationText,
    isAiValid: input.isAiValid,
    clientTime: input.clientTime,
    userAgent: input.userAgent,
    outOfOfficeReason: input.outOfOfficeReason,
    attendanceType: input.attendanceType,
    faceRecognition: input.faceRecognition,
    faceSpoofCheck: input.faceSpoofCheck
  };
  
  let attendanceRecordId: string;

  try {
    attendanceRecordId = await checkIn(checkInInput);
  } catch (error) {
    if (!isNetworkOrOfflineError(error)) {
      throw error;
    }

    const localId = `offline-attendance-${input.userId}-${Date.now()}`;
    const localRecord: AttendanceRecord = {
      id: localId,
      ...buildAttendanceRecordDraft({
        ...checkInInput,
        selfieUploadStatus: "pending",
        selfieUploadError: "Menunggu sinkronisasi saat koneksi kembali."
      })
    };
    const selfieDataUrl = await blobToDataUrl(input.selfieFile);

    writeLocalAttendanceRecord(localRecord);
    queuePendingAttendanceSync({
      localId,
      record: localRecord,
      selfie: selfieDataUrl
        ? {
            dataUrl: selfieDataUrl,
            name: input.selfieFile.name,
            type: input.selfieFile.type,
            size: input.selfieFile.size
          }
        : undefined,
      queuedAt: new Date().toISOString()
    });

    return {
      attendanceRecordId: localId,
      selfieDriveFileId: PENDING_SELFIE_UPLOAD_ID,
      selfieUploadStatus: "pending"
    };
  }
  
  writeLocalAttendanceRecord({
    id: attendanceRecordId,
    ...buildAttendanceRecordDraft(checkInInput)
  });

  void uploadAttendanceSelfie(input.selfieFile, input.userId)
    .then((driveFile) => {
      const isDemoUpload = isDemoDriveFileId(driveFile.driveFileId);
      const archiveLabel = getSelfieArchiveLabel(driveFile.driveFileId);
      const patch: Partial<AttendanceRecord> = {
        selfieDriveFileId: driveFile.driveFileId,
        selfieUploadStatus: isDemoUpload ? "failed" : "uploaded",
        selfieUploadError: isDemoUpload ? "Arsip bukti selfie belum dikonfigurasi, bukti masih berupa metadata sementara." : ""
      };
      updateLocalAttendanceRecord(attendanceRecordId, patch);
      dispatchSelfieUploadEvent({
        attendanceRecordId,
        selfieDriveFileId: driveFile.driveFileId,
        selfieUploadStatus: patch.selfieUploadStatus || "failed",
        selfieUploadError: patch.selfieUploadError || `Bukti selfie tersimpan di ${archiveLabel}.`
      });

      if (!shouldUseLocalFallback()) {
        return updateDocument("attendanceRecords", attendanceRecordId, patch).catch(() => undefined);
      }
      return undefined;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Upload bukti selfie gagal.";
      const patch: Partial<AttendanceRecord> = {
        selfieUploadStatus: "failed",
        selfieUploadError: message
      };
      updateLocalAttendanceRecord(attendanceRecordId, patch);
      dispatchSelfieUploadEvent({
        attendanceRecordId,
        selfieDriveFileId: PENDING_SELFIE_UPLOAD_ID,
        selfieUploadStatus: "failed",
        selfieUploadError: message
      });

      if (!shouldUseLocalFallback()) {
        return updateDocument("attendanceRecords", attendanceRecordId, patch).catch(() => undefined);
      }
      return undefined;
    });

  return {
    attendanceRecordId,
    selfieDriveFileId: PENDING_SELFIE_UPLOAD_ID,
    selfieUploadStatus: "pending"
  };
}

export async function syncPendingAttendanceRecords(): Promise<number> {
  if (!canAttemptOnlineSync()) {
    return 0;
  }

  const pendingItems = readPendingAttendanceSyncItems();
  let syncedCount = 0;

  for (const item of pendingItems) {
    try {
      let selfieDriveFileId = item.record.selfieDriveFileId || PENDING_SELFIE_UPLOAD_ID;
      let selfieUploadStatus: AttendanceSelfieUploadStatus = item.record.selfieUploadStatus || "pending";
      let selfieUploadError = item.record.selfieUploadError || "";

      if (item.selfie) {
        const selfieFile = await pendingSelfieToFile(item.selfie);
        const driveFile = await uploadAttendanceSelfie(selfieFile, item.record.userId);
        selfieDriveFileId = driveFile.driveFileId;
        selfieUploadStatus = isDemoDriveFileId(driveFile.driveFileId) ? "failed" : "uploaded";
        selfieUploadError =
          selfieUploadStatus === "failed"
            ? "Arsip bukti selfie belum dikonfigurasi, bukti masih berupa metadata sementara."
            : "";
      }

      const remotePayload: Omit<AttendanceRecord, "id"> = {
        ...item.record,
        selfieDriveFileId,
        selfieUploadStatus,
        selfieUploadError
      };
      delete (remotePayload as Partial<AttendanceRecord>).id;

      const remoteId = await createDocument<Omit<AttendanceRecord, "id">>(
        "attendanceRecords",
        remotePayload
      );

      removePendingAttendanceSyncItem(item.localId);
      removeLocalAttendanceRecord(item.localId);
      writeLocalAttendanceRecord({
        ...item.record,
        id: remoteId,
        selfieDriveFileId,
        selfieUploadStatus,
        selfieUploadError
      });
      dispatchSelfieUploadEvent({
        attendanceRecordId: remoteId,
        selfieDriveFileId,
        selfieUploadStatus,
        selfieUploadError
      });
      syncedCount += 1;
    } catch (error) {
      if (isNetworkOrOfflineError(error)) {
        break;
      }
      updateLocalAttendanceRecord(item.localId, {
        selfieUploadStatus: "failed",
        selfieUploadError: error instanceof Error ? error.message : "Sinkronisasi absensi tertunda gagal."
      });
    }
  }

  return syncedCount;
}

export function listAttendanceRecords(): Promise<AttendanceRecord[]> {
  if (shouldUseLocalFallback()) {
    return Promise.resolve(listLocalAttendanceRecords());
  }

  return listDocuments<AttendanceRecord>("attendanceRecords", [
    orderBy("checkInAt", "desc"),
    limit(ATTENDANCE_READ_LIMIT)
  ]).catch(() => listLocalAttendanceRecords());
}

export async function listMyAttendanceRecords(userId: string): Promise<AttendanceRecord[]> {
  const localRecords = listLocalAttendanceRecords().filter((record) => record.userId === userId);

  if (shouldUseLocalFallback()) {
    return localRecords;
  }

  try {
    const remoteRecords = await queryDocuments<AttendanceRecord>("attendanceRecords", "userId", "==", userId);
    return mergeAttendanceRecords([...localRecords, ...remoteRecords]);
  } catch {
    return localRecords;
  }
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
      () => onChange(listLocalAttendanceRecords()),
      [orderBy("checkInAt", "desc"), limit(ATTENDANCE_READ_LIMIT)]
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

  const todayRecords = records
    .map((record) => ({ record, checkInDate: toAttendanceDate(record.checkInAt) }))
    .filter((item): item is { record: AttendanceRecord; checkInDate: Date } =>
      Boolean(item.checkInDate && isSameLocalDay(item.checkInDate, today))
    )
    .sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime());

  return todayRecords.find((item) => !item.record.checkOutAt)?.record || todayRecords[0]?.record || null;
}

export async function checkOut(recordId: string): Promise<void> {
  const checkOutAt = new Date().toISOString();

  if (shouldUseLocalFallback()) {
    updateLocalAttendanceRecord(recordId, { checkOutAt });
    return Promise.resolve();
  }

  await updateDocument("attendanceRecords", recordId, { checkOutAt });
  updateLocalAttendanceRecord(recordId, { checkOutAt });
}
