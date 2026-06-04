import { useEffect, useState } from "react";
import type { DashboardSnapshot } from "../../../data/mockRepository";
import type { AuthSession } from "../../../services/auth.service";
import { RundownEditor } from "../components/RundownEditor";
import { PreBroadcastChecklistComponent } from "../components/PreBroadcastChecklist";
import { submitRundown, subscribeRundowns } from "../services/rundown.service";
import type { BroadcastRundown } from "../../../types/domain";
import { FileText, ClipboardCheck, Radio, Calendar } from "lucide-react";
import "../styles/broadcastWorkflow.css";

type RundownPageProps = {
  data: DashboardSnapshot;
  session: AuthSession | null;
};

export default function RundownPage({ data, session }: RundownPageProps) {
  const [selectedProgram, setSelectedProgram] = useState(() => {
    return data.programs?.[0] || { title: "Siaran Radio SBL", host: "Penyiar" };
  });

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rundowns, setRundowns] = useState<BroadcastRundown[]>([]);
  const [activeRundown, setActiveRundown] = useState<BroadcastRundown | null>(null);
  const [activeTab, setActiveTab] = useState<"checklist" | "rundown">("checklist");

  useEffect(() => {
    const unsub = subscribeRundowns(date, (list) => {
      setRundowns(list);
      // Cari rundown untuk program terpilih jika ada
      const match = list.find((r) => r.programTitle === selectedProgram.title);
      if (match) {
        setActiveRundown(match);
      } else {
        setActiveRundown(null);
      }
    });

    return () => unsub();
  }, [date, selectedProgram.title]);

  const handleInitRundown = async () => {
    const timeParts = selectedProgram.time ? selectedProgram.time.split(" - ") : ["08:00", "10:00"];
    const start = timeParts[0] || "08:00";
    const end = timeParts[1] || "10:00";

    const newRundown = await submitRundown({
      programId: selectedProgram.title.toLowerCase().replace(/\s+/g, "-"),
      programTitle: selectedProgram.title,
      date,
      startTime: start,
      endTime: end,
      hostIds: [session?.user.id || "announcer-1"],
      operatorId: session?.user.id,
      status: "draft",
      segments: [
        {
          id: `seg-init-1`,
          order: 1,
          title: "Pembukaan & Sapa Pendengar",
          type: "opening",
          plannedDurationMinutes: 5,
          notes: "Bacakan jargon stasiun SBL, putar lagu pembuka."
        }
      ],
      createdBy: session?.user.displayName || "Penyiar SBL"
    });

    setActiveRundown(newRundown);
    setActiveTab("rundown");
  };

  const getStatusBadgeClass = (s: BroadcastRundown["status"]) => {
    switch (s) {
      case "onAir":
        return "type-news";
      case "ready":
        return "type-music";
      case "completed":
        return "type-closing";
      default:
        return "status-draft";
    }
  };

  const getStatusLabel = (s: BroadcastRundown["status"]) => {
    switch (s) {
      case "onAir":
        return "Sedang Mengudara";
      case "ready":
        return "Siap Siar";
      case "completed":
        return "Selesai Siaran";
      default:
        return "Draft";
    }
  };

  return (
    <div className="broadcast-workflow-page">
      <section className="workflow-hero" aria-label="Rundown & Kesiapan Siaran">
        <div className="workflow-title-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Alur Kerja Studio</p>
            <h1>Rundown & Kesiapan Siaran</h1>
          </div>
        </div>
        <p>
          Persiapkan program siaran Anda. Cek kesiapan alat studio dan susun rundown segmen siaran digital untuk panduan di udara.
        </p>
      </section>

      <div className="workflow-grid">
        {/* PANEL KIRI: DAFTAR ACARA */}
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="workflow-card">
            <div className="workflow-card-header">
              <span className="workflow-card-title">
                <Calendar size={18} />
                Jadwal Hari Ini
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ fontSize: "0.8rem", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "2px 6px" }}
              />
            </div>
            <div className="workflow-card-body" style={{ padding: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(data.programs || []).map((prog, idx: number) => {
                  const isSelected = selectedProgram.title === prog.title;
                  const progRundown = rundowns.find((r) => r.programTitle === prog.title);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedProgram(prog)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: isSelected ? "var(--color-primary-light, #e0e7ff)" : "var(--color-bg-subtle, #f8fafc)",
                        border: isSelected ? "1px solid var(--color-primary, #6366f1)" : "1px solid var(--color-border, #e2e8f0)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.2s"
                      }}
                    >
                      <div>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {prog.time}
                        </span>
                        <strong style={{ fontSize: "0.85rem", color: "var(--color-text-title)" }}>
                          {prog.title}
                        </strong>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Penyiar: {prog.host}
                        </span>
                      </div>
                      
                      {progRundown ? (
                        <span className={`segment-type-badge ${getStatusBadgeClass(progRundown.status)}`} style={{ fontSize: "10px" }}>
                          {getStatusLabel(progRundown.status)}
                        </span>
                      ) : (
                        <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Belum siap</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* PANEL KANAN: WORKSPACE RUNDOWN / CHECKLIST */}
        <section className="workflow-card">
          <div className="workflow-card-header" style={{ padding: "0 16px", height: "54px" }}>
            <div style={{ display: "flex", gap: "16px", height: "100%" }}>
              <button
                type="button"
                onClick={() => setActiveTab("checklist")}
                style={{
                  height: "100%",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "checklist" ? "3px solid var(--color-primary, #6366f1)" : "3px solid transparent",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: activeTab === "checklist" ? "var(--color-primary, #6366f1)" : "var(--color-text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <ClipboardCheck size={16} /> Checklist Pra-Siaran
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rundown")}
                style={{
                  height: "100%",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "rundown" ? "3px solid var(--color-primary, #6366f1)" : "3px solid transparent",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: activeTab === "rundown" ? "var(--color-primary, #6366f1)" : "var(--color-text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FileText size={16} /> Rundown Digital
              </button>
            </div>
          </div>

          <div className="workflow-card-body">
            <div style={{ marginBottom: "16px", background: "var(--color-bg-subtle)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Program Aktif Workspace:</span>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text-title)", margin: "2px 0" }}>{selectedProgram.title}</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Jam Siar: {selectedProgram.time || "08.00 - 10.00"} • Penyiar: {selectedProgram.host}</span>
            </div>

            {activeTab === "checklist" && (
              <PreBroadcastChecklistComponent
                programId={selectedProgram.title.toLowerCase().replace(/\s+/g, "-")}
                programTitle={selectedProgram.title}
                date={date}
                session={session}
              />
            )}

            {activeTab === "rundown" && (
              activeRundown ? (
                <RundownEditor
                  rundown={activeRundown}
                  session={session}
                  onSave={() => {}}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "30px 20px" }}>
                  <Radio size={36} color="var(--color-text-muted)" style={{ marginBottom: "12px" }} />
                  <h3>Rundown Belum Dibuat</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "8px 0 16px" }}>
                    Rundown digital membantu penyiar membagi waktu segmen siaran dengan presisi.
                  </p>
                  <button type="button" onClick={handleInitRundown} className="premium-button-primary" style={{ width: "auto" }}>
                    Buat Rundown Siaran
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
