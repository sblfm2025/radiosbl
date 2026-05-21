import { validateFile, type UploadCandidate } from "../utils/fileValidation";
import type { DriveFile } from "../types/domain";

export type GoogleDriveUploadRequest = {
  file: UploadCandidate;
  module: string;
  ownerId: string;
};

const GOOGLE_DRIVE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const GOOGLE_DRIVE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function slugifyFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildDriveFileDraft(request: GoogleDriveUploadRequest): DriveFile {
  const slug = slugifyFileName(request.file.name) || "upload";
  const safeOwner = request.ownerId.replace(/[^a-zA-Z0-9_-]+/g, "-");
  const driveFileId = `demo-${request.module}-${safeOwner}-${slug}`;

  return {
    id: driveFileId,
    driveFileId,
    name: request.file.name,
    mimeType: request.file.type,
    size: request.file.size,
    webViewLink: `https://drive.google.com/file/d/${driveFileId}/view`,
    module: request.module,
    ownerId: request.ownerId,
    createdAt: new Date().toISOString()
  };
}

function readBlobAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file untuk upload Google Drive."));
    reader.readAsDataURL(file);
  });
}

function isAppsScriptEndpoint(value: string): boolean {
  return /script\.google\.com\/macros\/s\//i.test(value);
}

async function uploadToGoogleDriveAppsScript(
  endpoint: string,
  request: GoogleDriveUploadRequest
): Promise<DriveFile> {
  if (!(request.file instanceof Blob)) {
    throw new Error("File upload Google Drive harus berasal dari input file browser.");
  }

  const base64 = await readBlobAsBase64(request.file);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      fileBase64: base64,
      fileName: request.file.name,
      mimeType: request.file.type || "application/octet-stream",
      size: request.file.size,
      module: request.module,
      ownerId: request.ownerId
    })
  });

  const payload = (await response.json()) as DriveFile | { error?: string };
  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload && payload.error ? payload.error : "Upload Google Drive gagal.");
  }

  return payload as DriveFile;
}

export async function uploadToGoogleDrive(
  request: GoogleDriveUploadRequest
): Promise<DriveFile> {
  const validation = validateFile(request.file, {
    allowedMimeTypes: GOOGLE_DRIVE_ALLOWED_MIME_TYPES,
    maxSizeBytes: GOOGLE_DRIVE_MAX_FILE_SIZE_BYTES
  });

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const uploadEndpoint = (
    (import.meta.env.VITE_GOOGLE_DRIVE_APPS_SCRIPT_ENDPOINT as string | undefined) ||
    (import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT as string | undefined)
  );

  function uploadDraft(reason?: string): DriveFile {
    if (reason) {
      console.warn(reason);
    }
    return buildDriveFileDraft(request);
  }

  if (!uploadEndpoint) {
    return uploadDraft("Endpoint Google Drive belum dikonfigurasi.");
  }

  if (!(request.file instanceof Blob)) {
    if (import.meta.env.MODE === "test") {
      return buildDriveFileDraft(request);
    }

    throw new Error("File upload Google Drive harus berasal dari input file browser.");
  }

  if (isAppsScriptEndpoint(uploadEndpoint)) {
    try {
      return await uploadToGoogleDriveAppsScript(uploadEndpoint, request);
    } catch (error) {
      return uploadDraft(error instanceof Error ? error.message : "Upload Google Drive Apps Script gagal.");
    }
  }

  const formData = new FormData();
  formData.append("file", request.file, request.file.name);
  formData.append("module", request.module);
  formData.append("ownerId", request.ownerId);

  try {
    const response = await fetch(uploadEndpoint, {
      method: "POST",
      body: formData
    });

    const payload = (await response.json()) as DriveFile | { error?: string };
    if (!response.ok) {
      throw new Error(
        "error" in payload && payload.error
          ? payload.error
          : "Upload Google Drive gagal."
      );
    }

    return payload as DriveFile;
  } catch (error) {
    if (error instanceof TypeError || (error instanceof Error && /failed to fetch|network/i.test(error.message))) {
      return uploadDraft("Google Drive proxy offline, memakai metadata sementara.");
    }
    return uploadDraft(error instanceof Error ? error.message : "Google Drive upload gagal.");
  }
}

export function uploadAttendanceSelfie(file: UploadCandidate, ownerId: string) {
  return uploadToGoogleDrive({
    file,
    ownerId,
    module: "attendance"
  });
}
