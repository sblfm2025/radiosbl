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
  | "radioboss:manage"
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
  requestId?: string;
  requesterName: string;
  requesterWhatsapp?: string;
  artist?: string;
  title: string;
  message?: string;
  announcerName?: string;
  announcerWhatsapp?: string;
  status:
    | "new"
    | "notified"
    | "pending_review"
    | "matched"
    | "needs_review"
    | "sent_to_radioboss"
    | "queued"
    | "played"
    | "rejected"
    | "expired";
  matchStatus?: "unmatched" | "matched" | "ambiguous" | "not_found";
  source?: "web" | "whatsapp" | string;
  channel?: "web" | "whatsapp" | string;
  reviewStatus?: "pending" | "approved" | "rejected" | string;
  rawMessage?: string;
  requestedTitle?: string;
  requestedArtist?: string;
  dedication?: string;
  requesterPhoneMasked?: string;
  whatsappMessageId?: string;
  matchedTrackId?: string | null;
  matchedFilePath?: string | null;
  confidence?: number;
  approvedBy?: string | null;
  approvedAt?: TimestampLike | null;
  sentToRadioBossAt?: TimestampLike | null;
  queuedAt?: TimestampLike | null;
  playedAt?: TimestampLike | null;
  rejectedBy?: string | null;
  rejectedAt?: TimestampLike | null;
  rejectReason?: string | null;
  expiresAt?: TimestampLike;
  createdAt: TimestampLike;
  updatedAt?: TimestampLike;
  notificationText: string;
  whatsappUrl?: string;
  notificationDelivered?: boolean;
};

export type MusicLibraryIndexTrack = {
  id: string;
  trackId?: string;
  title: string;
  artist?: string;
  filePath: string;
  normalizedTitle?: string;
  normalizedArtist?: string;
  updatedAt?: TimestampLike;
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
  status: "draft" | "approved" | "used" | "archived";
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

export type BroadcastRundownSegment = {
  id: string;
  order: number;
  title: string;
  type: 'opening' | 'talk' | 'music' | 'news' | 'ads' | 'psa' | 'interview' | 'closing' | 'other';
  plannedDurationMinutes?: number;
  notes?: string;
  scriptId?: string;
};

export type BroadcastRundown = {
  id: string;
  programId: string;
  programTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  hostIds: string[];
  operatorId?: string;
  status: 'draft' | 'ready' | 'onAir' | 'completed' | 'archived';
  segments: BroadcastRundownSegment[];
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
};

export type PreBroadcastChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: TimestampLike;
};

export type PreBroadcastChecklist = {
  id: string;
  programId: string;
  programTitle: string;
  date: string;
  items: PreBroadcastChecklistItem[];
  status: 'draft' | 'ready' | 'issue_found';
  issueNotes?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
};

export type BroadcastLogSong = {
  title: string;
  artist?: string;
};

export type BroadcastLog = {
  id: string;
  programId: string;
  programTitle: string;
  date: string;
  actualStartTime?: string;
  actualEndTime?: string;
  hostIds: string[];
  operatorId?: string;
  topics: string[];
  songsPlayed?: BroadcastLogSong[];
  guestNames?: string[];
  technicalIssues?: string;
  publicFeedbackSummary?: string;
  documentationLinks?: string[];
  status: 'draft' | 'submitted' | 'reviewed' | 'archived';
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
};

export type RecordingStatus =
  | "waiting_schedule"
  | "waiting_attendance"
  | "ready"
  | "recording"
  | "stopping"
  | "stopped"
  | "completed"
  | "failed"
  | "skipped_no_attendance"
  | "skipped_disabled"
  | "manual_override"
  | "gateway_offline"
  | "radioboss_offline";

export type ProgramRecordingRule = {
  id?: string;
  scheduleId?: string;
  programId: string;
  programName: string;
  recordingEnabled: boolean;
  requireAttendance: boolean;
  autoStart: boolean;
  autoStop: boolean;
  allowManualOverride: boolean;
  startGraceMinutes: number;
  stopGraceMinutes: number;
  maxOverrunMinutes: number;
  minDurationMinutes: number;
  folderSlug: string;
  format: "mp3" | "wav" | string;
  storageRootKey: string;
  createdAt?: TimestampLike;
  createdBy?: string;
  updatedAt?: TimestampLike;
  updatedBy?: string;
};

export type ProgramRecording = {
  id: string;
  recordingId?: string;
  programId: string;
  programName: string;
  scheduleId?: string;
  announcerId?: string;
  announcerName?: string;
  status: RecordingStatus;
  plannedStartAt?: TimestampLike;
  plannedStopAt?: TimestampLike;
  startedAt?: TimestampLike;
  stoppedAt?: TimestampLike | null;
  durationSeconds?: number | null;
  fileName?: string;
  filePath?: string;
  gatewayId?: string;
  source?: string;
  startCommandId?: string | null;
  stopCommandId?: string | null;
  errorCode?: string | null;
  errorMessageSafe?: string | null;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
};

export type RadiobossCommandStatus =
  | "pending"
  | "locked"
  | "executing"
  | "success"
  | "failed"
  | "retryable"
  | "cancelled"
  | "expired";

export type RadiobossCommandType =
  | "START_RECORDING"
  | "STOP_RECORDING"
  | "MARK_RECORDING_SKIPPED"
  | "RETRY_COMMAND"
  | "ADD_TRACK_TO_QUEUE"
  | "MARK_REQUEST_PLAYED";

export type RadiobossCommand = {
  id: string;
  type: RadiobossCommandType;
  status: RadiobossCommandStatus;
  payload: Record<string, unknown>;
  requestedBy: string;
  requestedByName: string;
  requestedAt?: TimestampLike;
  priority: "low" | "normal" | "high";
  dedupeKey: string;
  attempts: number;
  maxAttempts: number;
  lockedBy?: string | null;
  lockedAt?: TimestampLike | null;
  executedAt?: TimestampLike | null;
  gatewayId?: string | null;
  result?: Record<string, unknown> | null;
  errorCode?: string | null;
  errorMessageSafe?: string | null;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
};

export type ShiftHandover = {
  id: string;
  date: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId?: string;
  toUserName?: string;
  shiftLabel?: string;
  notes: string;
  pendingRequests?: string[];
  technicalNotes?: string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: TimestampLike;
};

export type ListenerAnalyticsSession = {
  id: string;
  userId?: string;
  anonymousId: string;
  startedAt: TimestampLike;
  lastSeenAt: TimestampLike;
  endedAt?: TimestampLike;
  status: 'active' | 'paused' | 'ended' | 'error';
  source: 'web-pwa';
  device: {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    os: string;
    browser: string;
  };
  program?: {
    id?: string;
    title?: string;
  };
  playback: {
    playCount: number;
    pauseCount: number;
    errorCount: number;
    playDurationSeconds: number;
    lastEvent: 'play' | 'pause' | 'stop' | 'heartbeat' | 'error';
  };
  location: {
    permission: 'unknown' | 'requested' | 'granted' | 'denied' | 'unavailable' | 'failed';
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    capturedAt?: TimestampLike;
    source: 'browser-geolocation' | 'none';
  };
  privacy: {
    locationConsentVersion: string;
    locationConsentText: string;
    preciseLocationEnabled: boolean;
  };
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
};

export type ListenerStreamingError = {
  id: string;
  sessionId?: string;
  event: 'play_failed' | 'buffering_timeout' | 'stalled' | 'network_error' | 'media_error' | 'unknown';
  message?: string;
  programId?: string;
  programTitle?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  createdAt: TimestampLike;
};

export type SecurityAuditLog = {
  id: string;
  actorUserId: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  targetCollection?: string;
  targetId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: TimestampLike;
};

export type ApprovalRequest = {
  id: string;
  type: 'notification' | 'public_content' | 'schedule_change' | 'analytics_export';
  title: string;
  payload: Record<string, any>;
  requestedBy: string;
  requestedByName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNote?: string;
  createdAt: TimestampLike;
  reviewedAt?: TimestampLike;
};
