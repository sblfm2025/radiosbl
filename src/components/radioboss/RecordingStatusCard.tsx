import { Activity, CalendarClock, Mic2, RadioTower } from "lucide-react";
import type { ProgramRecording, ProgramRecordingRule } from "../../types/domain";
import type { CurrentBroadcastSlot } from "../../utils/scheduleClock";
import type { RadioBossGatewayHeartbeat, RadioBossStatus } from "../../services/radioboss/radiobossStatus.service";
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
  recordable: boolean;
  status: RadioBossStatus | null;
  heartbeat?: RadioBossGatewayHeartbeat | null;
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
  recordable,
  status,
  heartbeat
}: RecordingStatusCardProps) {
  const radioBossOnline = resolveRadioBossOnline(status);
  const gatewayOnline = resolveGatewayOnline(status, heartbeat ?? null);
  const recordingLabel = getRecordingLabel(recording, status);

  return (
    <section className="radioboss-page-card recording-status-card">
      <div className="radioboss-card-head">
        <strong>Status rekaman program aktif</strong>
        <small>
          {recordable
            ? "Start mengikuti absen masuk dan stop mengikuti absen pulang penyiar."
            : "Autoplaylist dan slot tanpa penyiar tidak dibuatkan rekaman otomatis."}
        </small>
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
          <strong>{recordable ? currentSlot.announcer : "Tidak ada penyiar aktif"}</strong>
          <small>{recordable ? `Schedule ID: ${scheduleId}` : "Program berjalan sebagai playlist otomatis"}</small>
        </article>
        <article>
          <RadioTower size={17} />
          <span>Rule</span>
          <strong>
            {!recordable
              ? "Tidak tersedia"
              : rule?.recordingEnabled ? "Recording enabled" : "Recording disabled"}
          </strong>
          <small>
            {!recordable
              ? "Hanya program berpemandu penyiar yang punya aturan rekaman"
              : rule?.recordingEnabled
              ? `${rule.autoStart ? "Start dari absen masuk" : "Start otomatis nonaktif"} - ${rule.autoStop ? "stop dari absen pulang" : "stop manual"}`
              : "Tidak direkam otomatis"}
          </small>
        </article>
        <article>
          <Activity size={17} />
          <span>Rekaman</span>
          <strong>{recordingLabel}</strong>
          <small>{recording?.fileName || (recordable ? "File belum dibuat Gateway" : "Gateway tidak membuat file untuk autoplaylist")}</small>
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
