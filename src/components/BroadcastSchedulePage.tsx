import { useState, useEffect, useMemo, type FormEvent } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, FileText, X, CalendarClock, Mic2, Radio, Search, RotateCcw, Headphones, Sparkles, PlayCircle } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { AuthSession } from "../services/auth.service";
import { announcers, getProgramInfo, type PageKey, type ProgramInfo } from "../data/radioData";
import { findAnnouncerProfile } from "../utils/announcerResolver";
import {
  formatScheduleDate,
  getActualScheduleForDate,
  getScheduleDayName,
  getScheduleSlotId,
  mergeScheduleSlots,
  parseScheduleDate,
  saveScheduleOverrideRemote
} from "../services/scheduleSlot.service";
import { getScheduleSwapAliasesForUser, submitSwapRequest } from "../services/scheduleSwap.service";
import { listUserProfiles } from "../services/userProfile.service";
import { resolveAnnouncerText, type ResolvedAnnouncerPart } from "../utils/announcerResolver";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";
import type { AppUser, BroadcastProgramSlot } from "../types/domain";

type ScheduleProgramParts = {
  primary: string;
  optional?: string;
};

function splitProgramParts(program: string): ScheduleProgramParts {
  const parts = program.split(/\s+\/\s+/).map((part) => part.trim()).filter(Boolean);
  return {
    primary: parts[0] || program,
    optional: parts.length > 1 ? parts.slice(1).join(" / ") : undefined
  };
}

function getScheduleStatusLabel(slot: BroadcastProgramSlot, isLive: boolean): string {
  if (isLive) return "Sedang Berjalan";
  if (slot.isCancelled || slot.overrideType === "cancel") return "Dibatalkan";
  if (slot.overrideType === "activate_optional") return "Tentative Aktif";
  if (slot.source === "special") return "Khusus";
  if (slot.source === "override") return "Pengganti";
  if (splitProgramParts(slot.program).optional) return "Tentative";
  return "Reguler";
}

function getScheduleStatusClass(slot: BroadcastProgramSlot, isLive: boolean): string {
  if (isLive) return "live";
  if (slot.isCancelled || slot.overrideType === "cancel") return "cancelled";
  if (slot.overrideType === "activate_optional" || splitProgramParts(slot.program).optional) return "tentative";
  if (slot.source === "special") return "special";
  if (slot.source === "override") return "replacement";
  return "regular";
}

export function BroadcastSchedulePage({
  data,
  session,
  onOpenAnnouncerProfile,
  onNavigate
}: {
  data: DashboardSnapshot;
  session: AuthSession | null;
  onOpenAnnouncerProfile: (airName: string) => void;
  onNavigate: (page: PageKey) => void;
}) {
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const today = useMemo(() => new Date(), []);
  const todayDate = formatScheduleDate(today);
  const currentSlot = useCurrentBroadcastSlot();
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const activeDay = getScheduleDayName(selectedDate);
  
  const [swapTarget, setSwapTarget] = useState<BroadcastProgramSlot | null>(null);
  const [swapReason, setSwapReason] = useState("");
  const [swapAnnouncer, setSwapAnnouncer] = useState("");
  const [replacementCandidates, setReplacementCandidates] = useState<AppUser[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState(() =>
    mergeScheduleSlots(data.weeklySchedule)
  );
  const [editingSlot, setEditingSlot] = useState<BroadcastProgramSlot | null>(null);
  const [programName, setProgramName] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [announcerName, setAnnouncerName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleNotice, setScheduleNotice] = useState("");
  const [scheduleQuery, setScheduleQuery] = useState("");
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState<{
    slot: BroadcastProgramSlot;
    info: ProgramInfo;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    getActualScheduleForDate(selectedDate, data.weeklySchedule as BroadcastProgramSlot[]).then((slots: BroadcastProgramSlot[]) => {
      if (isMounted) {
        setScheduleSlots(slots);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [data.weeklySchedule, selectedDate]);

  function setSelectedDayInCurrentWeek(day: string) {
    const base = parseScheduleDate(selectedDate);
    const currentMonday = new Date(base);
    const currentDayIndex = currentMonday.getDay() === 0 ? 6 : currentMonday.getDay() - 1;
    currentMonday.setDate(base.getDate() - currentDayIndex);
    const nextDate = new Date(currentMonday);
    nextDate.setDate(currentMonday.getDate() + days.indexOf(day));
    setSelectedDate(formatScheduleDate(nextDate));
  }

  useEffect(() => {
    let isMounted = true;
    if (!session) return;

    void listUserProfiles()
      .then((users) => {
        if (!isMounted) return;

        const filtered = users.filter((user) => {
          return user.role === "announcer" && user.id !== session.user.id && user.active;
        });

        if (filtered.length > 0) {
          setReplacementCandidates(filtered);
          return;
        }

        // Fallback ekstra: pakai announcers lokal jika Firestore/profil user gagal menghasilkan kandidat
        setReplacementCandidates(
          announcers
            .map((a) => {
              const waId = `wa-${a.id}`;
              return {
                id: waId,
                email: `${a.id}@radiosbl.com`,
                displayName: a.fullName,
                role: "announcer" as const,
                airName: a.airName,
                announcerNames: a.scheduleNames,
                photoUrl: a.photoUrl,
                whatsapp: a.id,
                active: a.active,
                employeeId: undefined
              };
            })
            .filter((u) => u.id !== session.user.id && u.active)
        );
      })
      .catch((err) => {
        console.error("Gagal memuat daftar penyiar pengganti:", err);

        // Fallback ekstra juga saat error
        setReplacementCandidates(
          announcers
            .map((a) => ({
              id: a.id,
              email: `${a.id}@radiosbl.com`,
              displayName: a.fullName,
              role: "announcer" as const,
              airName: a.airName,
              announcerNames: a.scheduleNames,
              photoUrl: a.photoUrl,
              whatsapp: a.id,
              active: a.active,
              employeeId: undefined
            }))
            .filter((u) => u.id !== session.user.id && u.active)
        );
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  function renderAnnouncerLinks(parts: ResolvedAnnouncerPart[]) {
    return parts.map((part, index) => (
      <span className="schedule-announcer-part" key={`${part.label}-${index}`}>
        {index > 0 && <span className="schedule-announcer-separator">/</span>}
        {part.kind === "announcer" ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenAnnouncerProfile(part.profile.airName);
            }}
          >
            {part.profile.airName}
          </button>
        ) : (
          <span>{part.label}</span>
        )}
      </span>
    ));
  }

  function isSlotOwnedByUser(slot: BroadcastProgramSlot): boolean {
    if (!session) return false;

    const profile = findAnnouncerProfile(session.user.airName || session.user.displayName || "");
    const candidateNames = new Set<string>();

    if (profile?.airName) candidateNames.add(profile.airName.toLowerCase());
    if (profile?.fullName) candidateNames.add(profile.fullName.toLowerCase());
    if (session.user.displayName) candidateNames.add(session.user.displayName.toLowerCase());
    if (session.user.airName) candidateNames.add(session.user.airName.toLowerCase());

    const slotText = slot.announcer.toLowerCase();
    return Array.from(candidateNames).some((needle) => needle && slotText.includes(needle));
  }

  const handleRequestSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapTarget || !swapAnnouncer.trim() || !swapReason.trim() || !session) {
      return;
    }

    const targetAnnouncerId = swapAnnouncer;
    const targetAnnouncer = replacementCandidates.find((candidate) => candidate.id === targetAnnouncerId);
    const targetDisplayName = targetAnnouncer?.airName || targetAnnouncer?.displayName || targetAnnouncerId;

    try {
      const result = await submitSwapRequest({
        scheduleId: `${swapTarget.day}|${swapTarget.time}|${swapTarget.program}`,
        targetDate: selectedDate,
        requesterId: session.user.id,
        requesterAliases: getScheduleSwapAliasesForUser(session.user),
        targetAnnouncerId,
        targetAnnouncerAliases: getScheduleSwapAliasesForUser(targetAnnouncer ?? targetAnnouncerId),
        reason: swapReason
      }, {
        requester: session.user,
        targetAnnouncer
      });

      setScheduleNotice(
        result.whatsappDelivered
          ? `Permintaan tukar jadwal ${swapTarget.program} (${selectedDate}, ${swapTarget.time}) ke ${targetDisplayName} dikirim. Notifikasi WhatsApp terkirim.`
          : `Permintaan tukar jadwal ${swapTarget.program} (${selectedDate}, ${swapTarget.time}) ke ${targetDisplayName} dikirim. Draft WhatsApp konfirmasi disiapkan.`
      );
      if (!result.whatsappDelivered && result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      setSwapTarget(null);
      setSwapReason("");
      setSwapAnnouncer("");
    } catch (err) {
      console.error("Gagal mengirim permintaan tukar jadwal:", err);
      setScheduleNotice("Gagal mengirim permintaan tukar jadwal. Periksa koneksi internet, lalu coba lagi.");
    }
  };

  function startEditSlot(slot: BroadcastProgramSlot) {
    setEditingSlot(slot);
    setProgramName(slot.program);
    setTimeLabel(slot.time);
    setAnnouncerName(slot.announcer);
    setDescription(slot.description);
    setScheduleNotice("");
  }

  async function handleSaveSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSlot) {
      return;
    }

    const nextSlot: BroadcastProgramSlot = {
      day: editingSlot.day,
      time: timeLabel,
      program: programName,
      description,
      announcer: announcerName
    };

    await saveScheduleOverrideRemote({
      date: selectedDate,
      slotId: editingSlot.id || getScheduleSlotId(editingSlot),
      type: "replace",
      newProgram: nextSlot.program,
      newAnnouncer: nextSlot.announcer,
      newTime: nextSlot.time,
      description: nextSlot.description,
      reason: "Edit jadwal dari halaman Jadwal Siaran",
      createdBy: session?.user.id || "system"
    });
    setScheduleSlots(await getActualScheduleForDate(selectedDate, data.weeklySchedule as BroadcastProgramSlot[]));
    setEditingSlot(null);
    setScheduleNotice(`Jadwal aktual ${selectedDate}, ${nextSlot.time} diperbarui tanpa mengubah template mingguan.`);
  }

  const activeSlots = scheduleSlots.filter((slot: BroadcastProgramSlot) => slot.day === activeDay);
  const liveSlot = activeSlots.find((slot) => selectedDate === todayDate && currentSlot.title === slot.program && getScheduleDayName(today) === slot.day);
  const scheduleFilterActive = scheduleQuery.trim().length > 0 || scheduleStatusFilter !== "all";
  const filteredActiveSlots = useMemo(() => {
    const normalizedQuery = scheduleQuery.trim().toLowerCase();

    return activeSlots.filter((slot) => {
      const isCurrentlyPlaying = selectedDate === todayDate && currentSlot.title === slot.program && getScheduleDayName(today) === slot.day;
      const statusClass = getScheduleStatusClass(slot, isCurrentlyPlaying);
      const statusLabel = getScheduleStatusLabel(slot, isCurrentlyPlaying);
      const programParts = splitProgramParts(slot.program);
      const programInfo = getProgramInfo(programParts.primary);
      const text = [
        slot.program,
        slot.announcer,
        slot.time,
        slot.description,
        programInfo.description,
        statusLabel,
        programParts.optional
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
      const matchesStatus = scheduleStatusFilter === "all" || statusClass === scheduleStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [activeSlots, currentSlot.title, scheduleQuery, scheduleStatusFilter, selectedDate, today, todayDate]);
  const ownedSlots = activeSlots.filter((slot) => isSlotOwnedByUser(slot));
  const tentativeSlots = activeSlots.filter((slot) => {
    const isCurrentlyPlaying = selectedDate === todayDate && currentSlot.title === slot.program && getScheduleDayName(today) === slot.day;
    return getScheduleStatusClass(slot, isCurrentlyPlaying) === "tentative";
  });
  const nextPrioritySlot = liveSlot ?? ownedSlots[0] ?? activeSlots[0];

  function goToPreviousDay() {
    const date = parseScheduleDate(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatScheduleDate(date));
  }

  function goToNextDay() {
    const date = parseScheduleDate(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatScheduleDate(date));
  }

  function navigateFromProgramDetail(page: PageKey) {
    setSelectedProgram(null);
    onNavigate(page);
  }

  return (
    <div className="schedule-page">
      <div className="schedule-page-header">
        <div className="schedule-title-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Program Radio SBL</p>
            <h1>Jadwal Siaran</h1>
          </div>
        </div>
        
        <div className="schedule-day-strip">
          <button
            type="button"
            className="schedule-day-arrow"
            onClick={goToPreviousDay}
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="schedule-day-tabs" aria-label="Pilih hari siaran">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDayInCurrentWeek(day)}
                className={activeDay === day ? "active" : ""}
                type="button"
              >
                {day}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="schedule-day-arrow"
            onClick={goToNextDay}
            aria-label="Hari berikutnya"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <label className="schedule-date-picker">
          <CalendarClock size={18} />
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || todayDate)}
          />
        </label>
      </div>

      <div className="schedule-content">
        <section className="schedule-list-panel" aria-label={`Jadwal hari ${activeDay}`}>
          {scheduleNotice && <p className="schedule-notice">{scheduleNotice}</p>}

          <div className="schedule-date-summary">
            <div>
              <p className="eyebrow">Jadwal Aktual</p>
              <h2>{activeDay}, {selectedDate}</h2>
              <span>
                {scheduleFilterActive
                  ? `${filteredActiveSlots.length} dari ${activeSlots.length} slot terlihat`
                  : `${activeSlots.length} slot siaran`}
              </span>
            </div>
            <div className="schedule-date-summary-live">
              <Radio size={18} />
              <span>{liveSlot ? liveSlot.program : "Belum ada program live di tanggal ini"}</span>
            </div>
          </div>

          <div className="schedule-command-panel">
            <label className="schedule-search-field">
              <Search size={18} />
              <span>Cari jadwal</span>
              <input
                value={scheduleQuery}
                onChange={(event) => setScheduleQuery(event.target.value)}
                placeholder="Program, penyiar, jam..."
              />
            </label>
            <label className="schedule-filter-field">
              <span>Status</span>
              <select
                value={scheduleStatusFilter}
                onChange={(event) => setScheduleStatusFilter(event.target.value)}
              >
                <option value="all">Semua status</option>
                <option value="live">Sedang berjalan</option>
                <option value="regular">Reguler</option>
                <option value="tentative">Tentative</option>
                <option value="replacement">Pengganti</option>
                <option value="special">Khusus</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </label>
          </div>

          <div className="schedule-focus-row" aria-label="Fokus jadwal">
            <article className="schedule-focus-card live">
              <span>Prioritas</span>
              <strong>{nextPrioritySlot ? nextPrioritySlot.program : "Belum ada slot"}</strong>
              <p>{nextPrioritySlot ? `${nextPrioritySlot.time} WITA - ${nextPrioritySlot.announcer}` : "Pilih hari lain untuk melihat rundown."}</p>
            </article>
            <article className="schedule-focus-card">
              <span>Slot saya</span>
              <strong>{ownedSlots.length}</strong>
              <p>{ownedSlots[0] ? `${ownedSlots[0].program} pukul ${ownedSlots[0].time}` : "Tidak ada jadwal pribadi di hari ini."}</p>
            </article>
            <article className="schedule-focus-card warning">
              <span>Tentative</span>
              <strong>{tentativeSlots.length}</strong>
              <p>{tentativeSlots[0] ? tentativeSlots[0].program : "Tidak ada slot tentative."}</p>
            </article>
          </div>

          <div className="schedule-slot-list">
            {activeSlots.length === 0 && (
              <div className="schedule-empty-state">
                <CalendarClock size={26} />
                <strong>Belum ada jadwal hari ini.</strong>
                <p>Pilih tanggal lain atau hubungi admin bila jadwal seharusnya sudah tersedia.</p>
              </div>
            )}
            {activeSlots.length > 0 && filteredActiveSlots.length === 0 && (
              <div className="schedule-empty-state">
                <Search size={26} />
                <strong>Jadwal tidak ditemukan.</strong>
                <p>Coba kata kunci lain atau tampilkan semua status untuk melihat rundown hari ini.</p>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleQuery("");
                    setScheduleStatusFilter("all");
                  }}
                >
                  <RotateCcw size={16} /> Reset filter
                </button>
              </div>
            )}
            {filteredActiveSlots.map((slot: BroadcastProgramSlot) => {
              const isCurrentlyPlaying = selectedDate === todayDate && currentSlot.title === slot.program && getScheduleDayName(today) === slot.day;
              const announcerParts = resolveAnnouncerText(slot.announcer);
              const programParts = splitProgramParts(slot.program);
              const programInfo = getProgramInfo(programParts.primary);
              const statusLabel = getScheduleStatusLabel(slot, isCurrentlyPlaying);
              const statusClass = getScheduleStatusClass(slot, isCurrentlyPlaying);

              return (
                <div
                  key={`${slot.day}-${slot.time}-${slot.program}`}
                  className={`schedule-slot-card${isCurrentlyPlaying ? " is-live" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedProgram({ slot, info: programInfo })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedProgram({ slot, info: programInfo });
                    }
                  }}
                  aria-label={`Buka detail program ${slot.program}`}
                >
                  <div className="schedule-slot-main">
                    <div className="schedule-slot-art" aria-hidden="true">
                      <img src={programInfo.imageUrl} alt="" />
                    </div>
                    <div className="schedule-slot-copy">
                      <div className={`schedule-status-badge ${statusClass}`}>
                        {isCurrentlyPlaying && <span />}
                        {statusLabel}
                      </div>
                      <h3>{programParts.primary}</h3>
                      {programParts.optional && (
                        <div className="schedule-tentative-row">
                          <span>Tentative</span>
                          <strong>{programParts.optional}</strong>
                        </div>
                      )}
                      <div className="schedule-announcer">
                        <Mic2 size={14} color="#64748B" />
                        <span className="schedule-announcer-links">
                          {renderAnnouncerLinks(announcerParts)}
                        </span>
                      </div>
                      <div className="schedule-time-pill">
                        <CalendarClock size={16} /> {slot.time} WITA
                      </div>
                      <p className="schedule-slot-description">
                        {slot.isCancelled ? `Slot dibatalkan. ${slot.reason || ""}` : programInfo.description}
                      </p>
                      {slot.originalAnnouncer && (
                        <p className="schedule-slot-description schedule-slot-default">
                          Default: {slot.originalProgram || slot.program} - {slot.originalAnnouncer}
                        </p>
                      )}
                    </div>

                    <div className="schedule-slot-actions">
                      {isSlotOwnedByUser(slot) && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSwapTarget(slot);
                          }}
                          className="schedule-icon-button"
                          title="Tukar Jadwal"
                          aria-label={`Ajukan tukar jadwal ${slot.program}`}
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                      )}
                      {session?.user.role === "admin" && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            startEditSlot(slot);
                          }}
                          className="schedule-icon-button warning"
                          title="Edit Jadwal"
                          aria-label={`Edit jadwal ${slot.program}`}
                        >
                          <FileText size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {swapTarget && (
        <div className="schedule-modal-backdrop">
          <div className="schedule-modal">
            <div className="schedule-modal-head">
              <h3>Tukar Jadwal Siaran</h3>
              <button type="button" onClick={() => setSwapTarget(null)} aria-label="Tutup modal"><X size={20} /></button>
            </div>
            <div className="schedule-modal-context">
              <strong>{swapTarget.program}</strong>
              <span>{selectedDate}, {swapTarget.time}</span>
              <span>Penyiar Asli: {swapTarget.announcer}</span>
            </div>
            <form onSubmit={handleRequestSwap} className="schedule-modal-form">
              <label>
                Penyiar Pengganti
                <select
                  value={swapAnnouncer}
                  onChange={e => setSwapAnnouncer(e.target.value)}
                >
                  <option value="">-- Pilih Penyiar Pengganti --</option>
                  {replacementCandidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.airName || candidate.displayName}
                    </option>
                  ))}
                </select>
              </label>
              {replacementCandidates.length === 0 && (
                <p className="schedule-modal-help">
                  Tidak ada daftar penyiar pengganti. Silakan perbarui profil user atau hubungi admin.
                </p>
              )}
              <label>
                Alasan Tukar Jadwal
                <textarea required value={swapReason} onChange={e => setSwapReason(e.target.value)} rows={3} />
              </label>
              <button type="submit" className="schedule-primary-button" disabled={!swapAnnouncer.trim() || !swapReason.trim()}>
                Kirim Request
              </button>
            </form>
          </div>
        </div>
      )}
      {selectedProgram && (
        <div className="schedule-modal-backdrop">
          <div className="schedule-modal program-detail-modal">
            <div className="schedule-modal-head">
              <div>
                <p className="eyebrow">Detail Program</p>
                <h3>{selectedProgram.info.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedProgram(null)} aria-label="Tutup detail program"><X size={20} /></button>
            </div>
            <img
              className="program-detail-cover"
              src={selectedProgram.info.imageUrl}
              alt={selectedProgram.info.title}
            />
            <div className="program-detail-meta">
              <span><CalendarClock size={16} /> {selectedProgram.slot.day}, {selectedProgram.slot.time} WITA</span>
              <span><Mic2 size={16} /> {selectedProgram.slot.announcer}</span>
            </div>
            <p className="program-detail-description">{selectedProgram.info.description}</p>
            <div className="program-detail-workflow" aria-label="Aksi lanjutan program">
              <button type="button" onClick={() => navigateFromProgramDetail("aiScript")}>
                <Sparkles size={16} />
                <span>Buat naskah</span>
              </button>
              <button type="button" onClick={() => navigateFromProgramDetail("requests")}>
                <Headphones size={16} />
                <span>Request</span>
              </button>
              <button type="button" onClick={() => navigateFromProgramDetail("streaming")}>
                <PlayCircle size={16} />
                <span>Streaming</span>
              </button>
              <button type="button" onClick={() => navigateFromProgramDetail("liveOb")}>
                <Radio size={16} />
                <span>Live/OB</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {editingSlot && (
        <div className="schedule-modal-backdrop">
          <div className="schedule-modal">
            <div className="schedule-modal-head">
              <h3>Edit Jadwal</h3>
              <button type="button" onClick={() => setEditingSlot(null)} aria-label="Tutup modal"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveSlot} className="schedule-modal-form">
              <label>Hari <input value={editingSlot.day} disabled /></label>
              <label>Jam <input value={timeLabel} onChange={e => setTimeLabel(e.target.value)} /></label>
              <label>Program <input value={programName} onChange={e => setProgramName(e.target.value)} /></label>
              <label>Penyiar <input value={announcerName} onChange={e => setAnnouncerName(e.target.value)} /></label>
              <label>Deskripsi <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></label>
              <button type="submit" className="schedule-primary-button">Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
