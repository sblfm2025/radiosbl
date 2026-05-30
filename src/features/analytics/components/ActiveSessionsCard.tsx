import React from "react";
import { useActiveSessions } from "../hooks";
import { type ActiveSession } from "../services/analytics.service";

export interface ActiveSessionsCardProps {
  title?: string;
  maxRows?: number;
}

export function ActiveSessionsCard({
  title = "Sesi Aktif",
  maxRows = 10,
}: ActiveSessionsCardProps) {
  const { sessions, loading, error, lastUpdate, isMonitoring, refresh } = useActiveSessions({
    refreshInterval: 30000,
  });

  const getStatusColor = () => {
    if (!isMonitoring) return "var(--coral)";
    if (loading) return "var(--yellow)";
    return "var(--green)";
  };

  const getStatusText = () => {
    if (!isMonitoring) return "Nonaktif";
    if (loading) return "Memuat...";
    return "Aktif";
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "-";
    return new Date(lastUpdate).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatStartTime = (time: any) => {
    if (!time) return "-";
    const date = typeof time.toDate === "function" ? time.toDate() : new Date(time);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (isMobile: boolean) => {
    return isMobile ? "📱 Mobile" : "💻 Desktop";
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const displayedSessions = sessions.slice(0, maxRows);

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
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="ui-badge">{sessions.length} Sesi</span>
          <span 
            className="ui-badge" 
            style={{ 
              background: getStatusColor() + "1A", 
              color: getStatusColor(),
              border: `1px solid ${getStatusColor()}33`
            }}
          >
            {getStatusText()}
          </span>
        </div>
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
      ) : sessions.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "150px", gap: "4px" }}>
          <p style={{ color: "var(--muted)", fontWeight: 600, margin: 0 }}>Tidak ada sesi aktif</p>
          <small style={{ color: "var(--muted)", opacity: 0.7 }}>Menunggu pendengar...</small>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "10px 8px", color: "var(--muted)", fontWeight: 600 }}>Perangkat</th>
                <th style={{ padding: "10px 8px", color: "var(--muted)", fontWeight: 600 }}>Program</th>
                <th style={{ padding: "10px 8px", color: "var(--muted)", fontWeight: 600 }}>Mulai</th>
                <th style={{ padding: "10px 8px", color: "var(--muted)", fontWeight: 600 }}>Durasi</th>
              </tr>
            </thead>
            <tbody>
              {displayedSessions.map((session: ActiveSession) => (
                <tr key={session.id} style={{ borderBottom: "1px solid var(--soft)" }}>
                  <td style={{ padding: "10px 8px" }}>{getDeviceIcon(session.deviceInfo?.isMobile)}</td>
                  <td style={{ padding: "10px 8px", fontWeight: 500 }}>{session.programName || "Streaming Utama"}</td>
                  <td style={{ padding: "10px 8px" }}>{formatStartTime(session.startTime)}</td>
                  <td style={{ padding: "10px 8px" }}>{formatDuration(session.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--muted)" }}>
        <span>Update: {formatLastUpdate()}</span>
        <span>Klik untuk perbarui</span>
      </div>
    </div>
  );
}
