import { useState, useMemo, useEffect, useRef, type FormEvent } from "react";
import { Bot, CalendarClock, FileText, Radio, Save, Sparkles, Wand2, MonitorPlay, X, Play, Pause, FastForward, Rewind, Copy, Archive, Bold, Italic, Heading, List, Clock, Highlighter, SplitSquareHorizontal, Megaphone, Search, Download, CheckCircle2, ClipboardCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { AuthSession } from "../services/auth.service";
import { generateProgramScript, rewriteProgramScript } from "../services/aiScript.service";
import { saveProgramScript, listProgramScripts, updateProgramScriptStatus } from "../services/programScript.service";
import type { BroadcastProgramSlot, ProgramScriptDraft } from "../types/domain";
import { formatAirNameOnly } from "../utils/announcerResolver";
import { mergeScheduleSlots } from "../services/scheduleSlot.service";
import { InlineHelp } from "./InlineHelp";
import { ScriptBoard } from "../features/broadcastWorkflow/components/ScriptBoard";

type StudioTab = "generator" | "drafts" | "review" | "ready" | "board";
type RewriteMode = "formal" | "santai" | "singkat" | "energik" | "anak-muda" | "profesional";

const studioTabs: Array<{ id: StudioTab; label: string; icon: LucideIcon }> = [
  { id: "generator", label: "Generator", icon: Wand2 },
  { id: "drafts", label: "Draft", icon: Save },
  { id: "review", label: "Review", icon: FileText },
  { id: "ready", label: "Siap Siaran", icon: Radio },
  { id: "board", label: "Script Board", icon: ClipboardCheck }
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
  const [draftSearch, setDraftSearch] = useState("");
  const [draftFilter, setDraftFilter] = useState("Semua");

  // --- Editor State ---
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [autoSaveTime, setAutoSaveTime] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab === "drafts" || activeTab === "review" || activeTab === "ready") {
      loadSavedScripts();
    }
  }, [activeTab]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Define selectedScriptSlot BEFORE it's used
  const selectedScriptSlot = useMemo(() => {
    const fallback = scheduleSlots[0];
    if (!scriptSlotKey) return fallback;
    return (
      scheduleSlots.find(
        (slot: BroadcastProgramSlot) => `${slot.day}-${slot.time}-${slot.program}` === scriptSlotKey
      ) || fallback
    );
  }, [scheduleSlots, scriptSlotKey]);

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

  useEffect(() => {
    if (!scriptDraft.trim() || activeTab !== "generator") return;

    // Clear existing timer if any
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = window.setTimeout(() => {
      try {
        const timestamp = new Date().toISOString();
        const slotInfo = selectedScriptSlot ? {
          program: selectedScriptSlot.program,
          announcer: selectedScriptSlot.announcer,
          time: selectedScriptSlot.time,
          day: selectedScriptSlot.day
        } : null;

        // Save with metadata
        localStorage.setItem(`radiosbl.draftBackup`, JSON.stringify({
          content: scriptDraft,
          timestamp,
          slot: slotInfo
        }));
        setAutoSaveTime(new Date());
      } catch (error) {
        console.warn("Gagal melakukan auto-save:", error);
      } finally {
        autoSaveTimerRef.current = null;
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [scriptDraft, activeTab, selectedScriptSlot]);

  function insertFormatting(prefix: string, suffix: string = "") {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = scriptDraft;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);

    setScriptDraft(`${before}${prefix}${selected || "Teks"}${suffix}${after}`);
    setTimeout(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "Teks").length);
    }, 0);
  }

  function insertBlock(block: string) {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const text = scriptDraft;
    const before = text.substring(0, start);
    const after = text.substring(start, text.length);
    setScriptDraft(`${before}\n${block}\n${after}`);
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
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

    const text = scriptDraft.trim();

    // Count words (Indonesian text - handle multiple spaces and punctuation)
    const words = text.split(/\s+/).filter(w => w.length > 0).length;

    // Count characters (excluding spaces for more accurate reading estimate)
    const chars = text.replace(/\s/g, "").length;

    // Count sentences (periods, question marks, exclamation marks)
    const sentences = (text.match(/[.!?]+/g) || []).length;

    // Count paragraphs (double newlines or single newlines)
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;

    // Calculate estimated reading time
    // Radio speaking is typically 130-150 words per minute
    const readingSpeedWPM = 140;
    const durationMinutes = Math.floor(words / readingSpeedWPM);
    const durationSeconds = Math.round(((words % readingSpeedWPM) / readingSpeedWPM) * 60);

    // Format duration text
    let durationText = "";
    if (durationMinutes > 0) {
      durationText = `${durationMinutes}m ${durationSeconds}d`;
    } else if (durationSeconds > 0) {
      durationText = `${durationSeconds}d`;
    } else {
      durationText = "< 1d";
    }

    return {
      words,
      chars: text.length, // Include spaces in total chars for display
      charsNoSpaces: chars,
      sentences,
      paragraphs,
      durationText,
      durationMinutes: durationMinutes + (durationSeconds / 60)
    };
  }, [scriptDraft]);

  const groupedSlots = useMemo(() => {
    return scheduleSlots.reduce((acc: Record<string, BroadcastProgramSlot[]>, slot: BroadcastProgramSlot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    }, {});
  }, [scheduleSlots]);

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
        announcerName: formatAirNameOnly(selectedScriptSlot.announcer),
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
        announcerName: formatAirNameOnly(selectedScriptSlot.announcer),
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

  function handleExportScript(content: string, title: string) {
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setScriptError("Gagal mengekspor naskah.");
    }
  }

  async function handleUpdateStatus(id: string, newStatus: ProgramScriptDraft["status"]) {
    try {
      await updateProgramScriptStatus(id, newStatus);
      setSavedScripts(savedScripts.map(s => s.id === id ? { ...s, status: newStatus } : s));
      setScriptNotice(`Status naskah berhasil diubah menjadi ${newStatus}.`);
    } catch {
      setScriptError("Gagal mengubah status naskah.");
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
            {formatAirNameOnly(selectedScriptSlot.announcer) || "Penyiar Radio SBL"}
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Wand2 size={18} />
                  <h2>Konfigurasi Naskah</h2>
                  <InlineHelp 
                    title="Naskah AI" 
                    content="Tentukan durasi, gaya bahasa, dan kategori naskah. AI akan menyusun kalimat siaran yang sesuai dengan jadwal yang dipilih."
                  />
                </div>
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

                  {scriptDraft && !scriptLoading && (
                    <div className="ai-editor-toolbar" style={{ display: "flex", gap: "4px", padding: "8px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderBottom: "none", borderRadius: "8px 8px 0 0", flexWrap: "wrap" }}>
                      <button type="button" onClick={() => insertFormatting("**", "**")} title="Bold" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer" }}><Bold size={16} /></button>
                      <button type="button" onClick={() => insertFormatting("*", "*")} title="Italic" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer" }}><Italic size={16} /></button>
                      <button type="button" onClick={() => insertFormatting("### ", "")} title="Heading" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer" }}><Heading size={16} /></button>
                      <button type="button" onClick={() => insertFormatting("==", "==")} title="Highlight" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer" }}><Highlighter size={16} /></button>
                      <button type="button" onClick={() => insertFormatting("- ", "")} title="Bullet List" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer" }}><List size={16} /></button>
                      <div style={{ width: "1px", height: "16px", background: "var(--color-border)", margin: "0 4px", alignSelf: "center" }} />
                      <button type="button" onClick={() => insertBlock(`[${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}] `)} title="Timestamp" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}><Clock size={16} /> Waktu</button>
                      <button type="button" onClick={() => insertBlock("\n[CUE LAGU/IKLAN]\n")} title="Cue Marker" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}><Megaphone size={16} /> Cue</button>
                      <button type="button" onClick={() => insertBlock("\n=== SEGMENT BARU ===\n")} title="Segment Divider" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}><SplitSquareHorizontal size={16} /> Pembatas</button>
                    </div>
                  )}

                  <textarea
                    ref={editorRef}
                    value={scriptDraft}
                    onChange={(e) => setScriptDraft(e.target.value)}
                    placeholder="Naskah AI akan muncul di sini..."
                    className={`premium-editor ${isRewriting ? "is-rewriting" : ""}`}
                    style={{ borderRadius: scriptDraft ? "0 0 8px 8px" : "8px" }}
                    readOnly={scriptLoading || isRewriting}
                  />
                  
                  {autoSaveTime && scriptDraft && !scriptLoading && (
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", textAlign: "right" }}>
                      Draft tersimpan otomatis lokal pkl {autoSaveTime.toLocaleTimeString()}
                    </div>
                  )}
                  
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
                  <>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "0 16px" }}>
                      <label className="menu-search-field" style={{ flex: 1, margin: 0 }}>
                        <Search size={16} />
                        <input 
                          type="search" 
                          placeholder="Cari naskah..." 
                          value={draftSearch} 
                          onChange={(e) => setDraftSearch(e.target.value)} 
                        />
                      </label>
                      <select 
                        value={draftFilter} 
                        onChange={(e) => setDraftFilter(e.target.value)}
                        className="premium-select"
                        style={{ width: "120px", margin: 0, height: "40px" }}
                      >
                        <option value="Semua">Semua</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="used">Digunakan</option>
                      </select>
                    </div>
                    <div className="ai-draft-grid">
                      {savedScripts
                        .filter(s => draftFilter === "Semua" || s.status === draftFilter)
                        .filter(s => !draftSearch || s.programTitle.toLowerCase().includes(draftSearch.toLowerCase()) || s.content.toLowerCase().includes(draftSearch.toLowerCase()))
                        .map(script => (
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
                  </>
                )}
              </div>
            </section>
          </div>
        )}
        
        {["review", "ready"].includes(activeTab) && (
          <div className="ai-layout-grid ai-layout-single">
            <section className="ai-result-panel">
              <div className="panel-inner ai-drafts-panel">
                <div className="panel-header">
                  {activeTab === "review" ? <FileText size={20} /> : <Radio size={20} />}
                  <h2>{tabLabel(activeTab)}</h2>
                </div>
                
                {loadingScripts ? (
                  <div className="ai-draft-empty">Memuat naskah...</div>
                ) : (
                  <div className="ai-draft-grid">
                    {savedScripts
                      .filter(s => activeTab === "review" ? (s.status === "draft") : s.status === "approved")
                      .map(script => (
                      <article key={script.id} className="ai-draft-card">
                        <div className="ai-draft-head">
                          <div>
                            <span>{script.day} • {script.scheduleTime}</span>
                            <h3>{script.programTitle}</h3>
                          </div>
                          <strong className={script.status === "approved" ? "status-approved" : ""}>{script.status}</strong>
                        </div>
                        
                        <p>{script.content}</p>
                        
                        <div className="ai-draft-foot" style={{ flexWrap: "wrap", gap: "8px" }}>
                          <span>Oleh: {script.createdByName}</span>
                          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                            <button type="button" onClick={() => handleExportScript(script.content, script.programTitle)} title="Export TXT" style={{ padding: "4px 8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Download size={14} /> Export
                            </button>
                            {activeTab === "review" && (
                              <button type="button" onClick={() => handleUpdateStatus(script.id, "approved")} style={{ padding: "4px 8px", fontSize: "12px", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", gap: "4px" }}>
                                <CheckCircle2 size={14} /> Approve
                              </button>
                            )}
                            {activeTab === "ready" && (
                              <button type="button" onClick={() => handleUpdateStatus(script.id, "used")} style={{ padding: "4px 8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                Tandai Selesai
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                    {savedScripts.filter(s => activeTab === "review" ? (s.status === "draft") : s.status === "approved").length === 0 && (
                      <div className="ai-workspace-empty" style={{ gridColumn: "1 / -1" }}>
                        <div>
                          <CheckCircle2 size={42} />
                          <h3>Tidak ada naskah</h3>
                          <p>Semua naskah sudah diproses atau belum ada draf baru.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        
        {activeTab === "board" && (
          <div className="ai-layout-grid ai-layout-single">
            <section className="ai-result-panel">
              <div className="panel-inner ai-drafts-panel" style={{ padding: "20px" }}>
                <div className="panel-header">
                  <ClipboardCheck size={20} />
                  <h2>Papan Naskah Siaran (Script Board)</h2>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <ScriptBoard />
                </div>
              </div>
            </section>
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
    case "board": return "Papan Status Naskah (Script Board)";
    default: return "";
  }
}

