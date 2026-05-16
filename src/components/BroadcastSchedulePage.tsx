import { useState, useEffect, type FormEvent } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, FileText, X, CalendarClock, Mic2 } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { AuthSession } from "../services/auth.service";
import type { BroadcastProgramSlot } from "../data/radioData";
import {
  mergeScheduleSlots,
  mergeScheduleSlotsRemote,
  saveCustomScheduleSlotRemote
} from "../services/scheduleSlot.service";
import { resolveAnnouncerText, type ResolvedAnnouncerPart } from "../utils/announcerResolver";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";

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
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const currentSlot = useCurrentBroadcastSlot();
  const [activeDay, setActiveDay] = useState(days[todayIndex]);
  const activeDayIndex = days.indexOf(activeDay);
  
  const [swapTarget, setSwapTarget] = useState<BroadcastProgramSlot | null>(null);
  const [swapReason, setSwapReason] = useState("");
  const [swapAnnouncer, setSwapAnnouncer] = useState("");
  const [scheduleSlots, setScheduleSlots] = useState(() =>
    mergeScheduleSlots(data.weeklySchedule)
  );
  const [editingSlot, setEditingSlot] = useState<BroadcastProgramSlot | null>(null);
  const [programName, setProgramName] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [announcerName, setAnnouncerName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleNotice, setScheduleNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    mergeScheduleSlotsRemote(data.weeklySchedule).then((slots: BroadcastProgramSlot[]) => {
      if (isMounted) {
        setScheduleSlots(slots);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [data.weeklySchedule]);


  function renderAnnouncerLinks(parts: ResolvedAnnouncerPart[]) {
    return parts.map((part, index) => (
      <span className="schedule-announcer-part" key={`${part.label}-${index}`}>
        {index > 0 && <span className="schedule-announcer-separator">/</span>}
        {part.kind === "announcer" ? (
          <button type="button" onClick={() => onOpenAnnouncerProfile(part.profile.airName)}>
            {part.profile.airName}
          </button>
        ) : (
          <span>{part.label}</span>
        )}
      </span>
    ));
  }

  const handleRequestSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapTarget) {
      return;
    }

    setScheduleNotice(
      `Permintaan tukar jadwal ${swapTarget.program} (${swapTarget.day}, ${swapTarget.time}) ke ${swapAnnouncer} dikirim ke admin.`
    );
    setSwapTarget(null);
    setSwapReason("");
    setSwapAnnouncer("");
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

    await saveCustomScheduleSlotRemote(nextSlot, editingSlot);
    setScheduleSlots(await mergeScheduleSlotsRemote(data.weeklySchedule));
    setEditingSlot(null);
    setScheduleNotice(`Jadwal ${nextSlot.day}, ${nextSlot.time} diperbarui.`);
  }

  const activeSlots = scheduleSlots.filter((slot: BroadcastProgramSlot) => slot.day === activeDay);

  function goToPreviousDay() {
    setActiveDay(days[(activeDayIndex - 1 + days.length) % days.length]);
  }

  function goToNextDay() {
    setActiveDay(days[(activeDayIndex + 1) % days.length]);
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
                onClick={() => setActiveDay(day)}
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
      </div>

      <div className="schedule-content">
        <section className="schedule-list-panel" aria-label={`Jadwal hari ${activeDay}`}>
          {scheduleNotice && <p className="schedule-notice">{scheduleNotice}</p>}

          <div className="schedule-slot-list">
            {activeSlots.map((slot: BroadcastProgramSlot) => {
              const isCurrentlyPlaying = currentSlot.title === slot.program && days[todayIndex] === slot.day;
              const announcerParts = resolveAnnouncerText(slot.announcer);

              return (
                <div
                  key={`${slot.day}-${slot.time}-${slot.program}`}
                  className={`schedule-slot-card${isCurrentlyPlaying ? " is-live" : ""}`}
                >
                  <div className="schedule-slot-main">
                    <div className="schedule-slot-art" aria-hidden="true">
                      <img src="/coverSBL.jpg" alt="" />
                    </div>
                    <div className="schedule-slot-copy">
                      {isCurrentlyPlaying && (
                        <div className="schedule-live-badge">
                          <span />
                          SEDANG SIARAN
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
                    </div>

                    <div className="schedule-slot-actions">
                      <button
                        type="button"
                        onClick={() => setSwapTarget(slot)}
                        className="schedule-icon-button"
                        title="Tukar Jadwal"
                      >
                        <ArrowLeftRight size={16} />
                      </button>
                      {session?.user.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => startEditSlot(slot)}
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
              <span>{swapTarget.day}, {swapTarget.time}</span>
            </div>
            <form onSubmit={handleRequestSwap} className="schedule-modal-form">
              <label>
                Penyiar Pengganti
                <input value={swapAnnouncer} onChange={e => setSwapAnnouncer(e.target.value)} />
              </label>
              <label>
                Alasan Tukar Jadwal
                <textarea required value={swapReason} onChange={e => setSwapReason(e.target.value)} rows={3} />
              </label>
              <button type="submit" className="schedule-primary-button">
                Kirim Request
              </button>
            </form>
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
