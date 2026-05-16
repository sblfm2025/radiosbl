import { useState, useMemo, type FormEvent } from "react";
import { Sparkles, Save, FileText, Bot } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { AuthSession } from "../services/auth.service";
import { generateProgramScript } from "../services/aiScript.service";
import { saveProgramScript } from "../services/programScript.service";
import type { BroadcastProgramSlot } from "../types/domain";
import { resolveAnnouncerText } from "../utils/announcerResolver";
import { mergeScheduleSlots } from "../services/scheduleSlot.service";

export function AiScriptPage({
  data,
  session,
}: {
  data: DashboardSnapshot;
  session: AuthSession | null;
}) {
  const [scheduleSlots] = useState(() => mergeScheduleSlots(data.weeklySchedule));
  const [scriptSlotKey, setScriptSlotKey] = useState("");
  const [scriptTone, setScriptTone] = useState("hangat, informatif, dan dekat dengan pendengar Pinrang");
  const [scriptDuration, setScriptDuration] = useState(3);
  const [scriptIntervention, setScriptIntervention] = useState("");
  const [scriptDraft, setScriptDraft] = useState("");
  const [scriptNotice, setScriptNotice] = useState("");
  const [scriptError, setScriptError] = useState("");
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptSaving, setScriptSaving] = useState(false);

  const selectedScriptSlot = useMemo(() => {
    const fallback = scheduleSlots[0];
    if (!scriptSlotKey) return fallback;
    return (
      scheduleSlots.find(
        (slot: BroadcastProgramSlot) => `${slot.day}-${slot.time}-${slot.program}` === scriptSlotKey
      ) || fallback
    );
  }, [scheduleSlots, scriptSlotKey]);

  function formatAirNames(value: string): string {
    return resolveAnnouncerText(value)
      .map((part) => (part.kind === "announcer" ? part.profile.airName : part.label))
      .join(" / ");
  }

  async function handleGenerateScript(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScriptSlot) {
      setScriptError("Pilih program siaran terlebih dahulu.");
      return;
    }

    setScriptLoading(true);
    setScriptError("");
    setScriptNotice("");

    try {
      const result = await generateProgramScript({
        provider: "gemini",
        programTitle: selectedScriptSlot.program,
        scheduleTime: selectedScriptSlot.time,
        day: selectedScriptSlot.day,
        announcerName: formatAirNames(selectedScriptSlot.announcer),
        description: selectedScriptSlot.description,
        tone: scriptTone,
        durationMinutes: scriptDuration,
        intervention: scriptIntervention
      });

      setScriptDraft(result.text);
      if (result.warning) {
        setScriptNotice("Gemini sedang sibuk. Naskah sementara disiapkan agar tetap bisa diedit.");
      } else {
        setScriptNotice(
          result.demo
            ? "Mode Demo: Menampilkan naskah sementara."
            : "Draft naskah berhasil dibuat dengan Gemini 2.5 Flash."
        );
      }
    } catch (currentError) {
      setScriptError(
        currentError instanceof Error ? currentError.message : "AI gagal menyusun naskah siaran."
      );
    } finally {
      setScriptLoading(false);
    }
  }

  async function handleSaveScript() {
    if (!selectedScriptSlot || !scriptDraft.trim()) {
      setScriptError("Buat atau isi naskah terlebih dahulu.");
      return;
    }

    setScriptSaving(true);
    setScriptError("");

    try {
      const saved = await saveProgramScript({
        programTitle: selectedScriptSlot.program,
        scheduleTime: selectedScriptSlot.time,
        day: selectedScriptSlot.day,
        announcerName: formatAirNames(selectedScriptSlot.announcer),
        description: selectedScriptSlot.description,
        provider: "gemini",
        tone: scriptTone,
        durationMinutes: scriptDuration,
        intervention: scriptIntervention.trim() || undefined,
        content: scriptDraft,
        status: "draft",
        createdBy: session?.user.id || "demo-admin",
        createdByName: session?.user.displayName || "Admin Radio SBL"
      });

      setScriptNotice(`Draft naskah ${saved.programTitle} berhasil disimpan ke arsip.`);
    } catch (currentError) {
      setScriptError(
        currentError instanceof Error ? currentError.message : "Draft naskah gagal disimpan."
      );
    } finally {
      setScriptSaving(false);
    }
  }

  return (
    <div className="ai-script-page">
      {/* Header Premium */}
      <header className="page-header-premium">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-icon-wrap">
              <Sparkles className="sparkle-icon" />
            </div>
            <div className="brand-text">
              <p className="eyebrow-accent">Creative Assistant</p>
              <h1>Buat Naskah AI</h1>
            </div>
          </div>
          <div className="header-meta">
            <span className="model-badge">
              <Bot size={14} />
              Gemini 1.5 Flash
            </span>
          </div>
        </div>
      </header>

      <main className="ai-script-container">
        <div className="ai-layout-grid">
          {/* Sisi Kiri: Konfigurasi */}
          <section className="ai-config-panel">
            <div className="panel-inner">
              <div className="panel-header">
                <Sparkles size={18} />
                <h2>Konfigurasi Naskah</h2>
              </div>
              
              <form onSubmit={handleGenerateScript} className="ai-form-stack">
                <div className="form-field">
                  <label>Program Siaran</label>
                  <select
                    value={scriptSlotKey}
                    onChange={(e) => setScriptSlotKey(e.target.value)}
                    className="premium-select"
                  >
                    {scheduleSlots.map((slot: BroadcastProgramSlot) => {
                      const key = `${slot.day}-${slot.time}-${slot.program}`;
                      return (
                        <option key={key} value={key}>
                          {slot.day} • {slot.program}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-row-dual">
                  <div className="form-field">
                    <label>Durasi (Menit)</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={scriptDuration}
                      onChange={(e) => setScriptDuration(Number(e.target.value))}
                      className="premium-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>Gaya Siaran</label>
                    <input
                      value={scriptTone}
                      onChange={(e) => setScriptTone(e.target.value)}
                      placeholder="Contoh: Hangat, enerjik..."
                      className="premium-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Instruksi Tambahan (Opsional)</label>
                  <textarea
                    value={scriptIntervention}
                    onChange={(e) => setScriptIntervention(e.target.value)}
                    placeholder="Sapa pendengar di pesisir, buka dengan pantun, dll..."
                    rows={3}
                    className="premium-textarea"
                  />
                </div>

                <button type="submit" disabled={scriptLoading} className="premium-button-primary">
                  {scriptLoading ? (
                    <>
                      <div className="spinner-white" />
                      <span>Menyusun Kreativitas...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={20} />
                      <span>Hasilkan Naskah AI</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* Sisi Kanan: Hasil */}
          <section className="ai-result-panel">
            <div className="panel-inner">
              <div className="panel-header">
                <FileText size={18} />
                <h2>Hasil Draft Naskah</h2>
                {scriptDraft && (
                  <button type="button" onClick={handleSaveScript} disabled={scriptSaving} className="save-action-badge">
                    <Save size={14} />
                    {scriptSaving ? "Menyimpan..." : "Simpan Ke Arsip"}
                  </button>
                )}
              </div>

              <div className="result-body">
                {scriptNotice && <div className="status-alert info">{scriptNotice}</div>}
                {scriptError && <div className="status-alert error">{scriptError}</div>}
                
                <div className="editor-wrap">
                  <textarea
                    value={scriptDraft}
                    onChange={(e) => setScriptDraft(e.target.value)}
                    placeholder="Naskah AI akan muncul di sini..."
                    className="premium-editor"
                    readOnly={scriptLoading}
                  />
                  {!scriptDraft && !scriptLoading && (
                    <div className="ai-placeholder-state">
                      <div className="icon-orbit">
                        <Sparkles size={40} className="orbit-main" />
                        <div className="orbit-dot" />
                      </div>
                      <h3>Asisten Kreatif Siap Membantu</h3>
                      <p>Pilih program dan atur gaya siaran Anda untuk mulai menghasilkan naskah otomatis.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
