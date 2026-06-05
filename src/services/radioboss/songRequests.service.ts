import { orderBy, query, collection, getDocs, limit } from "firebase/firestore";
import { getGatewayFirestore } from "../../lib/firebase";
import { shouldUseGatewayLocalFallback } from "../../lib/env";
import type { AuthSession } from "../auth.service";
import type { MusicLibraryIndexTrack, SongRequest } from "../../types/domain";
import { updateSongRequestStatus } from "../songRequest.service";
import { createAddTrackToQueueCommand } from "./radiobossCommands.service";

function normalize(value = ""): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreTrack(request: SongRequest, track: MusicLibraryIndexTrack): number {
  const reqTitle = normalize(request.title);
  const reqArtist = normalize(request.artist);
  const trackTitle = normalize(track.normalizedTitle || track.title);
  const trackArtist = normalize(track.normalizedArtist || track.artist);

  let score = 0;
  if (reqTitle && trackTitle === reqTitle) score += 70;
  else if (reqTitle && trackTitle.includes(reqTitle)) score += 48;
  else if (reqTitle && reqTitle.includes(trackTitle)) score += 38;

  if (reqArtist && trackArtist === reqArtist) score += 30;
  else if (reqArtist && trackArtist.includes(reqArtist)) score += 18;

  return Math.min(100, score);
}

export async function findLibraryMatches(request: SongRequest): Promise<MusicLibraryIndexTrack[]> {
  if (shouldUseGatewayLocalFallback()) return [];

  const snapshot = await getDocs(
    query(collection(getGatewayFirestore(), "musicLibraryIndex"), orderBy("title"), limit(200))
  );

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<MusicLibraryIndexTrack, "id">) }))
    .map((track) => ({ ...track, confidence: scoreTrack(request, track) }))
    .filter((track) => track.confidence > 0)
    .sort((left, right) => (right.confidence ?? 0) - (left.confidence ?? 0))
    .slice(0, 5);
}

export async function matchSongRequestToLibrary(request: SongRequest): Promise<SongRequest> {
  const matches = await findLibraryMatches(request);
  const best = matches[0];
  const confidence = Number((best as MusicLibraryIndexTrack & { confidence?: number })?.confidence ?? 0);

  if (!best) {
    return updateSongRequestStatus(request, "needs_review", {
      matchStatus: "not_found",
      matchedTrackId: null,
      matchedFilePath: null,
      confidence: 0
    });
  }

  if (confidence >= 80 && matches.length === 1) {
    return updateSongRequestStatus(request, "matched", {
      matchStatus: "matched",
      matchedTrackId: best.id,
      matchedFilePath: best.filePath,
      confidence
    });
  }

  return updateSongRequestStatus(request, "needs_review", {
    matchStatus: "ambiguous",
    matchedTrackId: best.id,
    matchedFilePath: best.filePath,
    confidence
  });
}

export async function rejectSongRequest(
  request: SongRequest,
  session: AuthSession | null,
  reason: string
): Promise<SongRequest> {
  return updateSongRequestStatus(request, "rejected", {
    rejectedBy: session?.user.id ?? null,
    rejectedAt: new Date().toISOString(),
    rejectReason: reason || "Ditolak operator"
  });
}

export async function markSongRequestPlayed(request: SongRequest): Promise<SongRequest> {
  return updateSongRequestStatus(request, "played", {
    playedAt: new Date().toISOString()
  });
}

export async function sendSongRequestToRadioBoss(
  request: SongRequest,
  session: AuthSession | null
): Promise<SongRequest> {
  const filePath = request.matchedFilePath;
  const trackId = request.matchedTrackId;

  if (!filePath || !trackId) {
    throw new Error("Request belum punya file library yang valid.");
  }

  await createAddTrackToQueueCommand({
    requestId: request.id,
    trackId,
    filePath,
    title: request.title,
    artist: request.artist,
    requesterName: request.requesterName,
    requestedBy: session?.user.id ?? "unknown",
    requestedByName: session?.user.displayName || session?.user.email || "Operator Radio SBL"
  });

  return updateSongRequestStatus(request, "sent_to_radioboss", {
    sentToRadioBossAt: new Date().toISOString()
  });
}
