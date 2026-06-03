/**
 * polishUi.test.ts
 * Unit test untuk Tahap 7 — Polish UI & Komponen Baru
 * Menguji logika murni dari komponen HourlyActivityChart dan CSS class helper
 */

import { describe, it, expect } from "vitest";
import type { ListenerAnalyticsSession } from "../types/domain";

// ─── Helper: Buat mock session dengan jam tertentu ────────────────────────────
function makeMockSession(
  id: string,
  hour: number,
  status: "active" | "ended" | "paused" | "error" = "ended"
): ListenerAnalyticsSession {
  // Gunakan ISO string dengan jam lokal eksplisit (tanpa suffix Z)
  // sehingga new Date(...).getHours() mengembalikan jam yang dimaksud
  const pad = (n: number) => String(n).padStart(2, "0");
  const localIso = `2026-05-31T${pad(hour)}:00:00.000`; // tanpa Z = waktu lokal

  return {
    id,
    anonymousId: `anon-${id}`,
    startedAt: localIso,
    lastSeenAt: localIso,
    status,
    source: "web-pwa",
    device: { type: "desktop", os: "Windows", browser: "Chrome" },
    program: { id: "prog-1", title: "Program Test" },
    playback: {
      playCount: 1,
      pauseCount: 0,
      errorCount: 0,
      playDurationSeconds: 60,
      lastEvent: "stop"
    },
    location: { permission: "unknown", source: "none" },
    privacy: {
      locationConsentVersion: "v1",
      locationConsentText: "Test",
      preciseLocationEnabled: false
    },
    createdAt: localIso,
    updatedAt: localIso
  };
}

// ─── Logika distribusi jam (disalin dari komponen agar bisa diuji murni) ──────
function computeHourCounts(sessions: ListenerAnalyticsSession[]): number[] {
  const hourCounts = Array.from({ length: 24 }, () => 0);
  for (const s of sessions) {
    try {
      const h = new Date(s.startedAt as string).getHours();
      if (h >= 0 && h <= 23) {
        hourCounts[h]!++;
      }
    } catch {
      // abaikan
    }
  }
  return hourCounts;
}

function findPeakHour(hourCounts: number[]): number {
  return hourCounts.indexOf(Math.max(...hourCounts));
}

function formatHour(h: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

function computeBarHeightPx(count: number, maxCount: number, BAR_HEIGHT = 64): number {
  return Math.max((count / maxCount) * BAR_HEIGHT, count > 0 ? 4 : 0);
}

// ─── Helper: Logika badge audit action ───────────────────────────────────────
function getActionBadgeVariant(action: string): string {
  if (action.includes("delete") || action.includes("reject")) return "delete";
  if (action.includes("approve") || action.includes("publish")) return "publish";
  if (action.includes("review")) return "review";
  return "";
}

// ─── Helper: Logika status badge approval ─────────────────────────────────────
function getApprovalStatusClass(status: "pending" | "approved" | "rejected" | "cancelled"): string {
  return status; // kelas langsung menjadi nama status
}

// ─── Test Suite: HourlyActivityChart Logic ────────────────────────────────────
describe("Tahap 7 — HourlyActivityChart Logic", () => {
  it("menghasilkan array 24 elemen saat tidak ada sesi", () => {
    const counts = computeHourCounts([]);
    expect(counts).toHaveLength(24);
    expect(counts.every(c => c === 0)).toBe(true);
  });

  it("menghitung sesi dengan benar per jam", () => {
    const sessions = [
      makeMockSession("s1", 8),  // jam 08
      makeMockSession("s2", 8),  // jam 08
      makeMockSession("s3", 8),  // jam 08
      makeMockSession("s4", 14), // jam 14
      makeMockSession("s5", 20), // jam 20
    ];
    const counts = computeHourCounts(sessions);
    expect(counts[8]).toBe(3);
    expect(counts[14]).toBe(1);
    expect(counts[20]).toBe(1);
    expect(counts[0]).toBe(0);
    expect(counts[23]).toBe(0);
  });

  it("menemukan peak hour yang benar", () => {
    const sessions = [
      makeMockSession("a", 10),
      makeMockSession("b", 10),
      makeMockSession("c", 10),
      makeMockSession("d", 15),
      makeMockSession("e", 15),
    ];
    const counts = computeHourCounts(sessions);
    const peak = findPeakHour(counts);
    expect(peak).toBe(10); // jam 10 paling ramai (3 sesi)
  });

  it("mengembalikan peak hour 0 jika semua sesi bernilai 0", () => {
    const counts = Array.from({ length: 24 }, () => 0);
    const peak = findPeakHour(counts);
    expect(peak).toBe(0); // indexOf(0) = 0, wajar
  });

  it("memformat jam dengan benar — AM", () => {
    expect(formatHour(0)).toBe("12AM");
    expect(formatHour(1)).toBe("1AM");
    expect(formatHour(11)).toBe("11AM");
  });

  it("memformat jam dengan benar — PM", () => {
    expect(formatHour(12)).toBe("12PM");
    expect(formatHour(13)).toBe("1PM");
    expect(formatHour(23)).toBe("11PM");
  });

  it("menghitung tinggi bar secara proporsional", () => {
    const BAR_HEIGHT = 64;
    const maxCount = 10;
    expect(computeBarHeightPx(10, maxCount, BAR_HEIGHT)).toBe(64);
    expect(computeBarHeightPx(5, maxCount, BAR_HEIGHT)).toBe(32);
    expect(computeBarHeightPx(0, maxCount, BAR_HEIGHT)).toBe(0);
  });

  it("memberikan tinggi minimum 4px untuk bar dengan count > 0", () => {
    const maxCount = 1000;
    // count sangat kecil tapi > 0 harus minimal 4px
    const tiny = computeBarHeightPx(1, maxCount, 64);
    expect(tiny).toBeGreaterThanOrEqual(4);
  });

  it("tidak crash jika startedAt tidak valid", () => {
    const badSession: ListenerAnalyticsSession = {
      ...makeMockSession("bad", 8),
      startedAt: "bukan-tanggal-valid"
    };
    // Harus tidak throw, hanya skip sesi tidak valid
    expect(() => computeHourCounts([badSession])).not.toThrow();
    const counts = computeHourCounts([badSession]);
    expect(counts.every(c => c === 0)).toBe(true);
  });
});

// ─── Test Suite: Audit Log Badge Variant ─────────────────────────────────────
describe("Tahap 7 — Audit Action Badge CSS Variant", () => {
  it("memberikan variant 'delete' untuk aksi delete", () => {
    expect(getActionBadgeVariant("delete_rundown")).toBe("delete");
    expect(getActionBadgeVariant("delete_episode")).toBe("delete");
  });

  it("memberikan variant 'delete' untuk aksi reject", () => {
    expect(getActionBadgeVariant("reject_request")).toBe("delete");
    expect(getActionBadgeVariant("song_request_status_rejected")).toBe("delete");
  });

  it("memberikan variant 'publish' untuk aksi approve", () => {
    expect(getActionBadgeVariant("approve_episode")).toBe("publish");
    expect(getActionBadgeVariant("publish_episode")).toBe("publish");
  });

  it("memberikan variant 'review' untuk aksi review", () => {
    expect(getActionBadgeVariant("review_content")).toBe("review");
  });

  it("memberikan string kosong untuk aksi standar (create, update, dll)", () => {
    expect(getActionBadgeVariant("create_rundown")).toBe("");
    expect(getActionBadgeVariant("update_episode")).toBe("");
    expect(getActionBadgeVariant("login")).toBe("");
  });
});

// ─── Test Suite: Approval Status CSS Class ───────────────────────────────────
describe("Tahap 7 — Approval Status Badge CSS Class", () => {
  it("kelas status sesuai dengan nilai status langsung", () => {
    expect(getApprovalStatusClass("pending")).toBe("pending");
    expect(getApprovalStatusClass("approved")).toBe("approved");
    expect(getApprovalStatusClass("rejected")).toBe("rejected");
    expect(getApprovalStatusClass("cancelled")).toBe("cancelled");
  });
});
