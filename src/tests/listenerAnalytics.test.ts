import { describe, it, expect, beforeEach } from "vitest";
import { getDeviceInfo } from "../features/analytics/utils/deviceInfo";
import {
  trackStreamPlay,
  trackStreamHeartbeat,
  trackStreamPause,
  trackStreamStop,
  listActiveSessions,
  readLocalSessions,
  writeLocalSessions
} from "../features/analytics/services/listenerAnalytics.service";
import { listStreamingErrors } from "../features/analytics/services/streamingError.service";
import type { ListenerAnalyticsSession } from "../types/domain";

// Mock localStorage globally for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });
Object.defineProperty(global, "window", {
  value: {
    localStorage: localStorageMock
  },
  writable: true
});

describe("Listener Analytics - Device Parser", () => {
  it("should parse Windows Chrome user agent correctly", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const device = getDeviceInfo(ua);
    expect(device.type).toBe("desktop");
    expect(device.os).toBe("Windows");
    expect(device.browser).toBe("Chrome");
  });

  it("should parse iPhone Safari user agent correctly", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const device = getDeviceInfo(ua);
    expect(device.type).toBe("mobile");
    expect(device.os).toBe("iOS");
    expect(device.browser).toBe("Safari");
  });

  it("should parse iPad Safari user agent correctly", () => {
    const ua = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const device = getDeviceInfo(ua);
    expect(device.type).toBe("tablet");
    expect(device.os).toBe("iOS");
    expect(device.browser).toBe("Safari");
  });

  it("should parse Android Firefox user agent correctly", () => {
    const ua = "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/115.0";
    const device = getDeviceInfo(ua);
    expect(device.type).toBe("mobile");
    expect(device.os).toBe("Android");
    expect(device.browser).toBe("Firefox");
  });
});

describe("Listener Analytics - Local Sessions Storage Service", () => {
  const sessionId = "test-session-xyz-123";

  beforeEach(() => {
    localStorage.clear();
  });

  it("should save play session to local storage fallback", async () => {
    await trackStreamPlay({
      sessionId,
      userId: "user-999",
      anonymousId: "anon-456",
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome",
      programId: "selamat-pagi",
      programTitle: "Selamat Pagi Pinrang"
    });

    const sessions = readLocalSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].id).toBe(sessionId);
    expect(sessions[0].status).toBe("active");
    expect(sessions[0].userId).toBe("user-999");
    expect(sessions[0].program?.title).toBe("Selamat Pagi Pinrang");
    expect(sessions[0].playback.playDurationSeconds).toBe(0);
  });

  it("should update session duration on heartbeat", async () => {
    // Jalankan play sesi pertama kali
    await trackStreamPlay({
      sessionId,
      userId: "user-999",
      anonymousId: "anon-456",
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome"
    });

    // Panggil heartbeat untuk menambah durasi dengar
    await trackStreamHeartbeat({
      sessionId,
      additionalSeconds: 60
    });

    const sessions = readLocalSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].id).toBe(sessionId);
    expect(sessions[0].playback.playDurationSeconds).toBe(60);
    expect(sessions[0].playback.lastEvent).toBe("heartbeat");
  });

  it("should mark session as paused on trackStreamPause", async () => {
    await trackStreamPlay({
      sessionId,
      userId: "user-999",
      anonymousId: "anon-456",
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome"
    });

    await trackStreamPause(sessionId);

    const sessions = readLocalSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].status).toBe("paused");
    expect(sessions[0].playback.pauseCount).toBe(1);
    expect(sessions[0].playback.lastEvent).toBe("pause");
  });

  it("should mark session as ended on trackStreamStop", async () => {
    await trackStreamPlay({
      sessionId,
      userId: "user-999",
      anonymousId: "anon-456",
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome"
    });

    await trackStreamStop(sessionId);

    const sessions = readLocalSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].status).toBe("ended");
    expect(sessions[0].playback.lastEvent).toBe("stop");
  });

  it("should count active sessions within 5 minute heartbeat window", async () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 4 * 60 * 1000).toISOString();
    const stale = new Date(now.getTime() - 6 * 60 * 1000).toISOString();
    const makeSession = (id: string, lastSeenAt: string): ListenerAnalyticsSession => ({
      id,
      anonymousId: `anon-${id}`,
      startedAt: lastSeenAt,
      lastSeenAt,
      status: "active",
      source: "web-pwa",
      device: { type: "desktop", os: "Windows", browser: "Chrome" },
      playback: {
        playCount: 1,
        pauseCount: 0,
        errorCount: 0,
        playDurationSeconds: 30,
        lastEvent: "heartbeat"
      },
      location: { permission: "unknown", source: "none" },
      privacy: {
        locationConsentVersion: "v1",
        locationConsentText: "Test",
        preciseLocationEnabled: false
      },
      createdAt: lastSeenAt,
      updatedAt: lastSeenAt
    });

    writeLocalSessions([
      makeSession("recent-active", recent),
      makeSession("stale-active", stale)
    ]);

    const active = await listActiveSessions();
    expect(active.map((item) => item.id)).toEqual(["recent-active"]);
  });

  it("should normalize streaming errors with missing timestamps", async () => {
    localStorage.setItem("radiosbl_streaming_errors", JSON.stringify([
      {
        id: "broken-error",
        event: "media_error",
        message: "Gagal decode",
        browser: "Chrome",
        os: "Windows",
        createdAt: null
      }
    ]));

    const errors = await listStreamingErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].createdAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(errors[0].createdAt as string))).toBe(false);
  });
});
