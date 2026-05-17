import { useState, useEffect, type FormEvent } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, FileText, X, CalendarClock, Mic2 } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { AuthSession } from "../services/auth.service";
import { announcers, getProgramInfo, type ProgramInfo } from "../data/radioData";
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

export function BroadcastSchedulePage({
  data,
  session,
  onOpenAnnouncerProfile
}: {
  data: DashboardSnapshot;
  session: AuthSession | null;
  onOpenAnnouncerProfile: (airName: string) => void;
}) {
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const today = new Date();
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
      alert("Gagal mengirim permintaan tukar jadwal. Coba lagi nanti.");
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
        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, color: "var(--ink)" }}>
          <CalendarClock size={18} color="var(--blue)" />
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || todayDate)}
            style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: "12px", padding: "10px 12px", fontWeight: 800, color: "var(--ink)", background: "white" }}
          />
        </label>
      </div>

      <div className="schedule-content">
        <section className="schedule-list-panel" aria-label={`Jadwal hari ${activeDay}`}>
          {scheduleNotice && <p className="schedule-notice">{scheduleNotice}</p>}

          <div className="schedule-slot-list">
            {activeSlots.map((slot: BroadcastProgramSlot) => {
              const isCurrentlyPlaying = selectedDate === todayDate && currentSlot.title === slot.program && getScheduleDayName(today) === slot.day;
              const announcerParts = resolveAnnouncerText(slot.announcer);
              const programInfo = getProgramInfo(slot.program);

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
                      {isCurrentlyPlaying && (
                        <div className="schedule-live-badge">
                          <span />
                          SEDANG SIARAN
                        </div>
                      )}
                      {slot.source && slot.source !== "regular" && (
                        <div className="schedule-live-badge" style={{ background: slot.isCancelled ? "#fee2e2" : "#eef5ff", color: slot.isCancelled ? "#dc2626" : "var(--blue)" }}>
                          {slot.isCancelled ? "DIBATALKAN" : slot.source === "special" ? "KHUSUS" : "OVERRIDE"}
                        </div>
                      )}
                      <h3>{slot.program}</h3>
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
                        <p className="schedule-slot-description" style={{ marginTop: 6 }}>
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
                <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
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
