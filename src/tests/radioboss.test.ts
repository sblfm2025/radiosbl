import { describe, expect, it } from "vitest";
import { getRadiobossCommandOccurrenceKey } from "../services/radioboss/radiobossCommands.service";
import { getRecordingRuleDocumentId } from "../services/radioboss/recordingRules.service";
import {
  getGatewayHeartbeatTime,
  resolveGatewayOnline,
  resolveHeartbeatState
} from "../services/radioboss/radiobossStatus.service";
import type { ProgramRecordingRule } from "../types/domain";

describe("RadioBOSS integration helpers", () => {
  const now = new Date("2026-06-03T08:00:00.000Z");

  it("uses fresh gateway heartbeat before marking gateway online", () => {
    expect(
      resolveGatewayOnline(
        { gatewayOnline: true, lastHeartbeatAt: "2026-06-03T07:59:45.000Z" },
        { status: "online", lastSeenAt: "2026-06-03T07:59:45.000Z", heartbeatIntervalSeconds: 30 },
        now
      )
    ).toBe(true);
  });

  it("does not trust stale gatewayOnline status without a fresh heartbeat", () => {
    expect(
      resolveGatewayOnline(
        { gatewayOnline: true, lastHeartbeatAt: "2026-06-03T07:50:00.000Z" },
        { status: "online", lastSeenAt: "2026-06-03T07:50:00.000Z", heartbeatIntervalSeconds: 30 },
        now
      )
    ).toBe(false);
  });

  it("falls back to status heartbeat time when heartbeat document is unavailable", () => {
    expect(getGatewayHeartbeatTime(null, { lastHeartbeatAt: "2026-06-03T07:59:30.000Z" })).toBe(
      "2026-06-03T07:59:30.000Z"
    );
    expect(resolveHeartbeatState(null, now, { lastHeartbeatAt: "2026-06-03T07:59:30.000Z" })).toBe("online");
  });

  it("uses schedule id as the document id for slot-specific recording rules", () => {
    const baseRule = {
      programId: "halo-bumi-lasinrang",
      programName: "Halo Bumi Lasinrang",
      recordingEnabled: true,
      requireAttendance: true,
      autoStart: true,
      autoStop: true,
      allowManualOverride: true,
      startGraceMinutes: 15,
      stopGraceMinutes: 10,
      maxOverrunMinutes: 30,
      minDurationMinutes: 5,
      folderSlug: "Halo_Bumi_Lasinrang",
      format: "mp3",
      storageRootKey: "RADIO_SBL_RECORDING_ROOT"
    } satisfies ProgramRecordingRule;

    expect(getRecordingRuleDocumentId(baseRule)).toBe("halo-bumi-lasinrang");
    expect(getRecordingRuleDocumentId({ ...baseRule, scheduleId: "rabu-1600-1800-halo-bumi-lasinrang" })).toBe(
      "rabu-1600-1800-halo-bumi-lasinrang"
    );
  });

  it("scopes recording command dedupe keys to a schedule occurrence date", () => {
    expect(getRadiobossCommandOccurrenceKey("rabu-1600-1800-halo", "2026-06-03T08:00:00.000Z")).toBe(
      "rabu-1600-1800-halo_2026-06-03"
    );
    expect(getRadiobossCommandOccurrenceKey("rabu-1600-1800-halo", "2026-06-10T08:00:00.000Z")).toBe(
      "rabu-1600-1800-halo_2026-06-10"
    );
  });
});
