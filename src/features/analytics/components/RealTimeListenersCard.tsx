import React from "react";
import { useRealTimeListeners } from "../hooks";
import { useGlobalAudio } from "../../../contexts/useGlobalAudio";

export interface RealTimeListenersCardProps {
  title?: string;
  refreshInterval?: number;
  showTrend?: boolean;
  colorScheme?: string;
}

export function RealTimeListenersCard({
  title = "Monitoring Real-Time",
  refreshInterval = 30000, // 30 detik
  showTrend = true,
  colorScheme = "green",
}: RealTimeListenersCardProps) {
  const {
    currentListeners,
    peakListeners,
    trend,
    loading,
    error,
    lastUpdate,
    isConnected,
    refresh,
  } = useRealTimeListeners({ refreshInterval });
  const { metadata } = useGlobalAudio();

  const getStatusColor = () => {
    if (!isConnected) return "var(--coral)";
    if (loading) return "var(--yellow)";
    return "var(--green)";
  };

  const getStatusText = () => {
    if (!isConnected) return "Terputus";
    if (loading) return "Memuat...";
    return "Aktif";
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "📈 Naik";
      case "down":
        return "📉 Turun";
      case "stable":
        return "➡️ Stabil";
      default:
        return "-";
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "var(--green)";
      case "down":
        return "var(--coral)";
      case "stable":
        return "var(--muted)";
      default:
        return "var(--muted)";
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "-";
    const now = Date.now();
    const diff = now - new Date(lastUpdate).getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 5) return `Baru saja`;
    if (seconds < 60) return `${seconds} detik lalu`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    return `${Math.floor(seconds / 3600)} jam lalu`;
  };

  return (
    <div 
      className="ui-card" 
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)" }}>{title}</h3>
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

      {!isConnected && (
        <div className="empty-state" style={{ margin: 0, background: "rgba(255, 87, 87, 0.1)", color: "var(--coral)" }}>
          Koneksi bermasalah. Klik perbarui untuk mencoba menyambungkan ulang.
        </div>
      )}

      {error && (
        <div className="form-error" style={{ margin: 0 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
          <div className="spinner-small" style={{ width: "40px", height: "40px", border: "3px solid var(--line)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "center" }}>
            
            {/* Left Box: Active Listeners */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", background: "var(--soft)", borderRadius: "14px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, marginBottom: "8px" }}>Pendengar Aktif</span>
              <div style={{
                position: "relative",
                width: "90px",
                height: "90px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <svg style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }} width="90" height="90">
                  <circle cx="45" cy="45" r="38" fill="transparent" stroke="var(--line)" strokeWidth="6" />
                  <circle
                    cx="45"
                    cy="45"
                    r="38"
                    fill="transparent"
                    stroke="var(--green)"
                    strokeWidth="6"
                    strokeDasharray={238}
                    strokeDashoffset={238 - (238 * Math.min(currentListeners, peakListeners || 1)) / (peakListeners || 1)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                </svg>
                <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--ink)" }}>{currentListeners}</span>
              </div>
            </div>

            {/* Right Box: Trend and Peak */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {showTrend && (
                <div style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--line)", background: "white" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Tren Sesi</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: getTrendColor() }}>{getTrendIcon()}</span>
                </div>
              )}

              <div style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--line)", background: "white" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Puncak Hari Ini</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--yellow)" }}>{peakListeners}</span>
              </div>

              <div style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--line)", background: "white", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>📡</span> Icecast Stream
                </span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--blue)" }}>{metadata.listeners}</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: metadata.isOnline ? "var(--green)" : "var(--coral)" }}>
                    {metadata.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--muted)", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
            <span>Update: {formatLastUpdate()}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                type="button" 
                className="ghost-button" 
                onClick={refresh}
                style={{ padding: "4px 8px", minHeight: "auto", borderRadius: "8px", fontSize: "0.7rem" }}
              >
                Perbarui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
