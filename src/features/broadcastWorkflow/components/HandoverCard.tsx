import type { ShiftHandover } from "../../../types/domain";
import { acknowledgeHandover } from "../services/handover.service";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AuthSession } from "../../../services/auth.service";

type HandoverCardProps = {
  handover: ShiftHandover;
  session: AuthSession | null;
  onAcknowledged?: () => void;
};

export function HandoverCard({ handover, session, onAcknowledged }: HandoverCardProps) {
  const isPending = handover.status === "open";
  const currentUserIsRecipient = session && session.user.id !== handover.fromUserId;

  const handleAcknowledge = async () => {
    if (!session) return;
    try {
      await acknowledgeHandover(handover.id, session.user.id, session.user.displayName);
      onAcknowledged?.();
    } catch {
      alert("Gagal melakukan konfirmasi serah terima.");
    }
  };

  const getPriorityLabel = (p: ShiftHandover["priority"]) => {
    switch (p) {
      case "high":
        return "Penting & Mendesak";
      case "normal":
        return "Normal";
      case "low":
        return "Rendah";
      default:
        return p;
    }
  };

  const formatDateString = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`handover-card priority-${handover.priority}`}>
      <div className="handover-card-header">
        <div className="handover-user-info">
          <div className="handover-user-avatar">
            {(handover.fromUserName || "O").charAt(0).toUpperCase()}
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-title)" }}>
              {handover.fromUserName || "Petugas Studio"}
            </span>
            <span className="handover-time">
              Shift: {handover.shiftLabel || "Siaran"} • {formatDateString(handover.createdAt.toString())}
            </span>
          </div>
        </div>

        <div className="handover-badge-row">
          <span className={`priority-badge ${handover.priority}`}>
            {getPriorityLabel(handover.priority)}
          </span>
          {handover.status === "acknowledged" && (
            <span className="priority-badge low" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", gap: "2px" }}>
              <CheckCircle2 size={12} /> Diterima
            </span>
          )}
        </div>
      </div>

      <div className="handover-content">
        {handover.notes}
      </div>

      {handover.technicalNotes && (
        <div className="handover-technical-notes">
          <strong>Catatan Teknis Mixer & Pemancar:</strong>
          {handover.technicalNotes}
        </div>
      )}

      {handover.pendingRequests && handover.pendingRequests.length > 0 && (
        <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "12px" }}>
          <strong>Tugas / Request Tertunda:</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            {handover.pendingRequests.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="handover-footer">
        <span className="handover-status-text">
          {handover.status === "acknowledged" ? (
            <>
              <Clock size={12} /> Dikonfirmasi oleh {handover.acknowledgedByName?.split(" ")[0]} pkl {handover.acknowledgedAt ? formatDateString(handover.acknowledgedAt.toString()) : ""}
            </>
          ) : (
            <>
              <AlertTriangle size={12} color="#f59e0b" /> Menunggu serah terima shift berikutnya...
            </>
          )}
        </span>

        {isPending && currentUserIsRecipient && (
          <button
            type="button"
            onClick={handleAcknowledge}
            className="handover-acknowledge-btn"
          >
            Terima Tugas Shift
          </button>
        )}
      </div>
    </div>
  );
}
