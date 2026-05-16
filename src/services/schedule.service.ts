import type { BroadcastProgram, BroadcastSchedule, ScheduleSwapRequest } from "../types/domain";
import { shouldUseLocalFallback } from "../lib/env";
import { buildProgramSeed, buildScheduleSeed } from "../data/firestoreSeed";
import { createDocument, listDocuments, upsertDocument } from "./firestore.service";

export async function listPrograms(): Promise<BroadcastProgram[]> {
  if (shouldUseLocalFallback()) {
    return buildProgramSeed();
  }

  return listDocuments<BroadcastProgram>("broadcastPrograms");
}

export async function listSchedules(): Promise<BroadcastSchedule[]> {
  if (shouldUseLocalFallback()) {
    return buildScheduleSeed();
  }

  return listDocuments<BroadcastSchedule>("broadcastSchedules");
}

export async function saveProgram(program: BroadcastProgram): Promise<string> {
  if (shouldUseLocalFallback()) {
    return program.id;
  }

  await upsertDocument<BroadcastProgram>("broadcastPrograms", program.id, program);
  return program.id;
}

export async function saveSchedule(schedule: BroadcastSchedule): Promise<string> {
  if (shouldUseLocalFallback()) {
    return schedule.id;
  }

  await upsertDocument<BroadcastSchedule>("broadcastSchedules", schedule.id, schedule);
  return schedule.id;
}

export async function requestScheduleSwap(
  payload: Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt">
) {
  if (shouldUseLocalFallback()) {
    return Promise.resolve("demo-schedule-swap-request");
  }

  const { serverTimestamp } = await import("firebase/firestore");
  return createDocument<Omit<ScheduleSwapRequest, "id">>("scheduleSwapRequests", {
    ...payload,
    status: "pending_target",
    createdAt: serverTimestamp() as any
  });
}
