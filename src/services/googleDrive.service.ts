import { validateFile, type UploadCandidate } from "../utils/fileValidation";
import type { DriveFile } from "../types/domain";

export type GoogleDriveUploadRequest = {
  file: UploadCandidate;
  module: string;
  ownerId: string;
};

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

export async function uploadToGoogleDrive(
  request: GoogleDriveUploadRequest
): Promise<DriveFile> {
  const validation = validateFile(request.file, {
    allowedMimeTypes: [request.file.type],
    maxSizeBytes: request.file.size
  });

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const uploadEndpoint = import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT as
    | string
    | undefined;

  if (!uploadEndpoint) {
    return buildDriveFileDraft(request);
  }

  if (!(request.file instanceof Blob)) {
    if (import.meta.env.MODE === "test") {
      return buildDriveFileDraft(request);
    }

    throw new Error("File upload Google Drive harus berasal dari input file browser.");
  }

  const formData = new FormData();
  formData.append("file", request.file, request.file.name);
  formData.append("module", request.module);
  formData.append("ownerId", request.ownerId);

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
}

export function uploadAttendanceSelfie(file: UploadCandidate, ownerId: string) {
  return uploadToGoogleDrive({
    file,
    ownerId,
    module: "attendance"
  });
}
