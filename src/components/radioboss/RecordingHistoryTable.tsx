import { Copy, FileAudio } from "lucide-react";
import type { ProgramRecording, RecordingStatus } from "../../types/domain";
import { toDate } from "../../services/radioboss/radiobossStatus.service";

type RecordingHistoryTableProps = {
  recordings: ProgramRecording[];
};

const statusLabel: Record<RecordingStatus, string> = {
  waiting_schedule: "Menunggu jadwal",
  waiting_attendance: "Menunggu absensi",
  ready: "Siap rekam",
  recording: "Sedang direkam",
  stopping: "Menghentikan",
  stopped: "Stopped",
  completed: "Selesai",
  failed: "Gagal",
  skipped_no_attendance: "Skip absensi",
  skipped_disabled: "Skip disabled",
  manual_override: "Manual override",
  gateway_offline: "Gateway offline",
  radioboss_offline: "RadioBOSS offline"
};

function formatDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", { dateStyle: "medium" });
}

function formatTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return "-";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m ${secs}d`;
}

function getStatusTone(status: RecordingStatus): string {
  if (status === "recording") return "recording";
  if (status === "completed" || status === "stopped") return "online";
  if (status === "failed" || status === "gateway_offline" || status === "radioboss_offline") return "offline";
  if (status.startsWith("skipped") || status === "manual_override") return "warning";
  return "waiting";
}

async function copyPath(filePath?: string) {
  if (!filePath) return;
  await navigator.clipboard?.writeText(filePath);
}

export function RecordingHistoryTable({ recordings }: RecordingHistoryTableProps) {
  if (recordings.length === 0) {
    return (
      <div className="radioboss-empty-state">
        <FileAudio size={28} />
        <strong>Riwayat rekaman belum tersedia</strong>
        <p>Data akan muncul setelah Studio Gateway menulis dokumen `programRecordings`.</p>
      </div>
    );
  }

  return (
    <div className="radioboss-table-wrap">
      <table className="radioboss-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Program</th>
            <th>Penyiar</th>
            <th>Jam mulai</th>
            <th>Jam selesai</th>
            <th>Durasi</th>
            <th>Status</th>
            <th>File</th>
            <th>Gateway</th>
            <th>Error aman</th>
          </tr>
        </thead>
        <tbody>
          {recordings.map((recording) => (
            <tr key={recording.id}>
              <td>{formatDate(recording.plannedStartAt ?? recording.startedAt)}</td>
              <td><strong>{recording.programName}</strong></td>
              <td>{recording.announcerName || "-"}</td>
              <td>{formatTime(recording.startedAt ?? recording.plannedStartAt)}</td>
              <td>{formatTime(recording.stoppedAt ?? recording.plannedStopAt)}</td>
              <td>{formatDuration(recording.durationSeconds)}</td>
              <td>
                <span className={`radioboss-status-pill is-${getStatusTone(recording.status)}`}>
                  {statusLabel[recording.status] ?? recording.status}
                </span>
              </td>
              <td>
                <span className="radioboss-file-cell">
                  <strong>{recording.fileName || "-"}</strong>
                  {recording.filePath && <small>{recording.filePath}</small>}
                  {recording.filePath && (
                    <button type="button" onClick={() => void copyPath(recording.filePath)}>
                      <Copy size={14} />
                      Salin Path
                    </button>
                  )}
                </span>
              </td>
              <td>{recording.gatewayId || "-"}</td>
              <td>{recording.errorMessageSafe || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
