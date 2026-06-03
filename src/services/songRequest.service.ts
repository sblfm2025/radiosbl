import { stationInfo, type AnnouncerProfile } from "../data/radioData";
import { shouldUseLocalFallback } from "../lib/env";
import type { SongRequest } from "../types/domain";
import {
  createDocument,
  listDocuments,
  subscribeDocuments,
  updateDocument
} from "./firestore.service";
import {
  buildWhatsAppDeepLink,
  sendWhatsAppNotification
} from "./whatsappNotification.service";

const SONG_REQUESTS_KEY = "radio-sbl-song-requests";
const MAX_LOCAL_REQUESTS = 25;

export type SongRequestInput = {
  requesterName: string;
  requesterWhatsapp?: string;
  artist?: string;
  title: string;
  message?: string;
  announcer?: AnnouncerProfile | null;
  programTitle: string;
};

export type SongRequestStatus = SongRequest["status"];

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readSongRequests(): SongRequest[] {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(SONG_REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as SongRequest[]) : [];
  } catch {
    return [];
  }
}

function writeSongRequests(requests: SongRequest[]) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(SONG_REQUESTS_KEY, JSON.stringify(requests.slice(0, MAX_LOCAL_REQUESTS)));
}

function updateLocalSongRequestStatus(id: string, status: SongRequestStatus): SongRequest | null {
  const requests = readSongRequests();
  let updated: SongRequest | null = null;
  const nextRequests = requests.map((request) => {
    if (request.id !== id) {
      return request;
    }

    updated = {
      ...request,
      status
    };
    return updated;
  });

  writeSongRequests(nextRequests);
  return updated;
}

function updateLocalSongRequest(id: string, patch: Partial<SongRequest>): SongRequest | null {
  const requests = readSongRequests();
  let updated: SongRequest | null = null;
  const nextRequests = requests.map((request) => {
    if (request.id !== id) {
      return request;
    }

    updated = {
      ...request,
      ...patch
    };
    return updated;
  });

  writeSongRequests(nextRequests);
  return updated;
}

function toFirestoreSongRequest(request: SongRequest): Omit<SongRequest, "id"> {
  return {
    requesterName: request.requesterName,
    ...(request.requesterWhatsapp ? { requesterWhatsapp: request.requesterWhatsapp } : {}),
    ...(request.artist ? { artist: request.artist } : {}),
    title: request.title,
    ...(request.message ? { message: request.message } : {}),
    ...(request.announcerName ? { announcerName: request.announcerName } : {}),
    ...(request.announcerWhatsapp ? { announcerWhatsapp: request.announcerWhatsapp } : {}),
    status: request.status,
    matchStatus: request.matchStatus ?? "unmatched",
    matchedTrackId: request.matchedTrackId ?? null,
    matchedFilePath: request.matchedFilePath ?? null,
    confidence: request.confidence ?? 0,
    approvedBy: request.approvedBy ?? null,
    approvedAt: request.approvedAt ?? null,
    sentToRadioBossAt: request.sentToRadioBossAt ?? null,
    queuedAt: request.queuedAt ?? null,
    playedAt: request.playedAt ?? null,
    rejectedBy: request.rejectedBy ?? null,
    rejectedAt: request.rejectedAt ?? null,
    rejectReason: request.rejectReason ?? null,
    expiresAt: request.expiresAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    notificationText: request.notificationText,
    ...(request.whatsappUrl ? { whatsappUrl: request.whatsappUrl } : {})
  };
}


function buildRequestText(input: SongRequestInput): string {
  const song = [input.artist?.trim(), input.title.trim()].filter(Boolean).join(" - ");
  const requester = input.requesterName.trim() || "Pendengar Radio SBL";
  const note = input.message?.trim() ? `\nCatatan: ${input.message.trim()}` : "";

  return [
    "Request lagu Radio SBL",
    `Program: ${input.programTitle}`,
    `Lagu: ${song}`,
    `Dari: ${requester}`,
    input.requesterWhatsapp?.trim() ? `WA pendengar: ${input.requesterWhatsapp.trim()}` : "",
    note
  ]
    .filter(Boolean)
    .join("\n");
}

export function createSongRequestDraft(input: SongRequestInput): SongRequest {
  const notificationText = buildRequestText(input);
  const announcerWhatsapp = input.announcer?.whatsapp || stationInfo.phone;
  const whatsappUrl = buildWhatsAppDeepLink({
    to: announcerWhatsapp,
    text: notificationText
  });

  return {
    id: `song-request-${Date.now()}`,
    requesterName: input.requesterName.trim() || "Pendengar Radio SBL",
    requesterWhatsapp: input.requesterWhatsapp?.trim() || undefined,
    artist: input.artist?.trim() || undefined,
    title: input.title.trim(),
    message: input.message?.trim() || undefined,
    announcerName: input.announcer?.airName,
    announcerWhatsapp,
    status: whatsappUrl ? "notified" : "new",
    matchStatus: "unmatched",
    matchedTrackId: null,
    matchedFilePath: null,
    confidence: 0,
    approvedBy: null,
    approvedAt: null,
    sentToRadioBossAt: null,
    queuedAt: null,
    playedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    notificationText,
    whatsappUrl,
    notificationDelivered: false
  };
}

export function saveSongRequest(input: SongRequestInput): SongRequest {
  if (!input.title.trim()) {
    throw new Error("Judul lagu wajib diisi.");
  }

  const request = createSongRequestDraft(input);
  writeSongRequests([request, ...readSongRequests()]);
  return request;
}

export function listLocalSongRequests(): SongRequest[] {
  return readSongRequests();
}

export async function submitSongRequest(input: SongRequestInput): Promise<SongRequest> {
  if (shouldUseLocalFallback()) {
    return saveSongRequest(input);
  }

  if (!input.title.trim()) {
    throw new Error("Judul lagu wajib diisi.");
  }

  const request = createSongRequestDraft(input);
  let id = request.id;

  try {
    id = await createDocument<Omit<SongRequest, "id">>(
      "songRequests",
      toFirestoreSongRequest(request)
    );
  } catch {
    writeSongRequests([request, ...readSongRequests()]);
  }

  const savedRequest = {
    ...request,
    id
  };

  const notification = await sendWhatsAppNotification({
    to: savedRequest.announcerWhatsapp,
    text: savedRequest.notificationText
  });

  return {
    ...savedRequest,
    status: notification.delivered ? "notified" : savedRequest.status,
    notificationDelivered: notification.delivered
  };
}

export async function listSongRequests(): Promise<SongRequest[]> {
  if (shouldUseLocalFallback()) {
    return listLocalSongRequests();
  }

  try {
    return await listDocuments<SongRequest>("songRequests");
  } catch {
    return listLocalSongRequests();
  }
}

export function subscribeSongRequests(
  onChange: (requests: SongRequest[]) => void
): () => void {
  if (shouldUseLocalFallback()) {
    onChange(listLocalSongRequests());
    return () => undefined;
  }

  try {
    return subscribeDocuments<SongRequest>(
      "songRequests",
      onChange,
      () => onChange(listLocalSongRequests())
    );
  } catch {
    onChange(listLocalSongRequests());
    return () => undefined;
  }
}

export async function updateSongRequestStatus(
  request: SongRequest,
  status: SongRequestStatus,
  patch: Partial<SongRequest> = {}
): Promise<SongRequest> {
  const updatedPatch = {
    ...patch,
    status,
    updatedAt: new Date().toISOString()
  };

  if (shouldUseLocalFallback()) {
    return updateLocalSongRequest(request.id, updatedPatch) ?? { ...request, ...updatedPatch };
  }

  try {
    await updateDocument<Partial<SongRequest>>("songRequests", request.id, updatedPatch);
    return {
      ...request,
      ...updatedPatch
    };
  } catch {
    return updateLocalSongRequest(request.id, updatedPatch) ?? { ...request, ...updatedPatch };
  }
}
