import type { ListenerStreamingError } from "../../../types/domain";
import { AlertOctagon, Monitor, ShieldAlert } from "lucide-react";

type StreamingErrorCardProps = {
  errors: ListenerStreamingError[];
};

export function StreamingErrorCard({ errors }: StreamingErrorCardProps) {
  const getErrorTypeLabel = (ev: ListenerStreamingError["event"]) => {
    switch (ev) {
      case "media_error":
        return "Gagal Dekode Media";
      case "network_error":
        return "Jaringan Terputus";
      case "buffering_timeout":
        return "Buffering Timeout";
      case "play_failed":
        return "Gagal Memulai";
      default:
        return "Kesalahan Tidak Dikenal";
    }
  };

  const getFormatTime = (value: unknown) => {
    if (!value) return "-";
    const date =
      value instanceof Date
        ? value
        : typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
          ? value.toDate()
          : new Date(value as string | number);

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="workflow-card">
      <div className="workflow-card-header">
        <span className="workflow-card-title">
          <AlertOctagon size={18} color="#ef4444" />
          Diagnosis Kendala Streaming
        </span>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Sesi aktif / 15m: {errors.length}</span>
      </div>
      <div className="workflow-card-body" style={{ padding: 0 }}>
        {errors.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            <ShieldAlert size={28} style={{ color: "#10b981", marginBottom: "8px" }} />
            Tidak ada error streaming terdeteksi. Sistem stabil!
          </div>
        ) : (
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {errors.slice(0, 8).map((err, idx) => (
              <div
                key={err.id || idx}
                style={{
                  padding: "12px 16px",
                  borderBottom: idx === errors.length - 1 ? "none" : "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#ef4444" }}>
                    {getErrorTypeLabel(err.event)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {getFormatTime(err.createdAt)}
                  </span>
                </div>
                
                <p style={{ fontSize: "0.8rem", margin: 0, color: "var(--color-text)", fontWeight: "500" }}>
                  {err.message}
                </p>

                <div style={{ display: "flex", gap: "10px", fontSize: "0.7rem", color: "var(--color-text-muted)", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <Monitor size={12} />
                    {err.browser || "Browser"} ({err.os || "OS"})
                  </span>
                  <span>-</span>
                  <span>Program: {err.programTitle || "Live Radio"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
