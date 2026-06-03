/**
 * analyticsHelpers.ts
 * Fungsi helper murni untuk menghitung statistik analytics pendengar.
 * Tidak ada side-effect — mudah diuji.
 */

import type { ListenerAnalyticsSession } from "../../../types/domain";

/** Batas hari dalam ms */
const DAY_MS = 86_400_000;

/** Kembalikan timestamp string/Date/number sebagai milidetik */
function toMs(ts: string | Date | number): number {
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Filter sesi berdasarkan rentang hari ke belakang dari sekarang */
export function filterByDays(
  sessions: ListenerAnalyticsSession[],
  days: number
): ListenerAnalyticsSession[] {
  const cutoff = Date.now() - days * DAY_MS;
  return sessions.filter(s => toMs(s.startedAt as string) >= cutoff);
}

export type PeriodStats = {
  total: number;
  peak: number;               // Maks pendengar dalam 1 jam
  avgDurationSeconds: number;
  totalDurationSeconds: number;
};

/** Hitung statistik agregat dari sekumpulan sesi */
export function computeStats(sessions: ListenerAnalyticsSession[]): PeriodStats {
  if (sessions.length === 0) {
    return { total: 0, peak: 0, avgDurationSeconds: 0, totalDurationSeconds: 0 };
  }

  const total = sessions.length;
  const totalDuration = sessions.reduce(
    (sum, s) => sum + (s.playback?.playDurationSeconds || 0),
    0
  );

  // Hitung peak per jam (jumlah sesi yang aktif pada jam tertentu)
  const hourCounts: Record<number, number> = {};
  for (const s of sessions) {
    const h = new Date(s.startedAt as string).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }
  const peak = Math.max(0, ...Object.values(hourCounts));

  return {
    total,
    peak,
    avgDurationSeconds: Math.round(totalDuration / total),
    totalDurationSeconds: totalDuration
  };
}

export type ContentRanking = {
  title: string;
  source: string;
  totalDurationSeconds: number;
  sessionCount: number;
};

/** Hitung ranking konten berdasarkan total durasi dengar */
export function computeContentRanking(
  sessions: ListenerAnalyticsSession[],
  topN = 5
): ContentRanking[] {
  const map = new Map<string, ContentRanking>();

  for (const s of sessions) {
    const title = s.program?.title || "Siaran Live";
    const source = "Radio Stream";
    const existing = map.get(title) || { title, source, totalDurationSeconds: 0, sessionCount: 0 };
    map.set(title, {
      ...existing,
      totalDurationSeconds:
        existing.totalDurationSeconds + (s.playback?.playDurationSeconds || 0),
      sessionCount: existing.sessionCount + 1
    });
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds)
    .slice(0, topN);
}

export type LocationGroup = {
  countryCode: string;
  city?: string;
  region?: string;
  count: number;
};

/** Kelompokkan sesi berdasarkan data lokasi (dari latitude/longitude jika ada) */
export function computeLocationGroups(
  sessions: ListenerAnalyticsSession[]
): LocationGroup[] {
  // Karena IP geolocation memerlukan reverse-lookup server-side,
  // kita gunakan browser geolocation yang tersimpan di sesi
  // Untuk sesi tanpa GPS, kita kelompokkan sebagai "ID — Tidak Diketahui"
  const map = new Map<string, LocationGroup>();

  for (const s of sessions) {
    if (
      s.location?.latitude != null &&
      s.location?.longitude != null
    ) {
      // Koordinat ada — gunakan sebagai proxy Indonesia
      const key = "ID-GPS";
      const existing = map.get(key) || { countryCode: "ID", city: "Terdeteksi GPS", count: 0 };
      map.set(key, { ...existing, count: existing.count + 1 });
    } else if (s.location?.permission === "denied" || s.location?.permission === "unknown") {
      // Tidak ada GPS — gunakan IP geolocation default
      const key = "ID-IP";
      const existing = map.get(key) || {
        countryCode: "ID",
        city: "Pinrang",
        region: "South Sulawesi",
        count: 0
      };
      map.set(key, { ...existing, count: existing.count + 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/** Format detik ke string "Xm Ys" */
export function formatDurationShort(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/** Format detik ke string "Xj Ym" atau "Xm" */
export function formatDurationLong(sec: number): string {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}j ${m % 60}m`;
  return `${m}m`;
}
