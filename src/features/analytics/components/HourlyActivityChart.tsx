import type { ListenerAnalyticsSession } from "../../../types/domain";
import { Clock } from "lucide-react";
import "../styles/listenerAnalytics.css";

type HourlyActivityChartProps = {
  sessions: ListenerAnalyticsSession[];
};

/**
 * Menampilkan distribusi jam aktif pendengar (00–23) berdasarkan startedAt sesi.
 * Menggunakan bar chart SVG inline sederhana tanpa dependensi library tambahan.
 */
export function HourlyActivityChart({ sessions }: HourlyActivityChartProps) {
  // Hitung jumlah sesi per jam
  const hourCounts = Array.from({ length: 24 }, () => 0);

  for (const s of sessions) {
    try {
      const h = new Date(s.startedAt as string).getHours();
      if (h >= 0 && h <= 23) {
        hourCounts[h]!++;
      }
    } catch {
      // abaikan sesi dengan tanggal tidak valid
    }
  }

  const maxCount = Math.max(...hourCounts, 1);
  const BAR_HEIGHT = 64; // px tinggi maksimum bar

  // Temukan jam paling ramai
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  const formatHour = (h: number) => {
    const suffix = h < 12 ? "AM" : "PM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}${suffix}`;
  };

  if (sessions.length === 0) {
    return (
      <div className="hourly-chart-card">
        <p className="hourly-chart-title" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Clock size={16} color="#6366f1" />
          Distribusi Jam Aktif Pendengar
        </p>
        <p className="hourly-chart-subtitle">Belum ada data sesi yang tersedia.</p>
      </div>
    );
  }

  return (
    <div className="hourly-chart-card">
      <p className="hourly-chart-title" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <Clock size={16} color="#6366f1" />
        Distribusi Jam Aktif Pendengar
      </p>
      <p className="hourly-chart-subtitle">
        Jam paling ramai: <strong>{formatHour(peakHour)}</strong>
        &nbsp;({hourCounts[peakHour]} sesi) &middot; Total: {sessions.length} sesi
      </p>

      <div className="hourly-bars-container" role="img" aria-label="Bar chart distribusi jam aktif pendengar">
        {hourCounts.map((count, hour) => {
          const heightPx = Math.max((count / maxCount) * BAR_HEIGHT, count > 0 ? 4 : 0);
          const isPeak = hour === peakHour && count > 0;

          return (
            <div key={hour} className="hourly-bar-col" title={`${hour}:00 — ${count} sesi`}>
              <div
                className={`hourly-bar-fill${isPeak ? " peak" : ""}`}
                style={{ height: `${heightPx}px` }}
                aria-label={`Jam ${hour}:00, ${count} sesi`}
              />
              <span className="hourly-bar-label">
                {hour % 6 === 0 ? `${hour}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
