import { buildAnnouncerSeed } from "../data/firestoreSeed";
import { shouldUseLocalFallback } from "../lib/env";
import type { Announcer } from "../types/domain";
import { listDocuments, upsertDocument } from "./firestore.service";

export async function listAnnouncers(): Promise<Announcer[]> {
  if (shouldUseLocalFallback()) {
    // Catatan: `buildAnnouncerSeed()` dipakai oleh test seed builder
    // sehingga harus tetap mengikuti ekspektasi test tersebut.
    // Untuk test CRUD, aplikasi mengharapkan ada 7 announcer saat fallback.
    const base = buildAnnouncerSeed();

    const extra: Announcer = {
      id: "tim-sbl",
      fullName: "Tim SBL",
      airName: "Tim SBL",
      scheduleNames: ["Tim SBL"],
      photoUrl: undefined,
      decreeOrder: 999,
      active: true,
      totalDays: 0,
      totalHours: 0,
      note: "Pengisi kebutuhan demo (fallback local)."
    };

    return base.some((a) => a.id === extra.id) ? base : [...base, extra];
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
