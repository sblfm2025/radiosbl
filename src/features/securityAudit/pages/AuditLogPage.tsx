import { useEffect, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { AuditLogTable } from "../components/AuditLogTable";
import { subscribeAuditLogs, listAuditLogs } from "../services/auditLog.service";
import type { SecurityAuditLog } from "../../../types/domain";
import type { AuthSession } from "../../../services/auth.service";
import { RefreshCw, Search, ShieldAlert } from "lucide-react";
import "../styles/securityAudit.css";

type AuditLogPageProps = {
  session: AuthSession | null;
};

export default function AuditLogPage({ session }: AuditLogPageProps) {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Jalankan realtime subscription untuk audit logs
    const unsubscribe = subscribeAuditLogs((newLogs) => {
      setLogs(newLogs);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await listAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error("Gagal memuat log audit:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return (
      (log.actorName && log.actorName.toLowerCase().includes(keyword)) ||
      log.action.toLowerCase().includes(keyword) ||
      (log.actorRole && log.actorRole.toLowerCase().includes(keyword)) ||
      (log.targetCollection && log.targetCollection.toLowerCase().includes(keyword))
    );
  });

  return (
    <>
      <div className="sec-audit-page-head">
        <PageHeader
          eyebrow="Keamanan Stasiun"
          title="Log Audit Keamanan"
          description={`Pencatatan aktivitas penting, audit modifikasi data jadwal, persetujuan program, perubahan akun, serta otorisasi data stasiun Radio SBL secara transparan.${session ? ` Operator: ${session.user.displayName}.` : ""}`}
        />
        <button
          type="button"
          onClick={() => {
            void handleManualRefresh();
          }}
          className="location-btn secondary"
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          Segarkan Log
        </button>
      </div>

      <div className="sec-audit-content sec-audit-content-spaced">
        <div className="sec-audit-control-panel">
          <div className="sec-audit-search-bar">
            <Search size={18} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama aktor, tindakan, role, atau target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="sec-audit-spinner">
            <div className="spinner-small"></div>
            <span>Memuat data log audit...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="sec-audit-empty-state">
            <ShieldAlert size={44} />
            <h3>Data belum dapat dimuat atau kosong.</h3>
            <p>Coba muat ulang halaman atau periksa sambungan database.</p>
            <button type="button" onClick={() => void handleManualRefresh()} className="location-btn primary sec-audit-retry">
              Coba Muat Ulang
            </button>
          </div>
        ) : (
          <AuditLogTable logs={filteredLogs} />
        )}
      </div>
    </>
  );
}
