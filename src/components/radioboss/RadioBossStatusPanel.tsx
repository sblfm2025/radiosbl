import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Radio, Server, Timer, Waves } from "lucide-react";
import type { SongRequest } from "../../types/domain";
import {
  formatRelativeTime,
  resolveGatewayOnline,
  resolveHeartbeatState,
  resolvePlaybackState,
  resolveRadioBossOnline,
  subscribeGatewayHeartbeat,
  subscribeNowPlaying,
  subscribeRadioBossStatus,
  type RadioBossGatewayHeartbeat,
  type RadioBossNowPlaying,
  type RadioBossStatus
} from "../../services/radioboss/radiobossStatus.service";
import { GatewayHealthBadge } from "./GatewayHealthBadge";
import { NowPlayingCard } from "./NowPlayingCard";

type RadioBossStatusPanelProps = {
  currentProgram: {
    title: string;
    time: string;
  };
  activeAnnouncer?: string;
  attendanceLabel?: string;
  songRequests: SongRequest[];
  gatewayId?: string;
};

type BadgeTone = "online" | "offline" | "warning" | "recording" | "waiting";

function StatusPill({ label, tone }: { label: string; tone: BadgeTone }) {
  return <span className={`radioboss-status-pill is-${tone}`}>{label}</span>;
}

function formatRecordingStatus(status: RadioBossStatus | null): { label: string; tone: BadgeTone } {
  if (status?.recordingActive) {
    return { label: "Sedang direkam", tone: "recording" };
  }

  if (status?.lastError || status?.errorMessageSafe) {
    return { label: "Perlu dicek", tone: "warning" };
  }

  return { label: "Tidak direkam", tone: "waiting" };
}

function getRequestSummary(songRequests: SongRequest[]) {
  return {
    masuk: songRequests.filter((request) => request.status === "new" || request.status === "notified").length,
    cocok: songRequests.filter((request) => request.status === "matched").length,
    review: songRequests.filter((request) => request.status === "needs_review").length,
    dikirim: songRequests.filter((request) => request.status === "sent_to_radioboss" || request.status === "queued").length,
    diputar: songRequests.filter((request) => request.status === "played").length
  };
}

export function RadioBossStatusPanel({
  currentProgram,
  activeAnnouncer,
  attendanceLabel,
  songRequests,
  gatewayId = "studio-main"
}: RadioBossStatusPanelProps) {
  const [status, setStatus] = useState<RadioBossStatus | null>(null);
  const [nowPlaying, setNowPlaying] = useState<RadioBossNowPlaying | null>(null);
  const [heartbeat, setHeartbeat] = useState<RadioBossGatewayHeartbeat | null>(null);

  useEffect(() => subscribeRadioBossStatus(setStatus), []);
  useEffect(() => subscribeNowPlaying(setNowPlaying), []);
  useEffect(() => subscribeGatewayHeartbeat(status?.gatewayId || gatewayId, setHeartbeat), [gatewayId, status?.gatewayId]);

  const radioBossOnline = resolveRadioBossOnline(status);
  const gatewayOnline = resolveGatewayOnline(status) || resolveHeartbeatState(heartbeat) === "online";
  const playbackState = resolvePlaybackState(status);
  const recording = formatRecordingStatus(status);
  const requestSummary = useMemo(() => getRequestSummary(songRequests), [songRequests]);
  const warningMessage = !gatewayOnline
    ? "Studio Gateway tidak terhubung. Periksa aplikasi gateway di PC studio."
    : !radioBossOnline
      ? "RadioBOSS tidak terdeteksi. Pastikan RadioBOSS berjalan dan API lokal aktif."
      : status?.errorMessageSafe ?? null;

  return (
    <section className="radioboss-panel" aria-label="Monitoring integrasi RadioBOSS">
      <div className="radioboss-panel-head">
        <div>
          <span aria-hidden="true">
            <Waves size={20} />
          </span>
          <div>
            <small>Integrasi RadioBOSS</small>
            <strong>Monitoring studio</strong>
          </div>
        </div>
        <StatusPill label={radioBossOnline ? "RadioBOSS Online" : "RadioBOSS Offline"} tone={radioBossOnline ? "online" : "offline"} />
      </div>

      {warningMessage && (
        <div className="radioboss-warning">
          <AlertTriangle size={16} />
          <span>{warningMessage}</span>
        </div>
      )}

      <div className="radioboss-summary-grid">
        <article>
          <span><Radio size={16} /> RadioBOSS</span>
          <StatusPill label={radioBossOnline ? "Online" : "Offline"} tone={radioBossOnline ? "online" : "offline"} />
          <small>{playbackState === "unknown" ? "Playback belum terdeteksi" : `Playback: ${playbackState}`}</small>
        </article>
        <article>
          <span><Server size={16} /> Gateway</span>
          <StatusPill label={gatewayOnline ? "Online" : "Offline"} tone={gatewayOnline ? "online" : "offline"} />
          <small>Heartbeat {formatRelativeTime(heartbeat?.lastHeartbeatAt ?? status?.lastHeartbeatAt)}</small>
        </article>
        <article>
          <span><Timer size={16} /> Rekaman</span>
          <StatusPill label={recording.label} tone={recording.tone} />
          <small>{status?.activeRecordingId ? `ID: ${status.activeRecordingId}` : "Belum ada recording aktif"}</small>
        </article>
        <article>
          <span><CheckCircle2 size={16} /> Request lagu</span>
          <strong>{requestSummary.masuk} masuk</strong>
          <small>{requestSummary.cocok} cocok - {requestSummary.review} review - {requestSummary.dikirim} dikirim - {requestSummary.diputar} diputar</small>
        </article>
      </div>

      <div className="radioboss-live-grid">
        <article className="radioboss-program-card">
          <span>Program Aktif</span>
          <strong>{currentProgram.title || "Belum ada program aktif"}</strong>
          <small>{currentProgram.time ? currentProgram.time.replace(/ WITA/g, "") : "Jam belum tersedia"}</small>
          <div>
            <span>Penyiar</span>
            <strong>{activeAnnouncer || "Belum terdeteksi"}</strong>
            <small>{attendanceLabel || "Status absensi belum tersedia"}</small>
          </div>
        </article>
        <NowPlayingCard nowPlaying={nowPlaying} />
        <GatewayHealthBadge heartbeat={heartbeat} />
      </div>
    </section>
  );
}
