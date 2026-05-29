import { doc, getDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import { shouldUseLocalFallback } from "../lib/env";
import type {
  FaceMatchStatus,
  FaceProfile,
  FaceProfileStatus,
  FaceRecognitionMode,
  FaceSpoofCheckStatus
} from "../types/domain";
import { upsertDocument } from "./firestore.service";
import { uploadFaceProfileReference } from "./googleDrive.service";
import type { UploadCandidate } from "../utils/fileValidation";

const FACE_API_MODEL_URL = "/models/face-api";
const FACE_RECOGNITION_VERSION = "v1";
const FACE_RECOGNITION_MODEL_VERSION = "1.0";
type FaceApiModule = typeof import("face-api.js");

export const attendanceConfig = {
  faceRecognitionEnabled: true,
  faceRecognitionMode: "observe_only" as FaceRecognitionMode,
  faceRecognitionRequired: false,
  faceRecognitionVersion: FACE_RECOGNITION_VERSION
};

export type FaceRecognitionResult = {
  faceRecognitionUsed: boolean;
  faceMatchDistance?: number;
  faceMatchStatus: FaceMatchStatus;
  faceRecognitionMode: FaceRecognitionMode;
  faceRecognitionVersion: string;
  faceRecognitionError?: string;
  faceEnrollmentStatus: FaceProfileStatus;
  faceReferenceCount: number;
  faceModelVersion: string;
};

export type FaceReferenceAnalysis = {
  descriptor: number[];
  detectionScore: number;
};

export type FaceEnrollmentInput = {
  userId: string;
  files: Blob[];
  approvedBy: string;
};

export type FaceSpoofCheckResult = {
  faceSpoofCheckUsed: boolean;
  faceSpoofCheckStatus: FaceSpoofCheckStatus;
  faceMovementScore?: number;
  faceSpoofCheckError?: string;
};

let modelLoadPromise: Promise<void> | null = null;
let faceApiPromise: Promise<FaceApiModule> | null = null;

function loadFaceApi(): Promise<FaceApiModule> {
  if (!faceApiPromise) {
    faceApiPromise = import("face-api.js");
  }

  return faceApiPromise;
}

function isBrowserSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof HTMLImageElement !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  );
}

async function loadFaceModels(): Promise<void> {
  if (!modelLoadPromise) {
    modelLoadPromise = loadFaceApi().then((faceapi) => Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_MODEL_URL)
    ]).then(() => undefined));
  }

  return modelLoadPromise;
}

function unavailableResult(error: string, status: FaceProfileStatus = "not_enrolled"): FaceRecognitionResult {
  return {
    faceRecognitionUsed: false,
    faceMatchStatus: status === "disabled" ? "disabled" : "unavailable",
    faceRecognitionMode: attendanceConfig.faceRecognitionMode,
    faceRecognitionVersion: attendanceConfig.faceRecognitionVersion,
    faceRecognitionError: error,
    faceEnrollmentStatus: status,
    faceReferenceCount: 0,
    faceModelVersion: FACE_RECOGNITION_MODEL_VERSION
  };
}

function matchStatusFromDistance(distance: number): FaceMatchStatus {
  if (distance <= 0.45) {
    return "matched_candidate";
  }
  if (distance <= 0.6) {
    return "review_candidate";
  }
  return "mismatch_candidate";
}

export async function readFaceProfile(userId: string): Promise<FaceProfile | null> {
  if (shouldUseLocalFallback()) {
    return null;
  }

  const snapshot = await getDoc(doc(getFirebaseFirestore(), "users", userId, "faceProfiles", "default"));
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<FaceProfile, "id">)
  };
}

async function fileToImage(faceapi: FaceApiModule, file: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await faceapi.fetchImage(objectUrl);
    return image as HTMLImageElement;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function toUploadCandidateBlob(file: Blob, index: number): UploadCandidate & Blob {
  const fallbackName = `face-reference-${index + 1}.jpg`;
  const name = "name" in file && typeof file.name === "string" && file.name.trim()
    ? file.name
    : fallbackName;

  return Object.assign(file, {
    name,
    type: file.type || "image/jpeg",
    size: file.size
  });
}

function unavailableSpoofCheck(error: string): FaceSpoofCheckResult {
  return {
    faceSpoofCheckUsed: false,
    faceSpoofCheckStatus: "unavailable",
    faceSpoofCheckError: error
  };
}

async function detectFaceBox(faceapi: FaceApiModule, file: Blob): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const image = await fileToImage(faceapi, file);
  const detection = await faceapi.detectSingleFace(image, new faceapi.TinyFaceDetectorOptions());
  if (!detection) {
    return null;
  }

  const box = detection.box;
  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height
  };
}

export async function analyzeFaceSpoofMovement(
  firstFrame: Blob,
  secondFrame: Blob
): Promise<FaceSpoofCheckResult> {
  if (!attendanceConfig.faceRecognitionEnabled) {
    return unavailableSpoofCheck("FACE_RECOGNITION_DISABLED");
  }

  if (!isBrowserSupported()) {
    return unavailableSpoofCheck("BROWSER_NOT_SUPPORTED");
  }

  try {
    await loadFaceModels();
    const faceapi = await loadFaceApi();
    const [firstBox, secondBox] = await Promise.all([
      detectFaceBox(faceapi, firstFrame),
      detectFaceBox(faceapi, secondFrame)
    ]);

    if (!firstBox || !secondBox) {
      return unavailableSpoofCheck("FACE_NOT_DETECTED_IN_TWO_FRAMES");
    }

    const firstCenterX = firstBox.x + firstBox.width / 2;
    const firstCenterY = firstBox.y + firstBox.height / 2;
    const secondCenterX = secondBox.x + secondBox.width / 2;
    const secondCenterY = secondBox.y + secondBox.height / 2;
    const averageFaceSize = Math.max((firstBox.width + firstBox.height + secondBox.width + secondBox.height) / 4, 1);
    const centerDelta = Math.hypot(secondCenterX - firstCenterX, secondCenterY - firstCenterY);
    const sizeDelta = Math.abs((secondBox.width + secondBox.height) - (firstBox.width + firstBox.height)) / 2;
    const movementScore = Number(((centerDelta + sizeDelta) / averageFaceSize).toFixed(4));

    return {
      faceSpoofCheckUsed: true,
      faceSpoofCheckStatus: movementScore >= 0.015 ? "passed" : "needs_review",
      faceMovementScore: movementScore
    };
  } catch (error) {
    return unavailableSpoofCheck(error instanceof Error && error.message ? error.message : "SPOOF_CHECK_FAILED");
  }
}

export async function analyzeFaceReferenceFile(file: Blob): Promise<FaceReferenceAnalysis> {
  if (!isBrowserSupported()) {
    throw new Error("BROWSER_NOT_SUPPORTED");
  }

  await loadFaceModels();
  const faceapi = await loadFaceApi();
  const image = await fileToImage(faceapi, file);
  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length !== 1) {
    throw new Error(detections.length === 0 ? "NO_FACE_DETECTED" : "MULTIPLE_FACES_DETECTED");
  }

  return {
    descriptor: Array.from(detections[0].descriptor),
    detectionScore: Number(detections[0].detection.score.toFixed(4))
  };
}

export async function enrollFaceProfile(input: FaceEnrollmentInput): Promise<FaceProfile> {
  if (input.files.length < 5) {
    throw new Error("Minimal 5 foto referensi dibutuhkan.");
  }

  const analyses: FaceReferenceAnalysis[] = [];
  for (const file of input.files.slice(0, 8)) {
    analyses.push(await analyzeFaceReferenceFile(file));
  }

  const referenceFiles = await Promise.all(
    input.files.slice(0, analyses.length).map((file, index) =>
      uploadFaceProfileReference(
        toUploadCandidateBlob(file, index),
        input.userId
      )
    )
  );

  const profile: Omit<FaceProfile, "id"> = {
    enrolled: true,
    status: "active",
    model: "face-api.js",
    modelVersion: FACE_RECOGNITION_MODEL_VERSION,
    descriptorCount: analyses.length,
    descriptors: analyses.map((analysis) => analysis.descriptor),
    referenceDriveFileIds: referenceFiles.map((file) => file.driveFileId),
    createdAt: new Date().toISOString(),
    approvedBy: input.approvedBy,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await upsertDocument(`users/${input.userId}/faceProfiles`, "default", profile);

  return {
    id: "default",
    ...profile
  };
}

export async function updateFaceProfileStatus(
  userId: string,
  status: FaceProfileStatus,
  approvedBy?: string
): Promise<void> {
  await upsertDocument(`users/${userId}/faceProfiles`, "default", {
    status,
    enrolled: status !== "not_enrolled",
    updatedAt: new Date().toISOString(),
    ...(approvedBy ? { approvedBy } : {})
  });
}

export async function analyzeAttendanceFace(
  selfieFile: Blob,
  userId: string
): Promise<FaceRecognitionResult> {
  if (!attendanceConfig.faceRecognitionEnabled) {
    return unavailableResult("FACE_RECOGNITION_DISABLED", "disabled");
  }

  if (!isBrowserSupported()) {
    return unavailableResult("BROWSER_NOT_SUPPORTED");
  }

  try {
    const profile = await readFaceProfile(userId);
    const enrollmentStatus = profile?.status || "not_enrolled";
    const descriptors = Array.isArray(profile?.descriptors) ? profile.descriptors : [];

    if (!profile?.enrolled || enrollmentStatus !== "active" || descriptors.length === 0) {
      return {
        faceRecognitionUsed: false,
        faceMatchStatus: enrollmentStatus === "disabled" ? "disabled" : "not_enrolled",
        faceRecognitionMode: attendanceConfig.faceRecognitionMode,
        faceRecognitionVersion: attendanceConfig.faceRecognitionVersion,
        faceRecognitionError: enrollmentStatus === "disabled" ? "FACE_PROFILE_DISABLED" : "FACE_PROFILE_NOT_ACTIVE",
        faceEnrollmentStatus: enrollmentStatus,
        faceReferenceCount: descriptors.length,
        faceModelVersion: profile?.modelVersion || FACE_RECOGNITION_MODEL_VERSION
      };
    }

    await loadFaceModels();
    const faceapi = await loadFaceApi();

    const image = await fileToImage(faceapi, selfieFile);
    const detection = await faceapi
      .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return {
        faceRecognitionUsed: false,
        faceMatchStatus: "unavailable",
        faceRecognitionMode: attendanceConfig.faceRecognitionMode,
        faceRecognitionVersion: attendanceConfig.faceRecognitionVersion,
        faceRecognitionError: "NO_FACE_DETECTED",
        faceEnrollmentStatus: enrollmentStatus,
        faceReferenceCount: descriptors.length,
        faceModelVersion: profile.modelVersion || FACE_RECOGNITION_MODEL_VERSION
      };
    }

    const distances = descriptors
      .filter((descriptor) => Array.isArray(descriptor) && descriptor.length === detection.descriptor.length)
      .map((descriptor) => faceapi.euclideanDistance(detection.descriptor, new Float32Array(descriptor)));
    const bestDistance = distances.length > 0 ? Math.min(...distances) : undefined;

    if (bestDistance === undefined) {
      return unavailableResult("REFERENCE_DESCRIPTOR_INVALID", enrollmentStatus);
    }

    return {
      faceRecognitionUsed: true,
      faceMatchDistance: Number(bestDistance.toFixed(4)),
      faceMatchStatus: matchStatusFromDistance(bestDistance),
      faceRecognitionMode: attendanceConfig.faceRecognitionMode,
      faceRecognitionVersion: attendanceConfig.faceRecognitionVersion,
      faceEnrollmentStatus: enrollmentStatus,
      faceReferenceCount: descriptors.length,
      faceModelVersion: profile.modelVersion || FACE_RECOGNITION_MODEL_VERSION
    };
  } catch (error) {
    return unavailableResult(error instanceof Error && error.message ? error.message : "MODEL_LOAD_FAILED");
  }
}
