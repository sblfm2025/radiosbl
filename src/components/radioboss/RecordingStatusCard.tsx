import { Activity, CalendarClock, Mic2, RadioTower } from "lucide-react";
import type { ProgramRecording, ProgramRecordingRule } from "../../types/domain";
import type { CurrentBroadcastSlot } from "../../utils/scheduleClock";
import type { RadioBossStatus } from "../../services/radioboss/radiobossStatus.service";
import {
  resolveGatewayOnline,
  resolvePlaybackState,
  resolveRadioBossOnline
} from "../../services/radioboss/radiobossStatus.service";

type RecordingStatusCardProps = {
  currentSlot: CurrentBroadcastSlot;
  scheduleId: string;
  recording: ProgramRecording | null;
  rule: ProgramRecordingRule | null;
  status: RadioBossStatus | null;
};

function getRecordingLabel(recording: ProgramRecording | null, status: RadioBossStatus | null): string {
  if (recording?.status === "recording" || status?.recordingActive) return "Sedang direkam";
  if (recording?.status === "ready") return "Siap rekam";
  if (recording?.status === "failed") return "Gagal";
  if (recording?.status === "completed" || recording?.status === "stopped") return "Selesai";
  if (recording?.status?.startsWith("waiting")) return "Menunggu";
  if (recording?.status?.startsWith("skipped")) return "Tidak direkam";
  return "Belum ada rekaman aktif";
}

export function RecordingStatusCard({
  currentSlot,
  scheduleId,
  recording,
  rule,
  status
}: RecordingStatusCardProps) {
  const radioBossOnline = resolveRadioBossOnline(status);
  const gatewayOnline = resolveGatewayOnline(status);
  const recordingLabel = getRecordingLabel(recording, status);

  return (
    <section className="radioboss-page-card recording-status-card">
      <div className="radioboss-card-head">
        <strong>Status rekaman program aktif</strong>
        <small>Kontrol manual tetap melalui Firestore command queue.</small>
      </div>

      <div className="recording-status-grid">
        <article>
          <CalendarClock size={17} />
          <span>Program Aktif</span>
          <strong>{currentSlot.title}</strong>
          <small>{currentSlot.time} WITA</small>
        </article>
        <article>
          <Mic2 size={17} />
          <span>Penyiar</span>
          <strong>{currentSlot.announcer}</strong>
          <small>Schedule ID: {scheduleId}</small>
        </article>
        <article>
          <RadioTower size={17} />
          <span>Rule</span>
          <strong>{rule?.recordingEnabled ? "Recording enabled" : "Recording disabled"}</strong>
          <small>{rule?.allowManualOverride ? "Manual override boleh" : "Manual override tidak aktif"}</small>
        </article>
        <article>
          <Activity size={17} />
          <span>Rekaman</span>
          <strong>{recordingLabel}</strong>
          <small>{recording?.fileName || "File belum dibuat Gateway"}</small>
        </article>
      </div>

      <div className="recording-connection-row">
        <span className={`radioboss-status-pill is-${radioBossOnline ? "online" : "offline"}`}>
          RadioBOSS {radioBossOnline ? "Online" : "Offline"}
        </span>
        <span className={`radioboss-status-pill is-${gatewayOnline ? "online" : "offline"}`}>
          Gateway {gatewayOnline ? "Online" : "Offline"}
        </span>
        <span className="radioboss-status-pill is-waiting">
          Playback: {resolvePlaybackState(status)}
        </span>
      </div>
    </section>
  );
}
