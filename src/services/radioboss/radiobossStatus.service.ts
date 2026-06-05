import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getGatewayFirestore } from "../../lib/firebase";
import { shouldUseGatewayLocalFallback } from "../../lib/env";
import type { TimestampLike } from "../../types/domain";

export type RadioBossStatus = {
  gatewayId?: string;
  online?: boolean;
  gatewayOnline?: boolean;
  playerState?: string;
  radioBossOnline?: boolean;
  apiReachable?: boolean;
  playbackState?: string;
  recordingActive?: boolean;
  activeRecordingId?: string | null;
  lastSyncAt?: TimestampLike;
  lastHeartbeatAt?: TimestampLike;
  latencyMs?: number;
  lastError?: string | null;
  errorMessageSafe?: string | null;
  updatedAt?: TimestampLike;
};

export type RadioBossNowPlaying = {
  title?: string;
  artist?: string;
  rawTitle?: string;
  duration?: number;
  position?: number;
  progressPercent?: number;
  nextTitle?: string | null;
  nextArtist?: string | null;
  source?: string;
  updatedAt?: TimestampLike;
};

export type RadioBossGatewayHeartbeat = {
  gatewayId?: string;
  status?: "online" | "warning" | "offline" | string;
  lastSeenAt?: TimestampLike;
  lastHeartbeatAt?: TimestampLike;
  heartbeatIntervalSeconds?: number;
  version?: string;
  studioPc?: string;
  pcName?: string;
  lastError?: string | null;
  errorMessageSafe?: string | null;
  updatedAt?: TimestampLike;
};

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function formatRelativeTime(value: unknown, now = new Date()): string {
  const date = toDate(value);
  if (!date) return "Belum ada data";

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function resolveRadioBossOnline(status: RadioBossStatus | null): boolean {
  return status?.radioBossOnline ?? status?.online ?? false;
}

export function resolveGatewayOnline(
  status: RadioBossStatus | null,
  heartbeat: RadioBossGatewayHeartbeat | null = null,
  now = new Date()
): boolean {
  const heartbeatState = resolveHeartbeatState(heartbeat, now, status);
  if (heartbeatState !== "online") {
    return false;
  }

  return heartbeat?.status !== "offline" && status?.gatewayOnline !== false;
}

export function resolvePlaybackState(status: RadioBossStatus | null): string {
  return status?.playbackState ?? status?.playerState ?? "unknown";
}

export function getGatewayHeartbeatTime(
  heartbeat: RadioBossGatewayHeartbeat | null,
  status?: RadioBossStatus | null
): TimestampLike | null {
  return (
    heartbeat?.lastSeenAt ??
    heartbeat?.lastHeartbeatAt ??
    heartbeat?.updatedAt ??
    status?.lastHeartbeatAt ??
    status?.lastSyncAt ??
    status?.updatedAt ??
    null
  );
}

export function resolveHeartbeatState(
  heartbeat: RadioBossGatewayHeartbeat | null,
  now = new Date(),
  status?: RadioBossStatus | null
): "online" | "warning" | "offline" {
  const lastHeartbeatAt = toDate(getGatewayHeartbeatTime(heartbeat, status));
  if (!lastHeartbeatAt) return "offline";

  const intervalMs = Math.max(15, heartbeat?.heartbeatIntervalSeconds ?? 30) * 1000;
  const ageMs = now.getTime() - lastHeartbeatAt.getTime();

  if (ageMs <= intervalMs * 2) return "online";
  if (ageMs <= intervalMs * 4) return "warning";
  return "offline";
}

function subscribeSingleton<T>(
  collectionName: string,
  documentId: string,
  callback: (value: T | null) => void
): Unsubscribe {
  if (shouldUseGatewayLocalFallback()) {
    callback(null);
    return () => undefined;
  }

  try {
    return onSnapshot(
      doc(getGatewayFirestore(), collectionName, documentId),
      (snapshot) => callback(snapshot.exists() ? (snapshot.data() as T) : null),
      () => callback(null)
    );
  } catch {
    callback(null);
    return () => undefined;
  }
}

export function subscribeRadioBossStatus(callback: (status: RadioBossStatus | null) => void): Unsubscribe {
  return subscribeSingleton<RadioBossStatus>("radiobossStatus", "current", callback);
}

export function subscribeNowPlaying(callback: (nowPlaying: RadioBossNowPlaying | null) => void): Unsubscribe {
  return subscribeSingleton<RadioBossNowPlaying>("radiobossNowPlaying", "current", callback);
}

export function subscribeGatewayHeartbeat(
  gatewayId: string,
  callback: (heartbeat: RadioBossGatewayHeartbeat | null) => void
): Unsubscribe {
  return subscribeSingleton<RadioBossGatewayHeartbeat>("radiobossGatewayHeartbeat", gatewayId, callback);
}
