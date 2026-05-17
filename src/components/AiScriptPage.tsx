import { useState, useMemo, useEffect, useRef, type FormEvent } from "react";
import { Bot, CalendarClock, FileText, Radio, Save, Sparkles, Wand2, MonitorPlay, X, Play, Pause, FastForward, Rewind, Copy, Archive } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { AuthSession } from "../services/auth.service";
import { generateProgramScript, rewriteProgramScript } from "../services/aiScript.service";
import { saveProgramScript, listProgramScripts } from "../services/programScript.service";
import type { BroadcastProgramSlot, ProgramScriptDraft } from "../types/domain";
import { resolveAnnouncerText } from "../utils/announcerResolver";
import { mergeScheduleSlots } from "../services/scheduleSlot.service";

type StudioTab = "generator" | "drafts" | "review" | "ready";
type RewriteMode = "formal" | "santai" | "singkat" | "energik" | "anak-muda" | "profesional";

const studioTabs: Array<{ id: StudioTab; label: string; icon: typeof Wand2 }> = [
  { id: "generator", label: "Generator", icon: Wand2 },
  { id: "drafts", label: "Draft", icon: Save },
  { id: "review", label: "Review", icon: FileText },
  { id: "ready", label: "Siap Siaran", icon: Radio }
];

const rewriteModes: Array<{ id: RewriteMode; label: string }> = [
  { id: "singkat", label: "Singkat" },
  { id: "energik", label: "Energik" },
  { id: "anak-muda", label: "Anak muda" },
  { id: "formal", label: "Formal" }
];

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
  const [isRewriting, setIsRewriting] = useState(false);

  // --- Fitur Studio ---
  const [activeTab, setActiveTab] = useState<StudioTab>("generator");
  const [scriptTemplate, setScriptTemplate] = useState("Opening"); // Kategori Naskah
  
  // --- Fitur Teleprompter ---
  const [isTeleprompter, setIsTeleprompter] = useState(false);
  const [promptSpeed, setPromptSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const promptContainerRef = useRef<HTMLDivElement>(null);

  // --- Fitur Drafts ---
  const [savedScripts, setSavedScripts] = useState<ProgramScriptDraft[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);

  useEffect(() => {
    if (activeTab === "drafts") {
      loadSavedScripts();
    }
  }, [activeTab]);

  async function loadSavedScripts() {
    setLoadingScripts(true);
    try {
      const data = await listProgramScripts();
      // Urutkan draft terbaru ke atas
      setSavedScripts(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Gagal memuat draf naskah:", err);
    } finally {
      setLoadingScripts(false);
    }
  }

  // Auto-scroll Teleprompter
  useEffect(() => {
    let animationId: number;
    if (isTeleprompter && isPlaying && promptContainerRef.current) {
      const scroll = () => {
        if (promptContainerRef.current) {
          promptContainerRef.current.scrollTop += promptSpeed;
        }
        animationId = requestAnimationFrame(scroll);
      };
      animationId = requestAnimationFrame(scroll);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isTeleprompter, isPlaying, promptSpeed]);

  const scriptStats = useMemo(() => {
    if (!scriptDraft) return null;
    const words = scriptDraft.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = scriptDraft.length;
    const readingSpeedWPM = 130; // 130 kata per menit untuk siaran santai
    const durationMinutes = Math.floor(words / readingSpeedWPM);
    const durationSeconds = Math.round((words % readingSpeedWPM) / (readingSpeedWPM / 60));
    
    return {
      words,
      chars,
      durationText: `${durationMinutes}m ${durationSeconds}d`
    };
  }, [scriptDraft]);

  const selectedScriptSlot = useMemo(() => {
    const fallback = scheduleSlots[0];
    if (!scriptSlotKey) return fallback;
    return (
      scheduleSlots.find(
        (slot: BroadcastProgramSlot) => `${slot.day}-${slot.time}-${slot.program}` === scriptSlotKey
      ) || fallback
    );
  }, [scheduleSlots, scriptSlotKey]);

  const groupedSlots = useMemo(() => {
    return scheduleSlots.reduce((acc: Record<string, BroadcastProgramSlot[]>, slot: BroadcastProgramSlot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    }, {});
  }, [scheduleSlots]);

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
        intervention: `Template: ${scriptTemplate}. ${scriptIntervention}`
      });

      setScriptDraft(result.text);
      if (result.warning) {
        setScriptNotice("Asisten AI sedang sibuk. Naskah sementara disiapkan agar tetap bisa diedit.");
      } else {
        setScriptNotice(
          result.demo
            ? "Mode Demo: Menampilkan naskah sementara."
            : "Draft naskah berhasil dibuat dan siap disunting."
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
      // Perbarui draf lokal
      setSavedScripts([saved, ...savedScripts]);
    } catch (currentError) {
      setScriptError(
        currentError instanceof Error ? currentError.message : "Draft naskah gagal disimpan."
      );
    } finally {
      setScriptSaving(false);
    }
  }

  async function handleRewrite(mode: RewriteMode) {
    if (!scriptDraft.trim()) return;
    setIsRewriting(true);
    setScriptError("");
    setScriptNotice("AI sedang menulis ulang naskah Anda...");
    try {
      const newText = await rewriteProgramScript(scriptDraft, mode);
      setScriptDraft(newText);
      setScriptNotice("Naskah berhasil ditulis ulang dengan gaya baru.");
    } catch (err) {
      setScriptError(err instanceof Error ? err.message : "Gagal menulis ulang naskah.");
      setScriptNotice("");
    } finally {
      setIsRewriting(false);
    }
  }

  async function handleCopyScript() {
    if (!scriptDraft.trim()) return;

    try {
      await navigator.clipboard.writeText(scriptDraft);
      setScriptNotice("Naskah berhasil disalin ke clipboard.");
      setScriptError("");
    } catch {
      setScriptError("Gagal menyalin naskah. Pilih teks naskah lalu salin manual.");
    }
  }

  return (
    <div className="ai-script-page">
      <section className="ai-script-hero" aria-label="Pembuatan naskah siaran dengan AI">
        <div className="ai-script-hero-copy">
          <div className="schedule-title-lockup">
            <img src="/LogoSBL.svg" alt="Radio SBL" />
            <div>
              <p className="eyebrow">Asisten kreatif</p>
              <h1>Buat Naskah AI</h1>
            </div>
          </div>
          <p>
            Susun draft opening, isi siaran, cue interaksi, dan closing berdasarkan
            jadwal resmi Radio SBL. Hasilnya tetap bisa diedit sebelum disimpan.
          </p>
        </div>

        <div className="ai-script-context-card">
          <span>
            <CalendarClock size={18} />
            {selectedScriptSlot.day}, {selectedScriptSlot.time}
          </span>
          <strong>{selectedScriptSlot.program}</strong>
          <p>{selectedScriptSlot.description || "Pilih program untuk menyesuaikan konteks naskah."}</p>
          <em>
            <Radio size={16} />
            {formatAirNames(selectedScriptSlot.announcer) || "Penyiar Radio SBL"}
          </em>
        </div>
      </section>

      <div className="ai-studio-tabs" role="tablist" aria-label="Ruang kerja naskah">
        {studioTabs.map((tab) => {
          const Icon = tab.icon;
          return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "active" : ""}
          >
            <Icon size={16} /> <span>{tab.label}</span>
          </button>
          );
        })}
      </div>

      <main className="ai-script-container">
        {activeTab === "generator" && (
        <div className="ai-layout-grid">
          {/* PANEL KIRI: KONFIGURASI */}
          <section className="ai-config-panel">
            <div className="panel-inner">
              <div className="panel-header">
                <Wand2 size={18} />
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
                    <option value="">-- Pilih Program --</option>
                    {Object.entries(groupedSlots).map(([day, slots]) => (
                      <optgroup key={day} label={day}>
                        {slots.map((slot) => {
                          const key = `${slot.day}-${slot.time}-${slot.program}`;
                          return (
                            <option key={key} value={key}>
                              {slot.time} - {slot.program}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
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
                    <label>Kategori Template</label>
                    <select
                      value={scriptTemplate}
                      onChange={(e) => setScriptTemplate(e.target.value)}
                      className="premium-select"
                    >
                      <option value="Opening">Opening Program</option>
                      <option value="Podcast">Podcast/Obrolan</option>
                      <option value="Berita">Berita Ringkas</option>
                      <option value="Breaking News">Breaking News</option>
                      <option value="Iklan">Iklan/Adlib</option>
                      <option value="Promo">Promo Radio</option>
                      <option value="Live Report">Live Report</option>
                      <option value="Closing">Closing Program</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label>Tone / Gaya Siaran</label>
                  <input
                    value={scriptTone}
                    onChange={(e) => setScriptTone(e.target.value)}
                    placeholder="Contoh: Hangat, enerjik..."
                    className="premium-input"
                  />
                </div>

                <div className="form-field">
                  <label>Instruksi Tambahan (Opsional)</label>
                  <textarea
                    value={scriptIntervention}
                    onChange={(e) => setScriptIntervention(e.target.value)}
                    placeholder="Sapa pendengar di pesisir, buka dengan pantun, dll..."
                    rows={2}
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

          <section className="ai-result-panel">
            <div className="panel-inner">
              <div className="panel-header ai-result-header">
                <div className="ai-result-title">
                  <FileText size={18} />
                  <h2>Hasil Draft Naskah</h2>
                </div>
                
                <div className="ai-result-actions">
                  {scriptDraft && (
                    <button type="button" onClick={handleCopyScript} className="save-action-badge secondary">
                      <Copy size={14} />
                      Salin
                    </button>
                  )}
                  {scriptDraft && (
                    <button type="button" onClick={() => setIsTeleprompter(true)} className="save-action-badge warning">
                      <MonitorPlay size={14} />
                      Teleprompter
                    </button>
                  )}
                  {scriptDraft && (
                    <button type="button" onClick={handleSaveScript} disabled={scriptSaving} className="save-action-badge">
                      <Save size={14} />
                      {scriptSaving ? "Menyimpan..." : "Arsip"}
                    </button>
                  )}
                </div>
              </div>

              <div className="result-body">
                {scriptNotice && <div className="status-alert info">{scriptNotice}</div>}
                {scriptError && <div className="status-alert error">{scriptError}</div>}
                
                <div className="editor-wrap">
                  {scriptDraft && !scriptLoading && (
                    <div className="ai-rewrite-bar">
                      <span>AI Rewrite</span>
                      {rewriteModes.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => handleRewrite(mode.id)}
                          disabled={isRewriting}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={scriptDraft}
                    onChange={(e) => setScriptDraft(e.target.value)}
                    placeholder="Naskah AI akan muncul di sini..."
                    className={`premium-editor ${isRewriting ? "is-rewriting" : ""}`}
                    readOnly={scriptLoading || isRewriting}
                  />
                  
                  {scriptStats && !scriptLoading && (
                    <div className="ai-script-stats">
                      <div>
                        <span>Jumlah kata</span>
                        <strong>{scriptStats.words} <small>kata</small></strong>
                      </div>
                      <div>
                        <span>Estimasi baca</span>
                        <strong>{scriptStats.durationText}</strong>
                      </div>
                      <div>
                        <span>Karakter</span>
                        <strong>{scriptStats.chars}</strong>
                      </div>
                    </div>
                  )}

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
        )}
        
        {activeTab === "drafts" && (
          <div className="ai-layout-grid ai-layout-single">
            <section className="ai-result-panel">
              <div className="panel-inner ai-drafts-panel">
                <div className="panel-header">
                  <Save size={20} />
                  <h2>Arsip Naskah & Draft</h2>
                </div>
                
                {loadingScripts ? (
                  <div className="ai-draft-empty">Memuat arsip naskah...</div>
                ) : savedScripts.length === 0 ? (
                  <div className="ai-draft-empty">
                    <Archive size={34} />
                    <h3>Belum ada naskah</h3>
                    <p>Simpan naskah dari Generator untuk melihatnya di sini.</p>
                  </div>
                ) : (
                  <div className="ai-draft-grid">
                    {savedScripts.map(script => (
                      <article key={script.id} className="ai-draft-card">
                        <div className="ai-draft-head">
                          <div>
                            <span>
                              {script.day} • {script.scheduleTime}
                            </span>
                            <h3>{script.programTitle}</h3>
                          </div>
                          <strong>{script.status}</strong>
                        </div>
                        
                        <p>
                          {script.content}
                        </p>
                        
                        <div className="ai-draft-foot">
                          <span>Oleh: {script.createdByName}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setScriptDraft(script.content);
                              setScriptTone(script.tone);
                              setScriptDuration(script.durationMinutes);
                              setActiveTab("generator");
                            }}
                          >
                            Muat ke Editor
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        
        {["review", "ready"].includes(activeTab) && (
          <div className="ai-workspace-empty">
            <div>
              <FileText size={42} />
              <h3>Ruang kerja sedang disiapkan</h3>
              <p>Fitur manajemen {tabLabel(activeTab)} akan menyusul di pembaruan berikutnya.</p>
            </div>
          </div>
        )}
      </main>

      {isTeleprompter && (
        <div className="teleprompter-overlay">
          <div className="teleprompter-toolbar">
            <div className="teleprompter-controls">
              <div className={`teleprompter-on-air ${isPlaying ? "playing" : ""}`}>
                ON AIR
              </div>
              <div className="teleprompter-speed-controls">
                <button type="button" onClick={() => setPromptSpeed(Math.max(0.5, promptSpeed - 0.5))} aria-label="Perlambat teleprompter">
                  <Rewind size={18} />
                </button>
                <button type="button" className="play" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <><Pause size={18} /> PAUSE</> : <><Play size={18} /> PLAY</>}
                </button>
                <button type="button" onClick={() => setPromptSpeed(Math.min(5, promptSpeed + 0.5))} aria-label="Percepat teleprompter">
                  <FastForward size={18} />
                </button>
              </div>
              <span className="teleprompter-speed-badge">{promptSpeed}x</span>
            </div>
            
            <button type="button" className="teleprompter-exit" onClick={() => setIsTeleprompter(false)}>
              <X size={18} /> KELUAR
            </button>
          </div>
          
          <div ref={promptContainerRef} className="teleprompter-scroll">
            <div className="teleprompter-script">
              {scriptDraft}
            </div>
          </div>
          
          <div className="teleprompter-focus-line"></div>
        </div>
      )}
    </div>
  );
}

function tabLabel(id: string) {
  switch (id) {
    case "drafts": return "Draft Saya";
    case "review": return "Review Naskah";
    case "ready": return "Naskah Siap Siaran";
    default: return "";
  }
}

