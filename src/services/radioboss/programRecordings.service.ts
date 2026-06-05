import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe
} from "firebase/firestore";
import { getRecordingFirestore } from "../../lib/firebase";
import { shouldUseRecordingLocalFallback } from "../../lib/env";
import type { ProgramRecording, RecordingStatus } from "../../types/domain";
import { toDate } from "./radiobossStatus.service";

export type RecordingHistoryFilters = {
  date?: string;
  program?: string;
  announcer?: string;
  status?: RecordingStatus | "all";
  gateway?: string;
};

const activeRecordingStatuses: RecordingStatus[] = [
  "recording",
  "stopping",
  "ready",
  "waiting_attendance",
  "waiting_schedule",
  "failed",
  "gateway_offline",
  "radioboss_offline"
];

function matchesText(value: string | undefined, queryValue: string | undefined): boolean {
  if (!queryValue?.trim()) return true;
  return (value ?? "").toLowerCase().includes(queryValue.trim().toLowerCase());
}

function matchesDate(recording: ProgramRecording, dateValue?: string): boolean {
  if (!dateValue) return true;
  const date = toDate(recording.plannedStartAt ?? recording.startedAt ?? recording.createdAt);
  if (!date) return false;

  const localDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");

  return localDate === dateValue;
}

function applyRecordingFilters(recordings: ProgramRecording[], filters: RecordingHistoryFilters): ProgramRecording[] {
  return recordings.filter((recording) => (
    matchesDate(recording, filters.date)
    && matchesText(recording.programName, filters.program)
    && matchesText(recording.announcerName, filters.announcer)
    && matchesText(recording.gatewayId, filters.gateway)
    && (!filters.status || filters.status === "all" || recording.status === filters.status)
  ));
}

export function subscribeActiveProgramRecording(
  scheduleId: string,
  callback: (recording: ProgramRecording | null) => void
): Unsubscribe {
  if (shouldUseRecordingLocalFallback() || !scheduleId) {
    callback(null);
    return () => undefined;
  }

  try {
    return onSnapshot(
      query(collection(getRecordingFirestore(), "programRecordings"), where("scheduleId", "==", scheduleId)),
      (snapshot) => {
        const active = snapshot.docs
          .map((item) => {
            const data = item.data() as ProgramRecording;
            return { ...data, id: item.id };
          })
          .filter((recording) => activeRecordingStatuses.includes(recording.status))
          .sort((left, right) => (
            activeRecordingStatuses.indexOf(left.status) - activeRecordingStatuses.indexOf(right.status)
          ))[0];
        callback(active ?? null);
      },
      () => callback(null)
    );
  } catch {
    callback(null);
    return () => undefined;
  }
}

export function subscribeRecordingHistory(
  filters: RecordingHistoryFilters,
  callback: (recordings: ProgramRecording[]) => void
): Unsubscribe {
  if (shouldUseRecordingLocalFallback()) {
    callback([]);
    return () => undefined;
  }

  try {
    return onSnapshot(
      query(collection(getRecordingFirestore(), "programRecordings"), orderBy("plannedStartAt", "desc")),
      (snapshot) => {
        const recordings = snapshot.docs.map((item) => {
          const data = item.data() as ProgramRecording;
          return { ...data, id: item.id };
        });
        callback(applyRecordingFilters(recordings, filters));
      },
      () => callback([])
    );
  } catch {
    callback([]);
    return () => undefined;
  }
}

export async function markRecordingSkipped(recordingId: string, reason: string): Promise<void> {
  await updateDoc(doc(getRecordingFirestore(), "programRecordings", recordingId), {
    status: "manual_override",
    errorMessageSafe: reason,
    updatedAt: serverTimestamp()
  });
}
