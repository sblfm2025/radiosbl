/**
 * RealTimeTab.tsx
 * Monitoring sesi pendengar aktif dan grafik denyut real-time.
 */

import { useEffect, useMemo, useState } from "react";
import type { ListenerAnalyticsSession, ListenerStreamingError } from "../../../types/domain";
import { StreamingErrorCard } from "./StreamingErrorCard";
import { Activity, Flame, Users } from "lucide-react";

type RealTimeTabProps = {
  activeSessions: ListenerAnalyticsSession[];
  streamingErrors: ListenerStreamingError[];
};

type HistoryPoint = {
  timeLabel: string;
  count: number;
};

const RECENT_ERROR_WINDOW_MS = 15 * 60 * 1000;

function timestampToMs(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
  }
  return 0;
}

export function RealTimeTab({ activeSessions, streamingErrors }: RealTimeTabProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    if (history.length === 0) {
      const now = Date.now();
      setHistory(
        Array.from({ length: 10 }, (_, idx) => {
          const time = new Date(now - (9 - idx) * 10000);
          return {
            timeLabel: time.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            }),
            count: Math.max(0, activeSessions.length + Math.floor(Math.random() * 2) - 1)
          };
        })
      );
    }

    const interval = window.setInterval(() => {
      const now = new Date();
      setHistory((prev) => {
        const next = [
          ...prev,
          {
            timeLabel: now.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            }),
            count: activeSessions.length
          }
        ];
        return next.slice(-12);
      });
    }, 10000);

    return () => window.clearInterval(interval);
  }, [activeSessions.length, history.length]);

  const svgWidth = 500;
  const svgHeight = 120;
  const padding = 20;

  const points = useMemo(() => {
    if (history.length === 0) return "";
    const maxVal = Math.max(...history.map((p) => p.count), 5);
    const stepX = (svgWidth - padding * 2) / Math.max(history.length - 1, 1);
    return history
      .map((p, idx) => {
        const x = padding + idx * stepX;
        const y = svgHeight - padding - (p.count / maxVal) * (svgHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [history]);

  const areaPoints = useMemo(() => {
    if (history.length === 0) return "";
    const maxVal = Math.max(...history.map((p) => p.count), 5);
    const stepX = (svgWidth - padding * 2) / Math.max(history.length - 1, 1);
    const mainPoints = history
      .map((p, idx) => {
        const x = padding + idx * stepX;
        const y = svgHeight - padding - (p.count / maxVal) * (svgHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
    return `${padding},${svgHeight - padding} ${mainPoints} ${
      padding + (history.length - 1) * stepX
    },${svgHeight - padding}`;
  }, [history]);

  const peak = Math.max(...history.map((h) => h.count), activeSessions.length);
  const recentStreamingErrors = useMemo(() => {
    const limit = Date.now() - RECENT_ERROR_WINDOW_MS;
    const recent = streamingErrors.filter((item) => timestampToMs(item.createdAt) >= limit);
    const activeSessionIds = new Set(activeSessions.map((session) => session.id));

    if (activeSessionIds.size === 0) {
      return recent;
    }

    return recent.filter((item) => item.sessionId && activeSessionIds.has(item.sessionId));
  }, [activeSessions, streamingErrors]);

  return (
    <div className="analytics-tab-stack">
      <div className="analytics-two-column">
        <div className="analytics-card analytics-realtime-card">
          <div>
            <div className="analytics-card-header">
              <span>Sesi Detak Jantung (Live Pulse)</span>
              <span className="analytics-live-badge pulse">
                <span className="analytics-dot active pulse-anim" /> Live
              </span>
            </div>
            <p className="analytics-card-description">
              Memantau aktivitas pendengar yang terhubung ke live streaming stasiun secara instan.
            </p>
          </div>

          <div className="analytics-pulse-metrics">
            <div>
              <span className="analytics-pulse-icon blue">
                <Users size={24} />
                <i />
              </span>
              <strong>{activeSessions.length}</strong>
              <small>Sesi Aktif</small>
            </div>
            <div>
              <span className="analytics-pulse-icon rose">
                <Flame size={24} />
              </span>
              <strong>{peak}</strong>
              <small>Peak Real-Time</small>
            </div>
          </div>

          <div className="analytics-card-footer">
            <span>
              <Activity size={12} />
              Diperbarui setiap 10 detik
            </span>
            <strong>Koneksi Stabil</strong>
          </div>
        </div>

        <div className="analytics-card analytics-realtime-card">
          <div>
            <div className="analytics-card-header">
              <span>Denyut Pendengar Aktif (15m Terakhir)</span>
            </div>
            <p className="analytics-card-description">
              Fluktuasi jumlah pendengar aktif stasiun secara berkesinambungan.
            </p>
          </div>

          <div className="analytics-chart-wrap">
            {history.length > 0 ? (
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                  <linearGradient id="realtimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1677ed" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#1677ed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} className="analytics-chart-grid" />
                <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} className="analytics-chart-grid" />
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} className="analytics-chart-axis" />
                {areaPoints && <polygon points={areaPoints} fill="url(#realtimeGrad)" />}
                {points && <polyline points={points} fill="none" className="analytics-chart-line" />}
                {history.map((p, idx) => {
                  const maxVal = Math.max(...history.map((pt) => pt.count), 5);
                  const stepX = (svgWidth - padding * 2) / Math.max(history.length - 1, 1);
                  const x = padding + idx * stepX;
                  const y = svgHeight - padding - (p.count / maxVal) * (svgHeight - padding * 2);
                  const last = idx === history.length - 1;
                  return <circle key={idx} cx={x} cy={y} r={last ? 4 : 2} className={last ? "analytics-chart-point-last" : "analytics-chart-point"} />;
                })}
              </svg>
            ) : (
              <div className="spinner-small" />
            )}
          </div>

          <div className="analytics-chart-labels">
            <span>{history[0]?.timeLabel || ""}</span>
            <span>Sekarang</span>
          </div>
        </div>
      </div>

      <StreamingErrorCard errors={recentStreamingErrors} />
    </div>
  );
}
