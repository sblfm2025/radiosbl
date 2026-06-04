import type { BroadcastProgramSlot } from "../../data/radioData";
import type { AttendanceRecord, ProgramRecording, ProgramRecordingRule } from "../../types/domain";
import { resolveAnnouncerText } from "../../utils/announcerResolver";

const recordingEligibleAttendanceStatuses = new Set(["present", "late", "valid"]);
const recordingReviewAttendanceStatuses = new Set(["outside_radius", "needs_review"]);

export function isRecordableBroadcastSlot(slot: Pick<BroadcastProgramSlot, "program" | "announcer">): boolean {
  if (!slot.program || !slot.announcer) {
    return false;
  }

  return resolveAnnouncerText(slot.announcer).some((part) => part.kind === "announcer");
}

export function isAttendanceValidForRecordingStart(record: AttendanceRecord): boolean {
  return (
    recordingEligibleAttendanceStatuses.has(record.status) &&
    !record.checkOutAt
  );
}

export function needsManualRecordingReview(record: AttendanceRecord): boolean {
  return recordingReviewAttendanceStatuses.has(record.status);
}

export function shouldStartRecordingFromAttendance({
  rule,
  attendance,
  hasActiveRecording
}: {
  rule: Pick<ProgramRecordingRule, "recordingEnabled" | "requireAttendance" | "autoStart">;
  attendance: AttendanceRecord | null;
  hasActiveRecording: boolean;
}): boolean {
  if (!rule.recordingEnabled || !rule.autoStart || hasActiveRecording) {
    return false;
  }

  if (!rule.requireAttendance) {
    return true;
  }

  return Boolean(attendance && isAttendanceValidForRecordingStart(attendance));
}

export function shouldStopRecordingFromAttendanceCheckout({
  rule,
  attendance,
  recording
}: {
  rule: Pick<ProgramRecordingRule, "autoStop">;
  attendance: AttendanceRecord | null;
  recording: Pick<ProgramRecording, "status"> | null;
}): boolean {
  return Boolean(
    rule.autoStop &&
    recording?.status === "recording" &&
    attendance?.checkOutAt
  );
}
