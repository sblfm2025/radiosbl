import React from "react";
import { useLiveListenerCount } from "../hooks";
import { useGlobalAudio } from "../../../contexts/useGlobalAudio";

export interface LiveListenerCountCardProps {
  title?: string;
  showTrend?: boolean;
  colorScheme?: string;
}

export function LiveListenerCountCard({
  title = "Estimasi Pendengar Aktif",
  showTrend = false,
  colorScheme = "blue",
}: LiveListenerCountCardProps) {
  const { listenerCount, loading, error, lastUpdate, isConnected, refresh } = useLiveListenerCount({
    refreshInterval: 30000,
  });
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

  const formatLastUpdate = () => {
    if (!lastUpdate) return "-";
    return new Date(lastUpdate).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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
        <span 
          className="ui-badge" 
          style={{ 
            background: getStatusColor() + "1A", 
            color: getStatusColor(),
            border: `1px solid ${getStatusColor()}33`
          }}
        >
          <span style={{ 
            width: "6px", 
            height: "6px", 
            borderRadius: "50%", 
            background: getStatusColor(),
            display: "inline-block",
            marginRight: "4px"
          }} />
          {getStatusText()}
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "120px" }}>
          <div className="spinner-small" style={{ width: "40px", height: "40px", border: "3px solid var(--line)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "120px", gap: "8px" }}>
          <p style={{ color: "var(--coral)", fontWeight: 600, margin: 0 }}>{error}</p>
          <small style={{ color: "var(--muted)" }}>Klik untuk mencoba ulang</small>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "120px", position: "relative" }}>
          <div style={{
            position: "relative",
            width: "120px",
            height: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* SVG Progress Circle */}
            <svg style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }} width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="var(--line)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="var(--blue)"
                strokeWidth="8"
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * Math.min(listenerCount, 100)) / 100}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{listenerCount}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>pendengar</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail Server Streaming (Icecast) */}
      <div style={{
        marginTop: "8px",
        padding: "12px",
        borderRadius: "12px",
        background: "var(--soft)",
        border: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "1rem" }}>📡</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink)" }}>Server Stream (Icecast)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span 
            className="ui-badge" 
            style={{ 
              background: metadata.isOnline ? "rgba(46, 204, 113, 0.15)" : "rgba(255, 87, 87, 0.15)", 
              color: metadata.isOnline ? "var(--green)" : "var(--coral)",
              fontSize: "0.7rem",
              padding: "2px 8px",
              fontWeight: 600
            }}
          >
            {metadata.isOnline ? "Online" : "Offline"}
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--blue)" }}>
            {metadata.listeners} pendengar
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--muted)" }}>
        <span>Update: {formatLastUpdate()}</span>
        <span>Klik untuk perbarui</span>
      </div>
    </div>
  );
}
