import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe
} from "firebase/firestore";
import { getFirebaseFirestore } from "../../lib/firebase";
import { shouldUseLocalFallback } from "../../lib/env";
import type { ProgramRecordingRule } from "../../types/domain";

export const DEFAULT_RECORDING_RULE: Omit<
  ProgramRecordingRule,
  "programId" | "programName" | "folderSlug" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy"
> = {
  recordingEnabled: false,
  requireAttendance: true,
  autoStart: true,
  autoStop: true,
  allowManualOverride: true,
  startGraceMinutes: 15,
  stopGraceMinutes: 10,
  maxOverrunMinutes: 30,
  minDurationMinutes: 5,
  format: "mp3",
  storageRootKey: "RADIO_SBL_RECORDING_ROOT"
};

export function slugifyRecordingValue(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function getProgramRecordingRuleId(programName: string): string {
  return slugifyRecordingValue(programName).toLowerCase().replace(/_/g, "-") || "program";
}

export function getRecordingRuleDocumentId(rule: Pick<ProgramRecordingRule, "programId" | "scheduleId">): string {
  return rule.scheduleId || rule.programId;
}

export function buildDefaultRecordingRule(programName: string): ProgramRecordingRule {
  const programId = getProgramRecordingRuleId(programName);
  return {
    ...DEFAULT_RECORDING_RULE,
    programId,
    programName,
    folderSlug: slugifyRecordingValue(programName)
  };
}

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

export async function getProgramRecordingRule(programId: string): Promise<ProgramRecordingRule | null> {
  if (shouldUseLocalFallback()) return null;

  const snapshot = await getDoc(doc(getFirebaseFirestore(), "programRecordingRules", programId));
  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as ProgramRecordingRule)
  };
}

export async function upsertProgramRecordingRule(
  ruleId: string,
  data: ProgramRecordingRule,
  actor?: { uid?: string }
): Promise<void> {
  const ruleData = stripUndefinedFields({ ...data });
  delete ruleData.id;
  const ruleRef = doc(getFirebaseFirestore(), "programRecordingRules", ruleId);
  const existing = await getDoc(ruleRef);
  const payload = stripUndefinedFields({
    ...(!existing.exists() ? {
      createdAt: serverTimestamp(),
      ...(actor?.uid ? { createdBy: actor.uid } : {})
    } : {}),
    ...ruleData,
    programId: data.programId,
    updatedAt: serverTimestamp(),
    ...(actor?.uid ? { updatedBy: actor.uid } : {})
  });

  await setDoc(
    ruleRef,
    payload,
    { merge: true }
  );
}

export function subscribeProgramRecordingRules(
  callback: (rules: ProgramRecordingRule[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    callback([]);
    return () => undefined;
  }

  try {
    return onSnapshot(
      query(collection(getFirebaseFirestore(), "programRecordingRules"), orderBy("programName")),
      (snapshot) => {
        callback(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as ProgramRecordingRule)
          }))
        );
      },
      () => callback([])
    );
  } catch {
    callback([]);
    return () => undefined;
  }
}
