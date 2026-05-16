import { buildAnnouncerSeed } from "../data/firestoreSeed";
import { shouldUseLocalFallback } from "../lib/env";
import type { Announcer } from "../types/domain";
import { listDocuments, upsertDocument } from "./firestore.service";

export async function listAnnouncers(): Promise<Announcer[]> {
  if (shouldUseLocalFallback()) {
    return buildAnnouncerSeed();
  }

  return listDocuments<Announcer>("announcers");
}

export async function saveAnnouncer(announcer: Announcer): Promise<string> {
  if (shouldUseLocalFallback()) {
    return announcer.id;
  }

  await upsertDocument<Announcer>("announcers", announcer.id, announcer);
  return announcer.id;
}
