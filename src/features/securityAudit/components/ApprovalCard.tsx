import { useState } from "react";
import type { ApprovalRequest } from "../../../types/domain";
import { Check, X, FileText, Calendar, RefreshCw } from "lucide-react";
import "../styles/securityAudit.css";

type ApprovalCardProps = {
  request: ApprovalRequest;
  onApprove: (id: string, note: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  isProcessing: boolean;
};

export function ApprovalCard({
  request,
  onApprove,
  onReject,
  isProcessing
}: ApprovalCardProps) {
  const [note, setNote] = useState("");

  const getFormatTime = (isoString: any) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const getRequestTypeLabel = (type: ApprovalRequest["type"]) => {
    switch (type) {
      case "notification":
        return "Notifikasi Massal";
      case "public_content":
        return "Konten Publik (Podcast/Video)";
      case "schedule_change":
        return "Perubahan Jadwal Utama";
      case "analytics_export":
        return "Ekspor Lokasi Presisi";
      default:
        return "Pengajuan Umum";
    }
  };

  return (
    <article className="approval-card">
      <div className="approval-card-header">
        <div>
          <span className="approval-type-badge">
            {getRequestTypeLabel(request.type)}
          </span>
          <h4 className="approval-card-title">{request.title}</h4>
          <p className="approval-card-meta">
            Diajukan oleh: <strong>{request.requestedByName || "Operator"}</strong>
            &nbsp;·&nbsp;
            <Calendar size={11} style={{ display: "inline", verticalAlign: "middle" }} />
            &nbsp;{getFormatTime(request.createdAt)}
          </p>
        </div>
        <span className={`approval-status-badge ${request.status}`}>
          {request.status}
        </span>
      </div>

      {/* Detail Payload Pengajuan */}
      <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.78rem" }}>
        <h5 style={{ margin: "0 0 6px 0", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px", color: "var(--color-text-title)" }}>
          <FileText size={13} />
          Detail Data Pengajuan
        </h5>
        <pre style={{ margin: 0, overflowX: "auto", fontFamily: "monospace", color: "var(--color-text)", whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: "0.75rem" }}>
          {JSON.stringify(request.payload, null, 2)}
        </pre>
      </div>

      {/* Catatan Review (Jika sudah diproses) */}
      {request.status !== "pending" && request.reviewNote && (
        <div className="approval-review-note">
          Ditinjau oleh <strong>{request.reviewedByName || "Admin"}</strong>: "{request.reviewNote}"
        </div>
      )}

      {/* Form Tindakan Admin — hanya tampil saat status pending */}
      {request.status === "pending" && (
        <div className="approval-card-actions">
          <input
            type="text"
            placeholder="Catatan review (opsional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isProcessing}
            className="approval-note-input"
          />
          <button
            type="button"
            onClick={() => onReject(request.id, note)}
            disabled={isProcessing}
            className="approval-btn-reject"
          >
            {isProcessing ? <RefreshCw size={13} className="spin" /> : <X size={14} />}
            Tolak
          </button>
          <button
            type="button"
            onClick={() => onApprove(request.id, note)}
            disabled={isProcessing}
            className="approval-btn-approve"
          >
            {isProcessing ? <RefreshCw size={13} className="spin" /> : <Check size={14} />}
            Setujui
          </button>
        </div>
      )}
    </article>
  );
}
