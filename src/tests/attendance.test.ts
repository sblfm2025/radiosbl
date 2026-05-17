import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAttendanceRecordDraft,
  checkIn,
  checkInWithSelfie,
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

  it("stores successful selfie check-in in local attendance cache", async () => {
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
      selfieUploadStatus: "uploaded"
    });
    await expect(listAttendanceRecords()).resolves.toHaveLength(1);
  });

  it("posts browser files to configured Google Drive upload endpoint", async () => {
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
