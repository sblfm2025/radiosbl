import { useEffect, useState } from "react";
import type { ShiftHandover } from "../../../types/domain";
import type { AuthSession } from "../../../services/auth.service";
import { HandoverCard } from "../components/HandoverCard";
import { createHandover, subscribeHandovers } from "../services/handover.service";
import { ArrowLeftRight, Send, AlertCircle, Plus, Trash2 } from "lucide-react";
import "../styles/broadcastWorkflow.css";

type HandoverPageProps = {
  session: AuthSession | null;
};

export default function HandoverPage({ session }: HandoverPageProps) {
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [notes, setNotes] = useState("");
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [priority, setPriority] = useState<ShiftHandover["priority"]>("normal");
  const [shiftLabel, setShiftLabel] = useState("Pagi (08:00 - 14:00)");

  // Pending tasks list
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeHandovers((list) => {
      setHandovers(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    setPendingTasks([...pendingTasks, taskInput.trim()]);
    setTaskInput("");
  };

  const handleRemoveTask = (idx: number) => {
    setPendingTasks(pendingTasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createHandover({
        date: new Date().toISOString().split("T")[0],
        fromUserId: session.user.id,
        fromUserName: session.user.displayName,
        notes: notes.trim(),
        technicalNotes: technicalNotes.trim() || undefined,
        pendingRequests: pendingTasks.length > 0 ? pendingTasks : undefined,
        priority,
        shiftLabel,
        status: "open"
      });

      setSuccess("Log serah terima shift berhasil dikirim!");
      setNotes("");
      setTechnicalNotes("");
      setPendingTasks([]);
      setPriority("normal");
    } catch {
      setError("Gagal mengirim data serah terima shift.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="broadcast-workflow-page">
      <section className="workflow-hero" aria-label="Serah Terima Shift (Handover)">
        <div className="workflow-title-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Alur Kerja Studio</p>
            <h1>Serah Terima Shift (Handover)</h1>
          </div>
        </div>
        <p>
          Lakukan serah terima tugas dengan rapi. Informasikan tugas yang masih tertunda, catatan teknis stasiun pemancar/mixer, dan prioritas kendala kepada petugas shift berikutnya.
        </p>
      </section>

      <div className="workflow-grid">
        {/* PANEL KIRI: FORM HANDOVER */}
        <section className="workflow-card">
          <div className="workflow-card-header">
            <span className="workflow-card-title">
              <Send size={18} />
              Buat Serah Terima Baru
            </span>
          </div>

          <div className="workflow-card-body">
            {success && <div className="status-alert success">{success}</div>}
            {error && <div className="status-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleSubmit} className="log-form-container">
              <div className="form-field">
                <label>Pilih Shift Kerja Anda:</label>
                <select
                  value={shiftLabel}
                  onChange={(e) => setShiftLabel(e.target.value)}
                  className="premium-select"
                >
                  <option value="Pagi (08:00 - 14:00)">Pagi (08:00 - 14:00)</option>
                  <option value="Sore (14:00 - 18:00)">Sore (14:00 - 18:00)</option>
                  <option value="Malam (18:00 - 22:00)">Malam (18:00 - 22:00)</option>
                  <option value="Lain-lain / Khusus">Lain-lain / Khusus</option>
                </select>
              </div>

              <div className="form-field">
                <label>Prioritas Pesan:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ShiftHandover["priority"])}
                  className="premium-select"
                >
                  <option value="low">Rendah (Hanya Informasi)</option>
                  <option value="normal">Normal</option>
                  <option value="high">Tinggi (Penting & Mendesak)</option>
                </select>
              </div>

              <div className="form-field">
                <label>Pesan Handover & Aktivitas Utama:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ceritakan status siaran, pengumuman penting, atau arahan dari pimpinan..."
                  rows={4}
                  className="premium-textarea"
                  required
                />
              </div>

              <div className="form-field">
                <label>Catatan Teknis Mixer / Pemancar (Opsional):</label>
                <textarea
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Misal: Indikator DB meter agak naik, mic 2 tolong dikecilkan sedikit..."
                  rows={2}
                  className="premium-textarea"
                />
              </div>

              {/* Tugas Tertunda */}
              <div style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "12px", background: "var(--color-bg-subtle)" }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px", color: "var(--color-text-title)" }}>
                  Tugas / Pekerjaan Tertunda:
                </span>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <input
                    type="text"
                    placeholder="Contoh: Titipan ad-libs iklan XL jam 15.00"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    className="premium-input"
                    style={{ flex: 1, fontSize: "0.8rem", height: "36px" }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="save-action-badge secondary"
                    style={{ border: "none", cursor: "pointer", height: "36px", padding: "0 12px" }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {pendingTasks.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {pendingTasks.map((task, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-card)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", border: "1px solid var(--color-border)" }}>
                        <span>{task}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(idx)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting} className="premium-button-primary">
                {submitting ? "Mengirim..." : "Kirim Handover"}
              </button>
            </form>
          </div>
        </section>

        {/* PANEL KANAN: FEEDS SERAH TERIMA */}
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="workflow-card-header" style={{ borderRadius: "12px 12px 0 0", border: "1px solid var(--color-border)", borderBottom: "none" }}>
            <span className="workflow-card-title">
              <ArrowLeftRight size={18} />
              Daftar Serah Terima Terkini
            </span>
          </div>

          <div className="handover-feed">
            {loading ? (
              <div className="workflow-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                Memuat riwayat serah terima...
              </div>
            ) : handovers.length === 0 ? (
              <div className="workflow-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                Belum ada aktivitas serah terima shift hari ini.
              </div>
            ) : (
              handovers.map((item) => (
                <HandoverCard
                  key={item.id}
                  handover={item}
                  session={session}
                  onAcknowledged={() => {}}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
