import type { LiveEvent } from "../types/domain";
import { shouldUseLocalFallback } from "../lib/env";
import { createDocument, listDocuments, subscribeDocuments } from "./firestore.service";

const LIVE_EVENTS_KEY = "radio-sbl-live-events";
const MAX_LOCAL_EVENTS = 30;

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

function readLocalLiveEvents(): LiveEvent[] {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(LIVE_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as LiveEvent[]) : [];
  } catch {
    return [];
  }
}

function writeLocalLiveEvents(events: LiveEvent[]) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(LIVE_EVENTS_KEY, JSON.stringify(events.slice(0, MAX_LOCAL_EVENTS)));
}

export function listLocalLiveEvents(): LiveEvent[] {
  return readLocalLiveEvents();
}

export function buildLiveEventDraft(
  payload: Omit<LiveEvent, "id" | "status" | "crewIds">
): LiveEvent {
  if (!payload.title.trim()) {
    throw new Error("Judul event Live/OB wajib diisi.");
  }

  return {
    id: `live-event-${Date.now()}`,
    title: payload.title.trim(),
    location: payload.location.trim() || "Lokasi belum ditentukan",
    startsAt: payload.startsAt,
    youtubeUrl: payload.youtubeUrl?.trim() || undefined,
    discordRoomUrl: payload.discordRoomUrl?.trim() || undefined,
    crewIds: [],
    status: "ready"
  };
}

export async function listLiveEvents(): Promise<LiveEvent[]> {
  if (shouldUseLocalFallback()) {
    return listLocalLiveEvents();
  }

  try {
    return await listDocuments<LiveEvent>("liveEvents");
  } catch {
    return listLocalLiveEvents();
  }
}

export function subscribeLiveEvents(onChange: (events: LiveEvent[]) => void): () => void {
  if (shouldUseLocalFallback()) {
    onChange(listLocalLiveEvents());
    return () => undefined;
  }

  try {
    return subscribeDocuments<LiveEvent>(
      "liveEvents",
      onChange,
      () => onChange(listLocalLiveEvents())
    );
  } catch {
    onChange(listLocalLiveEvents());
    return () => undefined;
  }
}

export async function createLiveEvent(payload: Omit<LiveEvent, "id">): Promise<string> {
  if (shouldUseLocalFallback()) {
    const event = {
      id: `live-event-${Date.now()}`,
      ...payload
    };
    writeLocalLiveEvents([event, ...readLocalLiveEvents()]);
    return event.id;
  }

  try {
    return await createDocument<Omit<LiveEvent, "id">>("liveEvents", payload);
  } catch {
    const event = {
      id: `live-event-${Date.now()}`,
      ...payload
    };
    writeLocalLiveEvents([event, ...readLocalLiveEvents()]);
    return event.id;
  }
}

export async function createLiveEventFromDraft(
  input: Omit<LiveEvent, "id" | "status" | "crewIds">
): Promise<LiveEvent> {
  const event = buildLiveEventDraft(input);
  const payload: Omit<LiveEvent, "id"> = {
    title: event.title,
    location: event.location,
    startsAt: event.startsAt,
    youtubeUrl: event.youtubeUrl,
    discordRoomUrl: event.discordRoomUrl,
    crewIds: event.crewIds,
    status: event.status
  };
  const id = await createLiveEvent(payload);

  return {
    ...event,
    id
  };
}
