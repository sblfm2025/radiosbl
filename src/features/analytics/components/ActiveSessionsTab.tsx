/**
 * ActiveSessionsTab.tsx
 * Tab Sesi Aktif - tabel koneksi pendengar real-time.
 */

import { useEffect, useState } from "react";
import type { ListenerAnalyticsSession } from "../../../types/domain";
import { formatDurationShort } from "../utils/analyticsHelpers";
import { Clock, Globe, Monitor, Navigation, PlayCircle, Radio, Smartphone } from "lucide-react";

type ActiveSessionsTabProps = {
  activeSessions: ListenerAnalyticsSession[];
};

function ActiveSessionRow({ session }: { session: ListenerAnalyticsSession }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const started = new Date(session.startedAt as string).getTime();
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [session.startedAt]);

  const os = session.device?.os || "OS";
  const browser = session.device?.browser || "Browser";
  const lowerOs = os.toLowerCase();
  const DeviceIcon =
    lowerOs.includes("android") ||
    lowerOs.includes("ios") ||
    lowerOs.includes("iphone") ||
    lowerOs.includes("mobile")
      ? Smartphone
      : Monitor;
  const hasGPS = session.location?.latitude != null && session.location?.longitude != null;
  const startedAt = (() => {
    try {
      return new Date(session.startedAt as string).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return String(session.startedAt || "-");
    }
  })();

  return (
    <tr>
      <td data-label="IP & Lokasi">
        <div className="analytics-table-primary">
          {hasGPS ? <Navigation size={13} /> : <Globe size={13} />}
          <span>
            {hasGPS
              ? `${session.location?.latitude?.toFixed(4)}, ${session.location?.longitude?.toFixed(4)}`
              : "Pinrang, ID"}
          </span>
        </div>
        <small>{hasGPS ? "GPS akurasi tinggi" : "IP Geolocation (Sulawesi Selatan)"}</small>
      </td>
      <td data-label="Waktu Mulai">
        <span className="analytics-table-inline">
          <Clock size={13} />
          {startedAt}
        </span>
      </td>
      <td data-label="Durasi Aktif">
        <span className="analytics-live-badge active-pill">
          <PlayCircle size={12} />
          {formatDurationShort(elapsedSeconds)}
        </span>
      </td>
      <td data-label="Program">
        <span className="analytics-table-program">
          <Radio size={13} />
          {session.program?.title || "Siaran Live Streaming"}
        </span>
      </td>
      <td data-label="Perangkat / OS">
        <span className="analytics-table-inline">
          <DeviceIcon size={14} />
          {browser} ({os})
        </span>
      </td>
    </tr>
  );
}

export function ActiveSessionsTab({ activeSessions }: ActiveSessionsTabProps) {
  return (
    <div className="analytics-card analytics-table-card">
      <div className="analytics-card-header analytics-card-header-bordered">
        <div className="analytics-title-stack">
          <span>Tabel Sesi Pendengar Aktif</span>
          <small>Daftar seluruh koneksi aktif yang saat ini memutar siaran radio SBL.</small>
        </div>
        <span className="analytics-period-badge success">{activeSessions.length} Online</span>
      </div>

      <div className="analytics-table-wrap">
        {activeSessions.length === 0 ? (
          <div className="analytics-empty-state compact">
            <Globe size={40} />
            <p>Belum Ada Sesi Aktif</p>
            <span>Tidak ada pendengar yang sedang memutar siaran streaming radio saat ini.</span>
          </div>
        ) : (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>IP &amp; Lokasi</th>
                <th>Waktu Mulai</th>
                <th>Durasi Aktif</th>
                <th>Program Terpilih</th>
                <th>Perangkat / OS</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((session) => (
                <ActiveSessionRow key={session.id} session={session} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
