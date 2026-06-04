import { useEffect, useState } from "react";
import type { BroadcastLog } from "../../../types/domain";
import type { DashboardSnapshot } from "../../../data/mockRepository";
import type { AuthSession } from "../../../services/auth.service";
import { BroadcastLogForm } from "../components/BroadcastLogForm";
import { subscribeBroadcastLogs, updateBroadcastLog } from "../services/broadcastLog.service";
import { ClipboardCheck, FileText, AlertTriangle, Search } from "lucide-react";
import "../styles/broadcastWorkflow.css";

type BroadcastLogPageProps = {
  data: DashboardSnapshot;
  session: AuthSession | null;
};

export default function BroadcastLogPage({ data, session }: BroadcastLogPageProps) {
  const [selectedProgram, setSelectedProgram] = useState(() => {
    return data.programs?.[0] || { title: "Siaran Radio SBL", host: "Penyiar" };
  });

  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [showLogForm, setShowLogForm] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeBroadcastLogs((list) => {
      setLogs(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleReviewLog = async (id: string) => {
    try {
      await updateBroadcastLog(id, { status: "reviewed" });
    } catch {
      alert("Gagal melakukan verifikasi log.");
    }
  };

  const handleArchiveLog = async (id: string) => {
    try {
      await updateBroadcastLog(id, { status: "archived" });
    } catch {
      alert("Gagal mengarsipkan log.");
    }
  };

  const isPimpinanOrAdmin = ["super_admin", "admin", "leader"].includes(session?.user.role || "");

  const filteredLogs = logs
    .filter((log) => filterStatus === "Semua" || log.status === filterStatus)
    .filter(
      (log) =>
        !searchQuery ||
        log.programTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.topics && log.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );

  const getStatusBadge = (status: BroadcastLog["status"]) => {
    switch (status) {
      case "reviewed":
        return <span className="log-status-tag status-reviewed">Reviewed</span>;
      case "submitted":
        return <span className="log-status-tag status-submitted">Submitted</span>;
      case "archived":
        return <span className="log-status-tag status-draft">Archived</span>;
      default:
        return <span className="log-status-tag status-draft">Draft</span>;
    }
  };

  return (
    <div className="broadcast-workflow-page">
      <section className="workflow-hero" aria-label="Log Harian Siaran">
        <div className="workflow-title-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Alur Kerja Studio</p>
            <h1>Log Harian Siaran</h1>
          </div>
        </div>
        <p>
          Dokumentasikan aktivitas siaran. Catat topik bahasan, narasumber/bintang tamu, lagu-lagu yang diputar, dan laporkan jika terdapat kendala teknis agar dapat dievaluasi.
        </p>
      </section>

      <div className="workflow-grid">
        {/* PANEL KIRI: FORM & SELEKTOR */}
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="workflow-card">
            <div className="workflow-card-header">
              <span className="workflow-card-title">
                <ClipboardCheck size={18} />
                Pilih Program Siaran
              </span>
            </div>
            <div className="workflow-card-body" style={{ padding: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {(data.programs || []).map((prog, idx: number) => {
                  const isSelected = selectedProgram.title === prog.title;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedProgram(prog);
                        setShowLogForm(true);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: isSelected ? "var(--color-primary-light, #e0e7ff)" : "var(--color-bg-subtle, #f8fafc)",
                        border: isSelected ? "1px solid var(--color-primary, #6366f1)" : "1px solid var(--color-border, #e2e8f0)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {prog.time}
                        </span>
                        <strong style={{ fontSize: "0.85rem", color: "var(--color-text-title)" }}>
                          {prog.title}
                        </strong>
                      </div>
                      <ChevronRightIcon />
                    </div>
                  );
                })}
              </div>

              {showLogForm && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
                  <div style={{ background: "var(--color-primary-light)", padding: "10px", borderRadius: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: "700" }}>PENCATATAN AKTIF:</span>
                    <h3 style={{ fontSize: "0.95rem", margin: "2px 0", color: "var(--color-text-title)" }}>{selectedProgram.title}</h3>
                  </div>
                  <BroadcastLogForm
                    programId={selectedProgram.title.toLowerCase().replace(/\s+/g, "-")}
                    programTitle={selectedProgram.title}
                    session={session}
                    onSuccess={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PANEL KANAN: RIWAYAT LOG */}
        <section className="workflow-card">
          <div className="workflow-card-header">
            <span className="workflow-card-title">
              <FileText size={18} />
              Riwayat Log Siaran
            </span>
          </div>

          <div className="workflow-card-body">
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              <label className="menu-search-field" style={{ flex: 1, margin: 0, minWidth: "200px" }}>
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Cari log atau topik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="premium-select"
                style={{ width: "130px", margin: 0, height: "40px" }}
              >
                <option value="Semua">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Memuat riwayat log...</div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                Belum ada data log siaran yang terdaftar.
              </div>
            ) : (
              <div className="logs-table-wrapper">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Tanggal & Jam</th>
                      <th>Program</th>
                      <th>Topik Bahasan</th>
                      <th>Kendala Teknis</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span style={{ display: "block", fontWeight: "600" }}>{log.date}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {log.actualStartTime} - {log.actualEndTime}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "var(--color-text-title)" }}>{log.programTitle}</strong>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            Oleh: {log.createdBy.split(" ")[0]}
                          </span>
                        </td>
                        <td>
                          {log.topics && log.topics.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {log.topics.map((t, i) => (
                                <span key={i} style={{ background: "var(--color-bg-subtle)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", border: "1px solid var(--color-border)" }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>-</span>
                          )}
                        </td>
                        <td>
                          {log.technicalIssues ? (
                            <span style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "2px" }}>
                              <AlertTriangle size={12} /> {log.technicalIssues}
                            </span>
                          ) : (
                            <span style={{ color: "#10b981", fontSize: "0.8rem" }}>Aman</span>
                          )}
                        </td>
                        <td>{getStatusBadge(log.status)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {isPimpinanOrAdmin && log.status === "submitted" && (
                              <button
                                type="button"
                                onClick={() => handleReviewLog(log.id)}
                                className="script-card-btn"
                                style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}
                              >
                                Review
                              </button>
                            )}
                            {isPimpinanOrAdmin && log.status === "reviewed" && (
                              <button
                                type="button"
                                onClick={() => handleArchiveLog(log.id)}
                                className="script-card-btn"
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                Arsip
                              </button>
                            )}
                            {!isPimpinanOrAdmin && log.status === "draft" && (
                              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Menunggu Kirim</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)" }}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
