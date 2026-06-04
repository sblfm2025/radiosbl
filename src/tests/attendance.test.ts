import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAttendanceRecordDraft,
  checkIn,
  checkInWithSelfie,
  checkOut,
  getTodayAttendance,
  listLocalAttendanceRecords,
  listAttendanceRecords
} from "../services/attendance.service";
import { buildDriveFileDraft, uploadToGoogleDrive } from "../services/googleDrive.service";

describe("attendance payload", () => {
  const officeCenter = { latitude: -3.7931, longitude: 119.6522 };

  function createMemoryStorage(): Storage {
    let store: Record<string, string> = {};

    return {
      get length() {
        return Object.keys(store).length;
      },
      clear() {
        store = {};
      },
      getItem(key: string) {
        return store[key] ?? null;
      },
      key(index: number) {
        return Object.keys(store)[index] ?? null;
      },
      removeItem(key: string) {
        delete store[key];
      },
      setItem(key: string, value: string) {
        store[key] = value;
      }
    };
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("builds present payloads inside radius", () => {
    const draft = buildAttendanceRecordDraft({
      userId: "user-1",
      position: officeCenter,
      officeCenter,
      radiusMeters: 120,
      selfieDriveFileId: "drive-file-1"
    });

    expect(draft.status).toBe("present");
    expect(draft.userId).toBe("user-1");
    expect(draft.selfieDriveFileId).toBe("drive-file-1");
  });

  it("marks payloads outside office radius", () => {
    const draft = buildAttendanceRecordDraft({
      userId: "user-1",
      position: { latitude: -3.78, longitude: 119.64 },
      officeCenter,
      radiusMeters: 120,
      selfieDriveFileId: "drive-file-1"
    });

    expect(draft.status).toBe("outside_radius");
  });

  it("builds deterministic Google Drive metadata for demo selfie uploads", () => {
    expect(
      buildDriveFileDraft({
        file: { name: "Selfie Masuk.png", type: "image/png", size: 2048 },
        module: "attendance",
        ownerId: "user-1"
      })
    ).toMatchObject({
      driveFileId: "demo-attendance-user-1-selfie-masuk",
      module: "attendance",
      ownerId: "user-1"
    });
  });

  it("runs check-in with selfie in demo mode", async () => {
    await expect(
      checkInWithSelfie({
        userId: "user-1",
        position: officeCenter,
        officeCenter,
        radiusMeters: 120,
        selfieFile: { name: "selfie.webp", type: "image/webp", size: 1024 }
      })
    ).resolves.toEqual({
      attendanceRecordId: "demo-attendance-user-1",
      selfieDriveFileId: "pending_upload",
      selfieUploadStatus: "pending"
    });
  });

  it("keeps attendance fallback isolated from Firestore without env", async () => {
    await expect(
      checkIn({
        userId: "user-2",
        position: officeCenter,
        officeCenter,
        radiusMeters: 120,
        selfieDriveFileId: "drive-file-2"
      })
    ).resolves.toBe("demo-attendance-user-2");
    await expect(listAttendanceRecords()).resolves.toEqual([]);
  });

  it("stores demo selfie check-in in local attendance cache", async () => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });

    await checkInWithSelfie({
      userId: "user-3",
      displayName: "Salmiah",
      airName: "Miah",
      position: officeCenter,
      officeCenter,
      radiusMeters: 120,
      selfieFile: { name: "selfie.webp", type: "image/webp", size: 1024 }
    });

    expect(listLocalAttendanceRecords()[0]).toMatchObject({
      id: "demo-attendance-user-3",
      displayName: "Salmiah",
      airName: "Miah",
      status: "present"
    });
    await Promise.resolve();
    expect(listLocalAttendanceRecords()[0]).toMatchObject({
      selfieDriveFileId: "demo-attendance-user-3-selfie",
      selfieUploadStatus: "failed",
      selfieUploadError: "Arsip bukti selfie belum dikonfigurasi, bukti masih berupa metadata sementara."
    });
    await expect(listAttendanceRecords()).resolves.toHaveLength(1);
  });

  it("detects today's attendance from Firestore Timestamp-like values", async () => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    const today = new Date();
    today.setHours(8, 15, 0, 0);

    storage.setItem("radio-sbl-attendance-records", JSON.stringify([
      {
        id: "timestamp-attendance-user-4",
        userId: "user-4",
        checkInAt: { seconds: Math.floor(today.getTime() / 1000) },
        latitude: officeCenter.latitude,
        longitude: officeCenter.longitude,
        selfieDriveFileId: "manual_entry",
        status: "present"
      }
    ]));

    await expect(getTodayAttendance("user-4")).resolves.toMatchObject({
      id: "timestamp-attendance-user-4",
      userId: "user-4"
    });
  });

  it("prioritizes the latest open attendance record for checkout", async () => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    const today = new Date();
    const early = new Date(today);
    early.setHours(8, 0, 0, 0);
    const later = new Date(today);
    later.setHours(14, 0, 0, 0);

    storage.setItem("radio-sbl-attendance-records", JSON.stringify([
      {
        id: "closed-record",
        userId: "user-5",
        checkInAt: later.toISOString(),
        checkOutAt: later.toISOString(),
        latitude: officeCenter.latitude,
        longitude: officeCenter.longitude,
        selfieDriveFileId: "manual_entry",
        status: "present"
      },
      {
        id: "open-record",
        userId: "user-5",
        checkInAt: early.toISOString(),
        latitude: officeCenter.latitude,
        longitude: officeCenter.longitude,
        selfieDriveFileId: "manual_entry",
        status: "present"
      }
    ]));

    await expect(getTodayAttendance("user-5")).resolves.toMatchObject({
      id: "open-record"
    });
  });

  it("keeps local checkout cache in sync", async () => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    storage.setItem("radio-sbl-attendance-records", JSON.stringify([
      {
        id: "checkout-record",
        userId: "user-6",
        checkInAt: today.toISOString(),
        latitude: officeCenter.latitude,
        longitude: officeCenter.longitude,
        selfieDriveFileId: "manual_entry",
        status: "present"
      }
    ]));

    await checkOut("checkout-record");

    expect(listLocalAttendanceRecords()[0]).toMatchObject({
      id: "checkout-record",
      userId: "user-6"
    });
    expect(listLocalAttendanceRecords()[0].checkOutAt).toEqual(expect.any(String));
    await expect(getTodayAttendance("user-6")).resolves.toMatchObject({
      id: "checkout-record",
      checkOutAt: expect.any(String)
    });
  });

  it("posts browser files to configured Google Drive upload endpoint", async () => {
    vi.stubEnv("VITE_GOOGLE_DRIVE_APPS_SCRIPT_ENDPOINT", "");
    vi.stubEnv("VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT", "http://localhost:8787/upload");
    const file = Object.assign(new Blob(["selfie"], { type: "image/png" }), {
      name: "selfie.png"
    });
    const responsePayload = {
      id: "drive-file-1",
      driveFileId: "drive-file-1",
      name: "selfie.png",
      mimeType: "image/png",
      size: 6,
      webViewLink: "https://drive.google.com/file/d/drive-file-1/view",
      module: "attendance",
      ownerId: "user-1",
      createdAt: "2026-05-15T00:00:00.000Z"
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(responsePayload), { status: 200 }));

    await expect(
      uploadToGoogleDrive({
        file,
        module: "attendance",
        ownerId: "user-1"
      })
    ).resolves.toEqual(responsePayload);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8787/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) })
    );
  });
});
