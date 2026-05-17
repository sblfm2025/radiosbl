import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "../lib/firebase";
import { validateFile, type UploadCandidate, moduleFileRules } from "../utils/fileValidation";
import type { DriveFile } from "../types/domain";

function slugifyFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function uploadAttendanceSelfieToStorage(
  file: UploadCandidate,
  ownerId: string
): Promise<DriveFile> {
  const validation = validateFile(file, moduleFileRules.attendance);

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  if (!(file instanceof Blob)) {
    throw new Error("File upload harus berupa Blob/File browser.");
  }

  const storage = getFirebaseStorage();
  const slug = slugifyFileName(file.name) || "upload";
  const safeOwner = ownerId.replace(/[^a-zA-Z0-9_-]+/g, "-");
  // Menggunakan timestamp unik agar file tidak ter-overwrite
  const fileName = `attendance/${safeOwner}-${Date.now()}-${slug}.jpg`;
  
  const storageRef = ref(storage, fileName);
  
  // Proses Upload
  await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
  
  // Ambil URL Publik dari Firebase Storage
  const downloadUrl = await getDownloadURL(storageRef);

  return {
    id: fileName,
    driveFileId: downloadUrl, // Kita simpan link langsungnya sebagai ID agar gampang dibuka Admin
    name: file.name,
    mimeType: file.type || "image/jpeg",
    size: file.size,
    webViewLink: downloadUrl,
    module: "attendance",
    ownerId,
    createdAt: new Date().toISOString()
  };
}
