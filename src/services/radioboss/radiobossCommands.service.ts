import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type Unsubscribe
} from "firebase/firestore";
import { getFirebaseFirestore } from "../../lib/firebase";
import { shouldUseLocalFallback } from "../../lib/env";
import type { RadiobossCommand, RadiobossCommandStatus, RadiobossCommandType } from "../../types/domain";

type Requester = {
  requestedBy: string;
  requestedByName: string;
};

type BaseCommandInput = Requester & {
  priority?: RadiobossCommand["priority"];
};

const MAX_ATTEMPTS = 3;

export function getRadiobossCommandOccurrenceKey(scheduleId: string, plannedStartAt?: string): string {
  const date = plannedStartAt ? new Date(plannedStartAt) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return `${scheduleId}_${date.toISOString().slice(0, 10)}`;
  }

  return `${scheduleId}_${new Date().toISOString().slice(0, 10)}`;
}

function assertFirestoreAvailable() {
  if (shouldUseLocalFallback()) {
    throw new Error("Command RadioBOSS membutuhkan koneksi Firebase/Firestore aktif.");
  }
}

function compactPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function buildCommandPayload({
  type,
  payload,
  requestedBy,
  requestedByName,
  dedupeKey,
  priority = "normal"
}: BaseCommandInput & {
  type: RadiobossCommandType;
  payload: Record<string, unknown>;
  dedupeKey: string;
}) {
  return {
    type,
    status: "pending" as RadiobossCommandStatus,
    payload: compactPayload(payload),
    requestedBy,
    requestedByName,
    requestedAt: serverTimestamp(),
    priority,
    dedupeKey,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    lockedBy: null,
    lockedAt: null,
    executedAt: null,
    gatewayId: null,
    result: null,
    errorCode: null,
    errorMessageSafe: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

async function createRadiobossCommand(input: Parameters<typeof buildCommandPayload>[0]): Promise<string> {
  assertFirestoreAvailable();
  const ref = await addDoc(collection(getFirebaseFirestore(), "radiobossCommands"), buildCommandPayload(input));
  return ref.id;
}

export async function createStartRecordingCommand({
  programId,
  scheduleId,
  programName,
  announcerId,
  announcerName,
  announcerAirName,
  plannedStartAt,
  plannedEndAt,
  recordingId,
  source = "manual_admin_start",
  reason = "manual_admin_start",
  requestedBy,
  requestedByName
}: BaseCommandInput & {
  programId: string;
  scheduleId: string;
  programName?: string;
  announcerId?: string;
  announcerName?: string;
  announcerAirName?: string;
  plannedStartAt?: string;
  plannedEndAt?: string;
  recordingId?: string | null;
  source?: string;
  reason?: string;
}): Promise<string> {
  return createRadiobossCommand({
    type: "START_RECORDING",
    payload: {
      programId,
      scheduleId,
      programName,
      announcerId,
      announcerName,
      announcerAirName,
      plannedStartAt,
      plannedEndAt,
      recordingId: recordingId ?? null,
      source,
      reason
    },
    requestedBy,
    requestedByName,
    dedupeKey: `START_RECORDING_${getRadiobossCommandOccurrenceKey(scheduleId, plannedStartAt)}`
  });
}

export async function createStopRecordingCommand({
  recordingId,
  requestedBy,
  requestedByName
}: BaseCommandInput & {
  recordingId: string;
}): Promise<string> {
  return createRadiobossCommand({
    type: "STOP_RECORDING",
    payload: { recordingId, reason: "manual_admin_stop" },
    requestedBy,
    requestedByName,
    dedupeKey: `STOP_RECORDING_${recordingId}`
  });
}

export async function createMarkRecordingSkippedCommand({
  recordingId,
  programId,
  scheduleId,
  plannedStartAt,
  reason,
  requestedBy,
  requestedByName
}: BaseCommandInput & {
  recordingId?: string | null;
  programId: string;
  scheduleId: string;
  plannedStartAt?: string;
  reason: string;
}): Promise<string> {
  return createRadiobossCommand({
    type: "MARK_RECORDING_SKIPPED",
    payload: { recordingId: recordingId ?? null, programId, scheduleId, plannedStartAt, reason },
    requestedBy,
    requestedByName,
    dedupeKey: `MARK_RECORDING_SKIPPED_${getRadiobossCommandOccurrenceKey(scheduleId, plannedStartAt)}`
  });
}

export async function createRetryCommand({
  commandId,
  requestedBy,
  requestedByName
}: BaseCommandInput & {
  commandId: string;
}): Promise<string> {
  return createRadiobossCommand({
    type: "RETRY_COMMAND",
    payload: { commandId },
    requestedBy,
    requestedByName,
    dedupeKey: `RETRY_COMMAND_${commandId}_${Date.now()}`
  });
}

export async function createAddTrackToQueueCommand({
  requestId,
  trackId,
  filePath,
  title,
  artist,
  requesterName,
  requestedBy,
  requestedByName
}: BaseCommandInput & {
  requestId: string;
  trackId: string;
  filePath: string;
  title?: string;
  artist?: string;
  requesterName?: string;
}): Promise<string> {
  return createRadiobossCommand({
    type: "ADD_TRACK_TO_QUEUE",
    payload: { requestId, trackId, filePath, title, artist, requesterName },
    requestedBy,
    requestedByName,
    dedupeKey: `ADD_TRACK_TO_QUEUE_${requestId}`
  });
}

export function subscribeRecentRadiobossCommands(
  callback: (commands: RadiobossCommand[]) => void,
  statuses: RadiobossCommandStatus[] = ["pending", "retryable", "failed"]
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    callback([]);
    return () => undefined;
  }

  try {
    return onSnapshot(
      query(
        collection(getFirebaseFirestore(), "radiobossCommands"),
        where("status", "in", statuses)
      ),
      (snapshot) => {
        const commands = snapshot.docs
          .map((item) => {
            const data = item.data() as Omit<RadiobossCommand, "id">;
            return { ...data, id: item.id };
          })
          .sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")));
        callback(commands);
      },
      () => callback([])
    );
  } catch {
    callback([]);
    return () => undefined;
  }
}
