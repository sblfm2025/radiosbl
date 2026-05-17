import { ArrowLeft, CalendarClock, Mic2, X } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import { getProgramInfo } from "../data/radioData";
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
            <div>
              <p>{data.station.frequency}</p>
              <h2>{profile.airName}</h2>
              <strong>{profile.fullName}</strong>
              <span>{profile.active ? "Penyiar aktif" : "Tidak aktif"}</span>
            </div>
          </div>

          <div className="announcer-profile-stats">
            <span>
              <strong>{workload.days.length}</strong>
              Hari
            </span>
            <span>
              <strong>{workload.slotCount}</strong>
              Slot
            </span>
            <span>
              <strong>{workload.totalHours}</strong>
              Jam
            </span>
          </div>

          <section className="announcer-profile-slots" aria-label={`Jadwal siaran ${profile.airName}`}>
            <h3>Jadwal Siaran</h3>
            {workload.slots.length > 0 ? (
              workload.slots.map((slot) => {
                const programInfo = getProgramInfo(slot.program);

                return (
                  <div
                    key={`${slot.day}-${slot.time}-${slot.program}`}
                    className="announcer-profile-slot-button"
                    style={{ cursor: "default" }}
                  >
                    <Mic2 size={16} />
                    <span>
                      <strong>{slot.program}</strong>
                      <small>{slot.day}</small>
                    </span>
                    <time>
                      <CalendarClock size={15} />
                      {slot.time} WITA
                    </time>
                  </div>
                );
              })
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
