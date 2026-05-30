import React from "react";
import { useListenerMetrics } from "../hooks";
import { MetricsTimeRange } from "../services/analytics.service";

export interface ListenerMetricsCardProps {
  title?: string;
  timeRange?: MetricsTimeRange;
  colorScheme?: string;
}

export function ListenerMetricsCard({
  title = "Statistik Pendengar",
  timeRange = MetricsTimeRange.TODAY,
  colorScheme = "blue",
}: ListenerMetricsCardProps) {
  const { metrics, loading, error, refresh } = useListenerMetrics(timeRange);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case MetricsTimeRange.TODAY:
        return "Hari Ini";
      case MetricsTimeRange.LAST_7_DAYS:
        return "7 Hari Terakhir";
      case MetricsTimeRange.LAST_30_DAYS:
        return "30 Hari Terakhir";
      default:
        return "Hari Ini";
    }
  };

  const formatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m";
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours + "j " + mins + "m";
    }
    return minutes + "m";
  };

  return (
    <div 
      className="ui-card" 
      onClick={refresh}
      style={{
        padding: "24px",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(15, 23, 42, 0.12)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 14px 34px rgba(15, 23, 42, 0.07)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)" }}>{title}</h3>
        <span className="ui-badge" style={{ textTransform: "capitalize" }}>
          {getTimeRangeLabel()}
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
          <div className="spinner-small" style={{ width: "40px", height: "40px", border: "3px solid var(--line)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "150px", gap: "8px" }}>
          <p style={{ color: "var(--coral)", fontWeight: 600, margin: 0 }}>{error}</p>
          <small style={{ color: "var(--muted)" }}>Klik untuk mencoba ulang</small>
        </div>
      ) : metrics ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Stat 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>Total Pendengar</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--blue)" }}>
              {formatNumber(metrics.uniqueListenersCount)}
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Unik per perangkat</span>
          </div>

          {/* Stat 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>Puncak Pendengar</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--yellow)" }}>
              {formatNumber(metrics.peakListenersCount)}
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Bersamaan tertinggi</span>
          </div>

          {/* Stat 3 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>Rata-rata Durasi</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--green)" }}>
              {formatDuration(metrics.averageDuration)}
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Per sesi dengar</span>
          </div>

          {/* Stat 4 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>Total Waktu Dengar</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "purple" }}>
              {formatDuration(metrics.totalDuration)}
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Akumulasi sesi</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
          <p style={{ color: "var(--muted)" }}>Belum ada data</p>
        </div>
      )}
    </div>
  );
}
