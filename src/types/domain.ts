export type TimestampLike = Date | string | number;

export type UserRole =
  | "super_admin"
  | "admin"
  | "leader"
  | "announcer"
  | "reporter"
  | "operator"
  | "employee"
  | "public";

export type Permission =
  | "dashboard:read"
  | "users:manage"
  | "attendance:self"
  | "attendance:manage"
  | "schedule:read"
  | "schedule:manage"
  | "schedule:swap"
  | "coverage:manage"
  | "live_ob:manage"
  | "complaints:submit"
  | "complaints:manage"
  | "ai:use"
  | "settings:manage";

export type AppUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  employeeId?: string;
  airName?: string;
  announcerNames?: string[];
  photoUrl?: string;
  whatsapp?: string;
  active: boolean;
};

export type DriveFile = {
  id: string;
  driveFileId: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  module: string;
  ownerId: string;
  createdAt: TimestampLike;
};

export type AttendanceStatus = "present" | "late" | "outside_radius" | "valid" | "needs_review" | "rejected" | "sick" | "leave";
export type AttendanceSelfieUploadStatus = "pending" | "uploaded" | "failed";
export type FaceProfileStatus = "not_enrolled" | "pending_review" | "active" | "needs_update" | "disabled";
export type FaceMatchStatus =
  | "matched_candidate"
  | "review_candidate"
  | "mismatch_candidate"
  | "not_enrolled"
  | "disabled"
  | "unavailable";
export type FaceRecognitionMode = "observe_only" | "review";
export type FaceSpoofCheckStatus = "passed" | "needs_review" | "unavailable";

export type FaceProfile = {
  id: string;
  enrolled: boolean;
  status: FaceProfileStatus;
  model: "face-api.js" | string;
  modelVersion: string;
  descriptorCount: number;
  descriptors: number[][];
  referenceDriveFileIds?: string[];
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  approvedBy?: string;
  approvedAt?: TimestampLike;
};

export type AttendanceRecord = {
  id: string;
  userId: string;
  displayName?: string;
  airName?: string;
  checkInAt: TimestampLike;
  checkOutAt?: TimestampLike;
  clientTime?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  distanceToCenter?: number;
  userAgent?: string;
  confidenceScore?: number;
  aiVerificationText?: string;
  outOfOfficeReason?: string;
  selfieDriveFileId: string;
  selfieUploadStatus?: AttendanceSelfieUploadStatus;
  selfieUploadError?: string;
  faceRecognitionUsed?: boolean;
  faceMatchDistance?: number;
  faceMatchStatus?: FaceMatchStatus;
  faceRecognitionMode?: FaceRecognitionMode;
  faceRecognitionVersion?: string;
  faceRecognitionError?: string;
  faceEnrollmentStatus?: FaceProfileStatus;
  faceReferenceCount?: number;
  faceModelVersion?: string;
  faceSpoofCheckUsed?: boolean;
  faceSpoofCheckStatus?: FaceSpoofCheckStatus;
  faceMovementScore?: number;
  faceSpoofCheckError?: string;
  status: AttendanceStatus;
};

export type BroadcastProgram = {
  id: string;
  title: string;
  description: string;
  defaultDurationMinutes: number;
  category?: "main" | "insert" | "playlist";
  active: boolean;
};

export type BroadcastProgramSlot = {
  id?: string;
  day: string;
  time: string;
  program: string;
  description: string;
  announcer: string;
  date?: string;
  source?: "regular" | "override" | "special";
  overrideType?: ScheduleOverrideType;
  originalProgram?: string;
  originalAnnouncer?: string;
  originalTime?: string;
  isCancelled?: boolean;
  reason?: string;
};

export type ScheduleOverrideType = "replace" | "add" | "cancel" | "reschedule" | "activate_optional";

export type ScheduleOverride = {
  id: string;
  date: string;
  slotId: string;
  type: ScheduleOverrideType;
  newProgram?: string;
  newAnnouncer?: string;
  newTime?: string;
  description?: string;
  reason: string;
  sourceSwapId?: string;
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt?: TimestampLike;
};

export type BroadcastSchedule = {
  id: string;
  programId: string;
  announcerId?: string;
  announcerIds?: string[];
  externalPic?: string[];
  day?: string;
  timeLabel?: string;
  operatorId?: string;
  startsAt: TimestampLike;
  endsAt: TimestampLike;
  status: "draft" | "ready" | "live" | "completed" | "cancelled";
};

export type ScheduleSwapRequest = {
  id: string;
  scheduleId: string;
  targetDate?: string;
  requesterId: string;
  targetAnnouncerId: string;
  requesterAliases?: string[];
  targetAnnouncerAliases?: string[];
  reason: string;
  status: "pending_target" | "approved" | "rejected";
  createdAt: TimestampLike;
  updatedAt?: TimestampLike;
};

export type Complaint = {
  id: string;
  reporterName: string;
  category: "Teknis" | "Program" | "Informasi Publik" | "Lainnya";
  message: string;
  status: "Baru" | "Terverifikasi" | "Diproses" | "Selesai";
  createdAt: TimestampLike;
};

export type SongRequest = {
  id: string;
  requesterName: string;
  requesterWhatsapp?: string;
  artist?: string;
  title: string;
  message?: string;
  announcerName?: string;
  announcerWhatsapp?: string;
  status: "new" | "notified" | "queued" | "played" | "rejected";
  createdAt: TimestampLike;
  notificationText: string;
  whatsappUrl?: string;
  notificationDelivered?: boolean;
};

export type ProgramScriptDraft = {
  id: string;
  programTitle: string;
  scheduleTime: string;
  day: string;
  announcerName: string;
  description: string;
  provider: "openai" | "gemini" | "demo";
  tone: string;
  durationMinutes: number;
  intervention?: string;
  content: string;
  status: "draft" | "approved" | "used";
  createdBy: string;
  createdByName: string;
  createdAt: TimestampLike;
  updatedAt?: TimestampLike;
};

export type LiveEvent = {
  id: string;
  title: string;
  location: string;
  startsAt: TimestampLike;
  youtubeUrl?: string;
  discordRoomUrl?: string;
  crewIds: string[];
  status: "draft" | "ready" | "live" | "completed";
};

export type CoverageStatus = "Assigned" | "In Progress" | "Submitted" | "Reviewed" | "Published";

export type CoverageAssignment = {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  status: CoverageStatus;
  deadline: TimestampLike;
  draftContent?: string;
  attachmentUrls?: string[];
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
};

export type Announcer = {
  id: string;
  fullName: string;
  airName: string;
  scheduleNames: string[];
  photoUrl?: string;
  decreeOrder: number;
  active: boolean;
  totalDays: number;
  totalHours: number;
  note?: string;
};

export type StreamingSettings = {
  id: string;
  stationName: string;
  frequency: string;
  streamUrl: string;
  publicStreamPage?: string;
  website: string;
  phone: string;
  socialHandle: string;
};

export type AppSettings = {
  id: string;
  legalName: string;
  directorName: string;
  directorPosition: string;
  decreeNumber: string;
  decreeDate: string;
  address: string;
  postalCode: string;
};
