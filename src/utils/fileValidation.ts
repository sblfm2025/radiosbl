export type FileValidationRule = {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
};

export type UploadCandidate = {
  name: string;
  type: string;
  size: number;
};

export type FileValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export const moduleFileRules = {
  attendance: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 3 * 1024 * 1024
  },
  coverage: {
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "video/mp4",
      "application/pdf"
    ],
    maxSizeBytes: 50 * 1024 * 1024
  },
  liveOb: {
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024
  }
} satisfies Record<string, FileValidationRule>;

export function validateFile(
  file: UploadCandidate,
  rule: FileValidationRule
): FileValidationResult {
  if (!rule.allowedMimeTypes.includes(file.type)) {
    return { valid: false, reason: "Tipe file tidak didukung." };
  }

  if (file.size > rule.maxSizeBytes) {
    return { valid: false, reason: "Ukuran file melebihi batas." };
  }

  return { valid: true };
}
