import { useState, useMemo, useEffect, useRef, type FormEvent } from "react";
import { Bot, CalendarClock, FileText, Radio, Save, Sparkles, Wand2, MonitorPlay, Maximize, X, Play, Pause, FastForward, Rewind } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { AuthSession } from "../services/auth.service";
import { generateProgramScript, rewriteProgramScript } from "../services/aiScript.service";
import { saveProgramScript, listProgramScripts } from "../services/programScript.service";
import type { BroadcastProgramSlot, ProgramScriptDraft } from "../types/domain";
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
  const [isRewriting, setIsRewriting] = useState(false);

  // --- Fitur Studio ---
  const [activeTab, setActiveTab] = useState("generator"); // "generator", "drafts", "review", "ready"
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

  async function handleRewrite(mode: "formal" | "santai" | "singkat" | "energik" | "anak-muda" | "profesional") {
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

      {/* TABS WORKSPACE */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: "2px solid #f1f3f5", background: "white", padding: "0 20px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {[
          { id: "generator", label: "Studio Generator", icon: <Wand2 size={16} /> },
          { id: "drafts", label: "Draft Saya", icon: <Save size={16} /> },
          { id: "review", label: "Review", icon: <FileText size={16} /> },
          { id: "ready", label: "Siap Siaran", icon: <Radio size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === tab.id ? "3px solid var(--blue)" : "3px solid transparent",
              color: activeTab === tab.id ? "var(--blue)" : "var(--muted)", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0
            }}
          >
            {tab.icon} <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <main className="ai-script-container" style={{ paddingTop: "20px" }}>
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
              <div className="panel-header" style={{ flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={18} />
                  <h2>Hasil Draft Naskah</h2>
                </div>
                
                <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                  {scriptDraft && (
                    <button type="button" onClick={() => setIsTeleprompter(true)} className="save-action-badge" style={{ background: "#f59e0b", color: "white" }}>
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
                
                <div className="editor-wrap" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  {scriptDraft && !scriptLoading && (
                    <div style={{ marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--muted)", marginRight: "4px" }}>AI Rewrite:</span>
                      {[
                        { id: "singkat", label: "Lebih Singkat" },
                        { id: "energik", label: "Lebih Energik" },
                        { id: "anak-muda", label: "Gaya Anak Muda" },
                        { id: "formal", label: "Lebih Formal" }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => handleRewrite(mode.id as any)}
                          disabled={isRewriting}
                          style={{
                            background: "white", border: "1px solid var(--blue)", color: "var(--blue)",
                            padding: "8px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 800,
                            cursor: isRewriting ? "not-allowed" : "pointer", opacity: isRewriting ? 0.5 : 1,
                            flex: "1 1 auto", minWidth: "120px", textAlign: "center"
                          }}
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
                    className="premium-editor"
                    readOnly={scriptLoading || isRewriting}
                    style={{ minHeight: "400px", opacity: isRewriting ? 0.6 : 1, width: "100%", flex: "1 1 auto" }}
                  />
                  
                  {scriptStats && !scriptLoading && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px", padding: "12px 16px", background: "#f8f9fc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: "100px" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700 }}>JUMLAH KATA</span>
                        <span style={{ fontSize: "1rem", color: "var(--ink)", fontWeight: 900 }}>{scriptStats.words} <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>kata</span></span>
                      </div>
                      <div style={{ width: "1px", background: "#cbd5e1", display: "none" /* hide on very small, let gap handle it if wrap */ }}></div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: "140px" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700 }}>ESTIMASI DURASI BACA</span>
                        <span style={{ fontSize: "1rem", color: "var(--blue)", fontWeight: 900 }}>{scriptStats.durationText}</span>
                      </div>
                      <div style={{ width: "1px", background: "#cbd5e1", display: "none" }}></div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: "100px" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700 }}>KARAKTER</span>
                        <span style={{ fontSize: "1rem", color: "var(--ink)", fontWeight: 900 }}>{scriptStats.chars}</span>
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
          <div className="ai-layout-grid" style={{ gridTemplateColumns: "1fr" }}>
            <section className="ai-result-panel">
              <div className="panel-inner" style={{ padding: "30px" }}>
                <div className="panel-header" style={{ marginBottom: "20px" }}>
                  <Save size={20} />
                  <h2>Arsip Naskah & Draft</h2>
                </div>
                
                {loadingScripts ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Memuat arsip naskah...</div>
                ) : savedScripts.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", background: "#f8f9fc", borderRadius: "20px" }}>
                    <FileText size={40} color="var(--muted)" style={{ margin: "0 auto 12px" }} />
                    <h3 style={{ color: "var(--ink)", margin: "0 0 8px" }}>Belum Ada Naskah</h3>
                    <p style={{ color: "var(--muted)", margin: 0 }}>Simpan naskah dari Studio Generator untuk melihatnya di sini.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                    {savedScripts.map(script => (
                      <div key={script.id} style={{ border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ display: "inline-block", background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {script.day} • {script.scheduleTime}
                            </div>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{script.programTitle}</h3>
                          </div>
                          <div style={{ background: script.status === "draft" ? "#fef3c7" : "#e0e7ff", color: script.status === "draft" ? "#d97706" : "#4338ca", padding: "4px 10px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 800 }}>
                            {script.status}
                          </div>
                        </div>
                        
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                          {script.content}
                        </p>
                        
                        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
                            Oleh: {script.createdByName}
                          </div>
                          <button 
                            onClick={() => {
                              setScriptDraft(script.content);
                              setScriptTone(script.tone);
                              setScriptDuration(script.durationMinutes);
                              setActiveTab("generator");
                            }}
                            style={{ background: "white", border: "1px solid var(--blue)", color: "var(--blue)", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            Muat ke Editor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        
        {["review", "ready"].includes(activeTab) && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ background: "white", padding: "40px", borderRadius: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.05)" }}>
              <FileText size={48} color="var(--muted)" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 8px", color: "var(--ink)" }}>Ruang Kerja Sedang Dibangun</h3>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>Fitur manajemen {tabLabel(activeTab)} akan segera hadir di pembaruan berikutnya.</p>
            </div>
          </div>
        )}
      </main>

      {/* TELEPROMPTER FULLSCREEN OVERLAY */}
      {isTeleprompter && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#0f172a", color: "white", display: "flex", flexDirection: "column" }}>
          {/* Teleprompter Toolbar */}
          <div style={{ background: "#1e293b", padding: "12px 16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid #334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ background: "#ef4444", color: "white", fontWeight: 900, padding: "6px 12px", borderRadius: "6px", fontSize: "0.85rem", letterSpacing: "1px", animation: isPlaying ? "pulse 2s infinite" : "none" }}>
                ON AIR
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "10px" }}>
                <button onClick={() => setPromptSpeed(Math.max(0.5, promptSpeed - 0.5))} style={{ background: "transparent", border: "none", color: "white", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Rewind size={18} /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: "var(--blue)", border: "none", color: "white", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 900, display: "flex", gap: "6px", alignItems: "center" }}>
                  {isPlaying ? <><Pause size={18} /> PAUSE</> : <><Play size={18} /> PLAY</>}
                </button>
                <button onClick={() => setPromptSpeed(Math.min(5, promptSpeed + 0.5))} style={{ background: "transparent", border: "none", color: "white", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}><FastForward size={18} /></button>
              </div>
              <span style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 700, background: "rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: "6px" }}>{promptSpeed}x</span>
            </div>
            
            <button onClick={() => setIsTeleprompter(false)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 800, display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
              <X size={18} /> KELUAR
            </button>
          </div>
          
          {/* Teleprompter Scroll View */}
          <div ref={promptContainerRef} style={{ flex: 1, overflowY: "auto", padding: "80px 40px 300px", scrollBehavior: "smooth" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto", fontSize: "42px", fontWeight: 700, lineHeight: 1.6, color: "#f8fafc", whiteSpace: "pre-wrap", textAlign: "left", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              {scriptDraft}
            </div>
          </div>
          
          {/* Focus Line Guide (Garis bantu baca) */}
          <div style={{ position: "absolute", top: "45%", left: "0", right: "0", height: "120px", background: "linear-gradient(to bottom, rgba(30, 41, 59, 0) 0%, rgba(30, 41, 59, 0.4) 50%, rgba(30, 41, 59, 0) 100%)", pointerEvents: "none", borderLeft: "4px solid #ef4444", borderRight: "4px solid #ef4444" }}></div>
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

