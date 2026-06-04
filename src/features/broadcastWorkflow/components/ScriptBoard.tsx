import { useEffect, useState } from "react";
import type { ProgramScriptDraft } from "../../../types/domain";
import { listProgramScripts, updateProgramScriptStatus } from "../../../services/programScript.service";
import { FileText, Radio, CheckCircle, Archive, ArrowRight, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ScriptBoard() {
  const [scripts, setScripts] = useState<ProgramScriptDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await listProgramScripts();
      setScripts(data);
    } catch {
      setError("Gagal memuat naskah.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const moveStatus = async (id: string, newStatus: ProgramScriptDraft["status"]) => {
    try {
      await updateProgramScriptStatus(id, newStatus);
      setScripts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s))
      );
    } catch {
      alert("Gagal mengubah status naskah.");
    }
  };

  const columns: Array<{
    id: ProgramScriptDraft["status"];
    label: string;
    icon: LucideIcon;
    color: string;
  }> = [
    { id: "draft", label: "Draft Naskah", icon: FileText, color: "#475569" },
    { id: "approved", label: "Siap Siar", icon: Radio, color: "#6366f1" },
    { id: "used", label: "Digunakan", icon: CheckCircle, color: "#10b981" },
    { id: "archived", label: "Arsip", icon: Archive, color: "#94a3b8" }
  ];

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)" }}>Memuat Papan Naskah...</div>;
  }

  return (
    <div className="script-board-container">
      {error && <div className="status-alert error">{error}</div>}
      
      <div className="script-board-columns">
        {columns.map((col) => {
          const Icon = col.icon;
          const colScripts = scripts.filter((s) => s.status === col.id);

          return (
            <div key={col.id} className="script-board-column">
              <div className="script-board-column-header">
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon size={16} color={col.color} />
                  <strong>{col.label}</strong>
                </span>
                <span className="segment-order-badge" style={{ background: col.color, width: "18px", height: "18px", fontSize: "10px" }}>
                  {colScripts.length}
                </span>
              </div>

              <div className="script-board-card-list">
                {colScripts.length === 0 ? (
                  <div style={{ padding: "20px 10px", textAlign: "center", fontSize: "0.8rem", color: "var(--color-text-muted)", border: "1px dashed var(--color-border)", borderRadius: "8px" }}>
                    Tidak ada naskah
                  </div>
                ) : (
                  colScripts.map((script) => (
                    <div key={script.id} className="script-board-card">
                      <div className="script-card-meta">
                        {script.day} • {script.scheduleTime}
                      </div>
                      <div className="script-card-title">{script.programTitle}</div>
                      <div className="script-card-preview">{script.content}</div>
                      
                      <div className="script-card-footer">
                        <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                          Oleh: {script.createdByName.split(" ")[0]}
                        </span>
                        
                        <div style={{ display: "flex", gap: "4px" }}>
                          {col.id === "draft" && (
                            <button
                              type="button"
                              onClick={() => moveStatus(script.id, "approved")}
                              className="script-card-btn"
                              title="Setujui untuk Siap Siar"
                            >
                              Siap Siar <ArrowRight size={12} style={{ marginLeft: "2px", display: "inline" }} />
                            </button>
                          )}
                          {col.id === "approved" && (
                            <>
                              <button
                                type="button"
                                onClick={() => moveStatus(script.id, "draft")}
                                className="script-card-btn"
                                style={{ color: "var(--color-text-muted)" }}
                                title="Kembalikan ke Draft"
                              >
                                <ArrowLeft size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveStatus(script.id, "used")}
                                className="script-card-btn"
                                title="Tandai Sudah Dipakai Siaran"
                              >
                                Pakai <ArrowRight size={12} style={{ marginLeft: "2px", display: "inline" }} />
                              </button>
                            </>
                          )}
                          {col.id === "used" && (
                            <>
                              <button
                                type="button"
                                onClick={() => moveStatus(script.id, "approved")}
                                className="script-card-btn"
                                style={{ color: "var(--color-text-muted)" }}
                                title="Kembalikan ke Siap Siar"
                              >
                                <ArrowLeft size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveStatus(script.id, "archived")}
                                className="script-card-btn"
                                style={{ color: "var(--color-text-muted)" }}
                                title="Pindahkan ke Arsip"
                              >
                                Arsip <ArrowRight size={12} style={{ marginLeft: "2px", display: "inline" }} />
                              </button>
                            </>
                          )}
                          {col.id === "archived" && (
                            <button
                              type="button"
                              onClick={() => moveStatus(script.id, "used")}
                              className="script-card-btn"
                              style={{ color: "var(--color-text-muted)" }}
                              title="Kembalikan ke Digunakan"
                            >
                              <ArrowLeft size={12} /> Buka
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
