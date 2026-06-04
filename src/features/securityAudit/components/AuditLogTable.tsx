import type { SecurityAuditLog, TimestampLike } from "../../../types/domain";
import { ShieldCheck, User, Calendar } from "lucide-react";
import "../styles/securityAudit.css";

type AuditLogTableProps = {
  logs: SecurityAuditLog[];
};

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const getFormatTime = (isoString: TimestampLike) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return String(isoString);
    }
  };

  const getActionBadgeVariant = (action: string): string => {
    if (action.includes("delete") || action.includes("reject")) return "delete";
    if (action.includes("approve") || action.includes("publish")) return "publish";
    if (action.includes("review")) return "review";
    return "";
  };

  return (
    <div className="audit-table-wrapper">
      <div className="workflow-card-header">
        <span className="workflow-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={18} color="#10b981" />
          Aktivitas Keamanan &amp; Perubahan Sistem
        </span>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Total Aksi: {logs.length}</span>
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
          Belum ada aktivitas keamanan yang tercatat.
        </div>
      ) : (
        <table className="audit-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Aktor / Pengguna</th>
              <th>Tindakan</th>
              <th>Modul Target</th>
              <th>Detail Perubahan</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="audit-time-cell">
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={12} />
                    {getFormatTime(log.createdAt)}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                      <User size={13} />
                      {log.actorName || "Sistem"}
                    </span>
                    <small style={{ color: "var(--color-text-muted)", fontSize: "10px", textTransform: "capitalize" }}>
                      {log.actorRole || "sistem"}
                    </small>
                  </div>
                </td>
                <td>
                  <span className={`audit-action-badge ${getActionBadgeVariant(log.action)}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  {log.targetCollection ? `${log.targetCollection} (${log.targetId?.substring(0, 8)}...)` : "-"}
                </td>
                <td style={{ maxWidth: "280px" }}>
                  <div style={{ fontSize: "0.73rem", color: "var(--color-text)", wordBreak: "break-all" }}>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div style={{ marginBottom: "3px" }}><strong>Meta: </strong>{JSON.stringify(log.metadata)}</div>
                    )}
                    {log.before && (
                      <div style={{ color: "#ef4444" }}><strong>Sebelum: </strong>{JSON.stringify(log.before)}</div>
                    )}
                    {log.after && (
                      <div style={{ color: "#10b981" }}><strong>Sesudah: </strong>{JSON.stringify(log.after)}</div>
                    )}
                    {!log.before && !log.after && !log.metadata && (
                      <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>Tidak ada detail</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
