/**
 * SummaryTab.tsx
 * Tab Ringkasan: menampilkan statistik hari ini dan mingguan
 * beserta gauge pendengar aktif dan info server Icecast.
 */

import { useMemo } from "react";
import type { ListenerAnalyticsSession } from "../../../types/domain";
import type { IcecastStatusState } from "../hooks/useIcecastStatus";
import { filterByDays, computeStats, formatDurationLong } from "../utils/analyticsHelpers";
import { Radio, Wifi } from "lucide-react";

type SummaryTabProps = {
  activeSessions: ListenerAnalyticsSession[];
  allSessions: ListenerAnalyticsSession[];
  icecast: IcecastStatusState;
  timeDays: number;
};

function GaugeRing({ value, max, label }: { value: number; max: number; label: string }) {
  const size = 110;
  const r = 42;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const safeMax = Math.max(max, 1);
  const fraction = Math.min(value / safeMax, 1);
  const strokeDash = fraction * circumference;

  return (
    <div className="analytics-gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${label}: ${value}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          className="analytics-gauge-track"
          strokeWidth={10}
        />
        {/* Fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          className="analytics-gauge-fill"
          strokeWidth={10}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Nilai tengah */}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          className="analytics-gauge-value">
          {value}
        </text>
      </svg>
      <span>{label}</span>
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="analytics-stat-block">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

export function SummaryTab({ activeSessions, allSessions, icecast, timeDays }: SummaryTabProps) {
  const todaySessions = useMemo(() => filterByDays(allSessions, 1), [allSessions]);
  const weekSessions = useMemo(() => filterByDays(allSessions, 7), [allSessions]);
  const periodSessions = useMemo(() => filterByDays(allSessions, timeDays), [allSessions, timeDays]);

  const todayStats = useMemo(() => computeStats(todaySessions), [todaySessions]);
  const weekStats = useMemo(() => computeStats(weekSessions), [weekSessions]);

  const activeCount = activeSessions.length;

  return (
    <div className="analytics-summary-stack">
      <div className="analytics-summary-grid">

        <div className="analytics-card">
          <div className="analytics-card-header">
            <span>Estimasi Pendengar Aktif</span>
            <span className="analytics-live-badge">
              <span className="analytics-dot active" /> Aktif
            </span>
          </div>
          <div className="analytics-active-layout">
            <GaugeRing value={activeCount} max={Math.max(activeCount * 2, 10)} label="pendengar" />
            <div className="analytics-server-stack">
              <div className="analytics-server-row">
                <span className="analytics-server-name">
                  <Radio size={14} />
                  {icecast.streamName || "Server Stream (Icecast)"}
                </span>
                <div className="analytics-server-status">
                  <span className={`analytics-badge ${icecast.online ? "online" : "offline"}`}>
                    {icecast.online ? "Online" : "Offline"}
                  </span>
                  {icecast.online && (
                    <strong>
                      {icecast.listeners} pendengar
                    </strong>
                  )}
                </div>
              </div>
              <span className="analytics-refresh-hint">
                {icecast.lastUpdatedAt
                  ? `Update ${new Date(icecast.lastUpdatedAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}`
                  : "Menunggu update"}
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <span>Statistik Pendengar</span>
            <span className="analytics-period-badge">Hari Ini</span>
          </div>
          <div className="analytics-stats-grid">
            <StatBlock
              label="Total Pendengar"
              value={String(todayStats.total)}
              sub="Unik per perangkat"
            />
            <StatBlock
              label="Puncak Pendengar"
              value={String(todayStats.peak)}
              sub="Bersamaan tertinggi"
            />
            <StatBlock
              label="Rata-rata Durasi"
              value={formatDurationLong(todayStats.avgDurationSeconds)}
              sub="Per sesi dengar"
            />
            <StatBlock
              label="Total Waktu Dengar"
              value={formatDurationLong(todayStats.totalDurationSeconds)}
              sub="Akumulasi sesi"
            />
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <span>Statistik Mingguan</span>
            <span className="analytics-period-badge week">7 Hari Terakhir</span>
          </div>
          <div className="analytics-stats-grid">
            <StatBlock
              label="Total Pendengar"
              value={String(weekStats.total)}
              sub="Unik per perangkat"
            />
            <StatBlock
              label="Puncak Pendengar"
              value={String(weekStats.peak)}
              sub="Bersamaan tertinggi"
            />
            <StatBlock
              label="Rata-rata Durasi"
              value={formatDurationLong(weekStats.avgDurationSeconds)}
              sub="Per sesi dengar"
            />
            <StatBlock
              label="Total Waktu Dengar"
              value={formatDurationLong(weekStats.totalDurationSeconds)}
              sub="Akumulasi sesi"
            />
          </div>
        </div>
      </div>

      {periodSessions.length === 0 && (
        <div className="analytics-empty-state">
          <Wifi size={36} />
          <p>Belum ada data sesi untuk periode {timeDays === 1 ? "hari ini" : `${timeDays} hari terakhir`}.</p>
          <span>Data akan muncul setelah pendengar memutar radio melalui aplikasi.</span>
        </div>
      )}
    </div>
  );
}
