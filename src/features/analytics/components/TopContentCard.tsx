import React from "react";
import { useTopContent } from "../hooks";
import { MetricsTimeRange, TopContentTimeRange } from "../services/analytics.service";

export interface TopContentCardProps {
  title?: string;
  timeRange?: MetricsTimeRange;
  maxItems?: number;
  showListeningTime?: boolean;
  colorScheme?: string;
}

export function TopContentCard({
  title = "Konten Terpopuler",
  timeRange = MetricsTimeRange.TODAY,
  maxItems = 10,
  showListeningTime = true,
  colorScheme = "purple",
}: TopContentCardProps) {
  const getTopContentTimeRange = (range: MetricsTimeRange): TopContentTimeRange => {
    if (range === MetricsTimeRange.LAST_7_DAYS) return TopContentTimeRange.WEEK;
    if (range === MetricsTimeRange.LAST_30_DAYS) return TopContentTimeRange.MONTH;
    return TopContentTimeRange.TODAY;
  };

  const { topContent, loading, error, refresh } = useTopContent(
    getTopContentTimeRange(timeRange),
    { limit: maxItems }
  );

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

  const getRankBackground = (rank: number) => {
    if (rank === 1) return "rgba(245, 180, 0, 0.15)";
    if (rank === 2) return "rgba(104, 117, 139, 0.15)";
    if (rank === 3) return "rgba(255, 87, 87, 0.15)";
    return "var(--soft)";
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "var(--yellow)";
    if (rank === 2) return "var(--muted)";
    if (rank === 3) return "var(--coral)";
    return "var(--ink)";
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
      ) : topContent.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "150px", gap: "4px" }}>
          <p style={{ color: "var(--muted)", fontWeight: 600, margin: 0 }}>Belum ada data konten</p>
          <small style={{ color: "var(--muted)", opacity: 0.7 }}>Mulai siaran untuk melihat statistik</small>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {topContent.map((item, index) => (
            <div 
              key={item.id} 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px",
                borderRadius: "10px",
                transition: "background 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "var(--soft)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: getRankBackground(index + 1),
                color: getRankColor(index + 1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "0.8rem"
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 500, color: "var(--ink)", fontSize: "0.85rem" }}>{item.title}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{item.type}</span>
              </div>
              {showListeningTime && (
                <span className="ui-badge" style={{ fontSize: "0.7rem" }}>
                  {formatDuration(item.listenTime)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
