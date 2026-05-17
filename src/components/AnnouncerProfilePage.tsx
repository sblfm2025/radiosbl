import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  Clock3,
  Mic2,
  Radio
} from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import { findAnnouncerProfile, getAnnouncerWorkload } from "../utils/announcerResolver";

type AnnouncerProfilePageProps = {
  airName: string;
  data: DashboardSnapshot;
  onBack: () => void;
};

export function AnnouncerProfilePage({
  airName,
  data,
  onBack
}: AnnouncerProfilePageProps) {
  const profile = findAnnouncerProfile(airName);
  const workload = getAnnouncerWorkload(airName);
  const firstSlot = workload.slots[0];
  const dayGroups = workload.days.map((day) => ({
    day,
    slots: workload.slots.filter((slot) => slot.day === day)
  }));

  if (!profile) {
    return (
      <div className="announcer-profile-page">
        <div className="announcer-profile-header">
          <div className="announcers-title-lockup">
            <img src="/LogoSBL.svg" alt="Radio SBL" />
            <div>
              <p className="eyebrow">Penyiar Radio SBL</p>
              <h1>Profil Penyiar</h1>
            </div>
          </div>
        </div>
        <div className="announcer-profile-content">
          <button type="button" className="announcer-profile-back" onClick={onBack}>
            <ArrowLeft size={18} />
            Kembali ke Jadwal
          </button>
          <article className="announcer-profile-card">
            <h2>Penyiar tidak ditemukan</h2>
            <p>Data profil untuk {airName} belum tersedia.</p>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="announcer-profile-page">
      <div className="announcer-profile-header">
        <div className="announcers-title-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Penyiar Radio SBL</p>
            <h1>Profil Penyiar</h1>
          </div>
        </div>
      </div>

      <div className="announcer-profile-content">
        <button type="button" className="announcer-profile-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Kembali ke Jadwal
        </button>

        <article className="announcer-profile-card">
          <div className="announcer-profile-hero">
            <div className="announcer-profile-photo-wrap">
              <img src={profile.photoUrl} alt={`Foto ${profile.airName}`} />
            </div>
            <div className="announcer-profile-hero-copy">
              <p>
                <Radio size={15} />
                {data.station.frequency}
              </p>
              <h2>{profile.airName}</h2>
              <strong>{profile.fullName}</strong>
              <span>
                <BadgeCheck size={15} />
                {profile.active ? "Penyiar aktif" : "Tidak aktif"}
              </span>
            </div>
          </div>

          <div className="announcer-profile-stats">
            <span>
              <CalendarDays size={17} />
              <strong>{workload.days.length}</strong>
              Hari
            </span>
            <span>
              <Mic2 size={17} />
              <strong>{workload.slotCount}</strong>
              Slot
            </span>
            <span>
              <Clock3 size={17} />
              <strong>{workload.totalHours}</strong>
              Jam
            </span>
          </div>

          <section className="announcer-profile-focus" aria-label="Ringkasan jadwal penyiar">
            <div>
              <small>Jadwal terdekat</small>
              <strong>
                {firstSlot
                  ? `${firstSlot.day}, ${firstSlot.time} WITA`
                  : "Belum ada slot utama"}
              </strong>
              <span>{firstSlot?.program ?? "Slot akan tampil setelah jadwal utama tersedia."}</span>
            </div>
            <div className="announcer-profile-day-chips" aria-label="Hari siaran">
              {workload.days.length > 0 ? (
                workload.days.map((day) => <span key={day}>{day}</span>)
              ) : (
                <span>Belum terjadwal</span>
              )}
            </div>
          </section>

          <section className="announcer-profile-slots" aria-label={`Jadwal siaran ${profile.airName}`}>
            <h3>Jadwal Siaran</h3>
            {dayGroups.length > 0 ? (
              dayGroups.map((group) => (
                <div className="announcer-profile-day-group" key={group.day}>
                  <div className="announcer-profile-day-title">
                    <CalendarDays size={16} />
                    <strong>{group.day}</strong>
                    <span>{group.slots.length} slot</span>
                  </div>
                  {group.slots.map((slot) => (
                    <div
                      key={`${slot.day}-${slot.time}-${slot.program}`}
                      className="announcer-profile-slot-button announcer-profile-slot-static"
                    >
                      <Mic2 size={16} />
                      <span>
                        <strong>{slot.program}</strong>
                        <small>{slot.description}</small>
                      </span>
                      <time>
                        <CalendarClock size={15} />
                        {slot.time} WITA
                      </time>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p>Belum ada slot utama pada jadwal siaran.</p>
            )}
          </section>

          {profile.note && <p className="announcer-profile-note">{profile.note}</p>}
        </article>
      </div>

      {/* Modal dinonaktifkan atas permintaan pengguna */}
    </div>
  );
}
