import { shouldUseLocalFallback } from "../../../lib/env";
import type { ListenerAnalyticsSession } from "../../../types/domain";
import {
  updateDocument,
  listDocuments,
  subscribeDocuments,
  upsertDocument
} from "../../../services/firestore.service";
import { where, orderBy, limit, type Unsubscribe } from "firebase/firestore";

const SESSIONS_LOCAL_KEY = "radiosbl_listener_sessions";
const SESSIONS_LOCAL_UPDATE_EVENT = "radiosbl:listener-sessions-updated";
const ACTIVE_SESSION_WINDOW_MS = 5 * 60 * 1000;
const ACTIVE_SESSIONS_READ_LIMIT = 200;
const HISTORICAL_SESSIONS_READ_LIMIT = 500;
type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };

function getActiveSessionLimitIso(): string {
  return new Date(Date.now() - ACTIVE_SESSION_WINDOW_MS).toISOString();
}

function filterActiveSessions(sessions: ListenerAnalyticsSession[]): ListenerAnalyticsSession[] {
  const limitTime = getActiveSessionLimitIso();
  return sessions.filter(
    (s) => s.status === "active" && s.lastSeenAt.toString() >= limitTime
  );
}

function removeUndefinedFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedFields(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, JsonLike | undefined>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, removeUndefinedFields(item)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLocalSessions(): ListenerAnalyticsSession[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(SESSIONS_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeLocalSessions(sessions: ListenerAnalyticsSession[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(SESSIONS_LOCAL_KEY, JSON.stringify(sessions.slice(0, 100)));
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event(SESSIONS_LOCAL_UPDATE_EVENT));
    }
  } catch (err) {
    console.warn("Gagal menyimpan sesi analytics lokal:", err);
  }
}

export async function trackStreamPlay(payload: {
  sessionId: string;
  userId?: string;
  anonymousId: string;
  deviceType: ListenerAnalyticsSession["device"]["type"];
  os: string;
  browser: string;
  programId?: string;
  programTitle?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  
  const session: ListenerAnalyticsSession = {
    id: payload.sessionId,
    userId: payload.userId,
    anonymousId: payload.anonymousId,
    startedAt: now,
    lastSeenAt: now,
    status: "active",
    source: "web-pwa",
    device: {
      type: payload.deviceType,
      os: payload.os,
      browser: payload.browser
    },
    program: {
      id: payload.programId,
      title: payload.programTitle
    },
    playback: {
      playCount: 1,
      pauseCount: 0,
      errorCount: 0,
      playDurationSeconds: 0,
      lastEvent: "play"
    },
    location: {
      permission: "unknown",
      source: "none"
    },
    privacy: {
      locationConsentVersion: "2026-05-31-v1",
      locationConsentText: "Lokasi digunakan untuk analisis internal stasiun SBL dan bersifat opsional.",
      preciseLocationEnabled: false
    },
    createdAt: now,
    updatedAt: now
  };

  const list = readLocalSessions();
  const filtered = list.filter((s) => s.id !== payload.sessionId);
  writeLocalSessions([session, ...filtered]);

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    // Gunakan upsert (setDoc merge) agar jika session ID sudah ada, ia me-replace datanya
    await upsertDocument("listenerAnalyticsSessions", payload.sessionId, removeUndefinedFields(session));
  } catch (err) {
    console.warn("Gagal mencatat trackStreamPlay ke Firestore, menggunakan lokal:", err);
  }
}

export async function trackStreamHeartbeat(params: {
  sessionId: string;
  additionalSeconds?: number;
}): Promise<void> {
  const now = new Date().toISOString();
  const seconds = params.additionalSeconds ?? 60;

  const list = readLocalSessions();
  const index = list.findIndex((s) => s.id === params.sessionId);
  if (index !== -1) {
    const current = list[index]!;
    list[index] = {
      ...current,
      lastSeenAt: now,
      status: "active",
      playback: {
        ...current.playback,
        playDurationSeconds: current.playback.playDurationSeconds + seconds,
        lastEvent: "heartbeat"
      },
      updatedAt: now
    };
    writeLocalSessions(list);
  }

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    // Menggunakan updateDocument biasa
    const listCurrent = readLocalSessions();
    const currentSession = listCurrent.find((s) => s.id === params.sessionId);
    if (currentSession) {
      await updateDocument("listenerAnalyticsSessions", params.sessionId, {
        lastSeenAt: now,
        status: "active",
        "playback.lastEvent": "heartbeat",
        "playback.playDurationSeconds": currentSession.playback.playDurationSeconds,
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn("Gagal mencatat heartbeat ke Firestore:", err);
  }
}

export async function trackStreamPause(sessionId: string): Promise<void> {
  const now = new Date().toISOString();

  const list = readLocalSessions();
  const index = list.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    const current = list[index]!;
    list[index] = {
      ...current,
      lastSeenAt: now,
      status: "paused",
      playback: {
        ...current.playback,
        pauseCount: current.playback.pauseCount + 1,
        lastEvent: "pause"
      },
      updatedAt: now
    };
    writeLocalSessions(list);
  }

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    const listCurrent = readLocalSessions();
    const currentSession = listCurrent.find((s) => s.id === sessionId);
    if (currentSession) {
      await updateDocument("listenerAnalyticsSessions", sessionId, {
        lastSeenAt: now,
        status: "paused",
        "playback.pauseCount": currentSession.playback.pauseCount,
        "playback.lastEvent": "pause",
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn("Gagal mencatat pause ke Firestore:", err);
  }
}

export async function trackStreamStop(sessionId: string): Promise<void> {
  const now = new Date().toISOString();

  const list = readLocalSessions();
  const index = list.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    const current = list[index]!;
    list[index] = {
      ...current,
      endedAt: now,
      status: "ended",
      playback: {
        ...current.playback,
        lastEvent: "stop"
      },
      updatedAt: now
    };
    writeLocalSessions(list);
  }

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    await updateDocument("listenerAnalyticsSessions", sessionId, {
      endedAt: now,
      status: "ended",
      "playback.lastEvent": "stop",
      updatedAt: now
    });
  } catch (err) {
    console.warn("Gagal mencatat stop ke Firestore:", err);
  }
}

export async function updateSessionLocation(params: {
  sessionId: string;
  permission: ListenerAnalyticsSession["location"]["permission"];
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}): Promise<void> {
  const now = new Date().toISOString();

  const list = readLocalSessions();
  const index = list.findIndex((s) => s.id === params.sessionId);
  if (index !== -1) {
    const current = list[index]!;
    list[index] = {
      ...current,
      location: {
        permission: params.permission,
        latitude: params.latitude,
        longitude: params.longitude,
        accuracy: params.accuracy,
        capturedAt: now,
        source: params.permission === "granted" ? "browser-geolocation" : "none"
      },
      privacy: {
        ...current.privacy,
        preciseLocationEnabled: params.permission === "granted"
      },
      updatedAt: now
    };
    writeLocalSessions(list);
  }

  if (shouldUseLocalFallback()) {
    return;
  }

  try {
    await updateDocument("listenerAnalyticsSessions", params.sessionId, {
      "location.permission": params.permission,
      "location.latitude": params.latitude ?? null,
      "location.longitude": params.longitude ?? null,
      "location.accuracy": params.accuracy ?? null,
      "location.capturedAt": now,
      "location.source": params.permission === "granted" ? "browser-geolocation" : "none",
      "privacy.preciseLocationEnabled": params.permission === "granted",
      updatedAt: now
    });
  } catch (err) {
    console.warn("Gagal memperbarui lokasi sesi di Firestore:", err);
  }
}

export async function listActiveSessions(): Promise<ListenerAnalyticsSession[]> {
  if (shouldUseLocalFallback()) {
    return filterActiveSessions(readLocalSessions());
  }

  try {
    const all = await listDocuments<ListenerAnalyticsSession>("listenerAnalyticsSessions", [
      where("status", "==", "active")
    ]);
    return filterActiveSessions(all);
  } catch {
    return filterActiveSessions(readLocalSessions());
  }
}

export function subscribeActiveSessions(
  onNext: (sessions: ListenerAnalyticsSession[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      onNext(filterActiveSessions(readLocalSessions()));
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    window.addEventListener(SESSIONS_LOCAL_UPDATE_EVENT, checkAndTrigger);
    // Interval check setiap 15 detik untuk memvalidasi timeout sesi aktif
    const intervalId = window.setInterval(checkAndTrigger, 15000);
    return () => {
      window.removeEventListener("storage", checkAndTrigger);
      window.removeEventListener(SESSIONS_LOCAL_UPDATE_EVENT, checkAndTrigger);
      window.clearInterval(intervalId);
    };
  }

  try {
    return subscribeDocuments<ListenerAnalyticsSession>(
      "listenerAnalyticsSessions",
      (docs) => {
        onNext(filterActiveSessions(docs));
      },
      () => {
        onNext(filterActiveSessions(readLocalSessions()));
      },
      [where("status", "==", "active"), limit(ACTIVE_SESSIONS_READ_LIMIT)]
    );
  } catch {
    const checkAndTrigger = () => {
      onNext(filterActiveSessions(readLocalSessions()));
    };
    checkAndTrigger();
    return () => {};
  }
}

export async function listAllSessions(): Promise<ListenerAnalyticsSession[]> {
  if (shouldUseLocalFallback()) {
    return readLocalSessions();
  }

  try {
    return await listDocuments<ListenerAnalyticsSession>("listenerAnalyticsSessions", [
      orderBy("startedAt", "desc"),
      limit(HISTORICAL_SESSIONS_READ_LIMIT)
    ]);
  } catch {
    return readLocalSessions();
  }
}
