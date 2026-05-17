import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  History,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Mic2,
  Navigation,
  Phone,
  Shield,
  User
} from "lucide-react";
import { listMyAttendanceRecords } from "../services/attendance.service";
import type { AttendanceRecord, AttendanceStatus, TimestampLike } from "../types/domain";
import { updateUserPassword, type AuthSession } from "../services/auth.service";
import { upsertUserProfile } from "../services/userProfile.service";
import { getRoleLabel } from "../utils/rbac";

type PeriodMode = "week" | "month" | "year";
type StatTone = "blue" | "green" | "amber" | "red";

function toDate(value: TimestampLike | { toDate?: () => Date; seconds?: number }): Date {
  if (value && typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate();
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
  }

  return new Date(value as string | number | Date);
}

function statusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    present: "Tepat Lokasi",
    outside_radius: "Luar Radius",
    late: "Terlambat",
    valid: "Tervalidasi",
    needs_review: "Perlu Review",
    rejected: "Ditolak",
    sick: "Sakit",
    leave: "Izin"
  };
  return labels[status];
}

function statusClass(status: AttendanceStatus): string {
  return status.replace(/_/g, "-");
}

function toWeekInputValue(date: Date): string {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));

  const weekOne = new Date(target.getFullYear(), 0, 4);
  const week = 1 + Math.round(
    ((target.getTime() - weekOne.getTime()) / 86400000 - 3 + ((weekOne.getDay() + 6) % 7)) / 7
  );

  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function toMonthInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekRange(value: string) {
  const [yearText, weekText] = value.split("-W");
  const year = Number(yearText);
  const week = Number(weekText);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const day = simple.getDay();
  const isoWeekStart = new Date(simple);

  if (day <= 4) {
    isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  isoWeekStart.setHours(0, 0, 0, 0);
  const end = new Date(isoWeekStart);
  end.setDate(isoWeekStart.getDate() + 7);

  return { start: isoWeekStart, end };
}

function getPeriodRange(mode: PeriodMode, weekValue: string, monthValue: string, yearValue: number) {
  if (mode === "week") {
    return getWeekRange(weekValue);
  }

  if (mode === "month") {
    const [year, month] = monthValue.split("-").map(Number);
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 1)
    };
  }

  return {
    start: new Date(yearValue, 0, 1),
    end: new Date(yearValue + 1, 0, 1)
  };
}

function formatPeriodLabel(start: Date, end: Date, mode: PeriodMode): string {
  if (mode === "year") {
    return start.toLocaleDateString("id-ID", { year: "numeric" });
  }

  const inclusiveEnd = new Date(end);
  inclusiveEnd.setDate(end.getDate() - 1);

  if (mode === "month") {
    return start.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  return `${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${inclusiveEnd.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function ProfilePage({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const today = useMemo(() => new Date(), []);
  const [displayName, setDisplayName] = useState(session.user.displayName || "");
  const [whatsapp, setWhatsapp] = useState(session.user.whatsapp || "");
  const [airName, setAirName] = useState(session.user.airName || "");
  const [photoUrl, setPhotoUrl] = useState(session.user.photoUrl || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "attendance">("info");
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [weekValue, setWeekValue] = useState(toWeekInputValue(today));
  const [monthValue, setMonthValue] = useState(toMonthInputValue(today));
  const [yearValue, setYearValue] = useState(today.getFullYear());

  useEffect(() => {
    setDisplayName(session.user.displayName || "");
    setWhatsapp(session.user.whatsapp || "");
    setAirName(session.user.airName || "");
    setPhotoUrl(session.user.photoUrl || "");
  }, [session.user]);

  useEffect(() => {
    if (activeTab === "attendance") {
      setAttendanceLoading(true);
      listMyAttendanceRecords(session.user.id)
        .then((records) => {
          setMyRecords(records.sort((a, b) => toDate(b.checkInAt).getTime() - toDate(a.checkInAt).getTime()));
        })
        .finally(() => setAttendanceLoading(false));
    }
  }, [activeTab, session.user.id]);

  const periodRange = useMemo(
    () => getPeriodRange(periodMode, weekValue, monthValue, yearValue),
    [monthValue, periodMode, weekValue, yearValue]
  );

  const filteredMyRecords = useMemo(
    () =>
      myRecords.filter((record) => {
        const date = toDate(record.checkInAt);
        return date >= periodRange.start && date < periodRange.end;
      }),
    [myRecords, periodRange.end, periodRange.start]
  );

  const attendanceStats = {
    total: filteredMyRecords.length,
    present: filteredMyRecords.filter((record) => record.status === "present").length,
    outside: filteredMyRecords.filter((record) => record.status === "outside_radius").length,
    late: filteredMyRecords.filter((record) => record.status === "late").length
  };
  const attendanceRate = attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;
  const latestAttendance = filteredMyRecords[0];
  const periodLabel = formatPeriodLabel(periodRange.start, periodRange.end, periodMode);
  const canUseAirName = ["super_admin", "admin", "announcer"].includes(session.user.role);
  const profileChecklist = useMemo(
    () => [
      { label: "Nama", complete: Boolean(displayName.trim()) },
      { label: "Email", complete: Boolean(session.user.email.trim()) },
      { label: "WhatsApp", complete: Boolean(whatsapp.trim()) },
      ...(canUseAirName ? [{ label: "Nama udara", complete: Boolean(airName.trim()) }] : []),
      { label: "Foto", complete: Boolean(photoUrl.trim() || session.user.photoUrl) }
    ],
    [airName, canUseAirName, displayName, photoUrl, session.user.email, session.user.photoUrl, whatsapp]
  );
  const profileCompleteCount = profileChecklist.filter((item) => item.complete).length;
  const profileCompletion = Math.round((profileCompleteCount / profileChecklist.length) * 100);
  const roleLabel = getRoleLabel(session.user.role);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (
        displayName !== session.user.displayName ||
        whatsapp !== session.user.whatsapp ||
        airName !== session.user.airName ||
        photoUrl !== session.user.photoUrl
      ) {
        await upsertUserProfile(session.user.id, {
          displayName,
          whatsapp,
          airName,
          photoUrl
        });
      }

      if (password) {
        await updateUserPassword(password);
        setPassword("");
      }

      setMessage("Profil berhasil diperbarui!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      if (err instanceof Error && err.message.includes("requires-recent-login")) {
        setError("Untuk keamanan, Anda harus Keluar lalu Login kembali sebelum mengganti password.");
      } else {
        setError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <h1>Profil Saya</h1>
        <div className="profile-tabs" role="tablist" aria-label="Menu profil">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "info"}
            className={activeTab === "info" ? "active" : ""}
            onClick={() => setActiveTab("info")}
          >
            Informasi Akun
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "attendance"}
            className={activeTab === "attendance" ? "active" : ""}
            onClick={() => setActiveTab("attendance")}
          >
            Riwayat Absensi
          </button>
        </div>
      </div>

      <main className="profile-content">
        <section className="profile-hero-card">
          <div className="profile-hero-band"></div>
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <img src={session.user.photoUrl || "/iconSBL.svg"} alt="Foto Profil" />
              <span>
                <Camera size={14} />
              </span>
            </div>

            <h2>{session.user.displayName}</h2>
            <div className="profile-email">
              <Mail size={14} /> {session.user.email}
            </div>

            <div className="profile-role-badge">
              <Shield size={14} /> {roleLabel}
            </div>
          </div>
        </section>

        <section className="profile-readiness-panel" aria-label="Kesiapan profil akun">
          <article className="profile-readiness-card is-primary">
            <div>
              <BadgeCheck size={18} />
              <span>Kelengkapan profil</span>
            </div>
            <strong>{profileCompletion}%</strong>
            <progress value={profileCompletion} max={100} aria-label={`Kelengkapan profil ${profileCompletion}%`} />
            <p>{profileCompleteCount} dari {profileChecklist.length} data utama sudah terisi.</p>
          </article>
          <article className="profile-readiness-card">
            <div>
              <Phone size={18} />
              <span>Kontak operasional</span>
            </div>
            <strong>{whatsapp.trim() ? "Siap dihubungi" : "Lengkapi WA"}</strong>
            <p>{whatsapp.trim() ? whatsapp : "Nomor WhatsApp membantu notifikasi dan koordinasi jadwal."}</p>
          </article>
          <article className="profile-readiness-card">
            <div>
              <Shield size={18} />
              <span>Akses akun</span>
            </div>
            <strong>{roleLabel}</strong>
            <p>{session.user.active ? "Akun aktif dan siap digunakan." : "Akun belum aktif penuh."}</p>
          </article>
        </section>

        {activeTab === "info" ? (
          <section className="profile-panel">
            <h3>Informasi Pribadi</h3>

            {error && <p className="profile-alert error">{error}</p>}
            {message && <p className="profile-alert success">{message}</p>}

            <form onSubmit={handleSave} className="profile-form">
              <ProfileField label="Nama Lengkap" icon={<User size={16} />}>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </ProfileField>

              <ProfileField label="Nomor WhatsApp" icon={<Phone size={16} />}>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Contoh: 08123456789" />
              </ProfileField>

              {["super_admin", "admin", "announcer"].includes(session.user.role) && (
                <ProfileField label="Nama Udara (Air Name)" icon={<Mic2 size={16} />} helper="Nama ini akan muncul pada jadwal dan pembuat naskah AI.">
                  <input value={airName} onChange={(e) => setAirName(e.target.value)} placeholder="Contoh: Amar SBL" />
                </ProfileField>
              )}

              <ProfileField label="URL Foto Profil" icon={<Camera size={16} />}>
                <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://.../foto.jpg" />
              </ProfileField>

              <div className="profile-divider"></div>

              <ProfileField label="Ganti Password" icon={<KeyRound size={16} />}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin ganti sandi"
                />
              </ProfileField>

              <button type="submit" disabled={loading} className="profile-save-button">
                <CheckCircle2 size={20} />
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>

            <button type="button" onClick={onLogout} className="profile-logout-button">
              <LogOut size={20} /> Keluar dari Akun
            </button>
          </section>
        ) : (
          <section className="profile-panel">
            <div className="profile-panel-head">
              <div>
                <h3>Kehadiran Saya</h3>
                <p>Statistik dan detail absensi untuk {periodLabel}.</p>
              </div>
              {latestAttendance && (
                <span>Update terakhir {toDate(latestAttendance.checkInAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
              )}
            </div>

            <div className="profile-filter-panel">
              <div className="profile-filter-title">
                <Filter size={17} />
                Filter Rekap Absensi
              </div>
              <div className="profile-filter-grid">
                <label>
                  Periode
                  <select value={periodMode} onChange={(event) => setPeriodMode(event.target.value as PeriodMode)}>
                    <option value="week">Minggu</option>
                    <option value="month">Bulan</option>
                    <option value="year">Tahun</option>
                  </select>
                </label>

                {periodMode === "week" && (
                  <label>
                    Pilih Minggu
                    <input type="week" value={weekValue} onChange={(event) => setWeekValue(event.target.value)} />
                  </label>
                )}

                {periodMode === "month" && (
                  <label>
                    Pilih Bulan
                    <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
                  </label>
                )}

                {periodMode === "year" && (
                  <label>
                    Pilih Tahun
                    <input
                      type="number"
                      min="2024"
                      max="2100"
                      value={yearValue}
                      onChange={(event) => setYearValue(Number(event.target.value) || today.getFullYear())}
                    />
                  </label>
                )}

                <div className="profile-period-pill">
                  <CalendarDays size={16} />
                  <span>{periodLabel}</span>
                </div>
              </div>
            </div>

            <div className="profile-stat-grid">
              <AttendanceStatCard icon={<CalendarDays size={18} />} label="Total" value={attendanceStats.total} tone="blue" />
              <AttendanceStatCard icon={<CheckCircle2 size={18} />} label="Tepat Lokasi" value={attendanceStats.present} tone="green" />
              <AttendanceStatCard icon={<MapPin size={18} />} label="Luar Radius" value={attendanceStats.outside} tone="amber" />
              <AttendanceStatCard icon={<AlertTriangle size={18} />} label="Terlambat" value={attendanceStats.late} tone="red" />
            </div>

            <div className="profile-attendance-rate">
              <div>
                <span>Rasio tepat lokasi</span>
                <strong>{attendanceRate}%</strong>
              </div>
              <progress value={attendanceRate} max={100} aria-label={`Rasio tepat lokasi ${attendanceRate}%`} />
            </div>

            <div className="profile-history-list">
              {attendanceLoading ? (
                <div className="profile-empty-state">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div className="ui-skeleton-row" key={index}>
                      <span className="ui-skeleton avatar" />
                      <span className="ui-skeleton-copy">
                        <span className="ui-skeleton line medium" />
                        <span className="ui-skeleton line short" />
                      </span>
                    </div>
                  ))}
                  <p>Memuat riwayat absensi...</p>
                </div>
              ) : filteredMyRecords.length === 0 ? (
                <div className="profile-empty-state">
                  <History size={48} />
                  <p>Belum ada riwayat absensi pada periode ini.</p>
                </div>
              ) : (
                filteredMyRecords.slice(0, 30).map((rec: AttendanceRecord) => (
                  <AttendanceDetailRow key={rec.id} record={rec} />
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ProfileField({
  label,
  icon,
  helper,
  children
}: {
  label: string;
  icon: ReactNode;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="profile-field">
      <span>{icon} {label}</span>
      {children}
      {helper && <small>{helper}</small>}
    </label>
  );
}

function AttendanceStatCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: StatTone }) {
  return (
    <article className={`profile-stat-card ${tone}`}>
      <div>{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function AttendanceDetailRow({ record }: { record: AttendanceRecord }) {
  const date = toDate(record.checkInAt);
  const mapsUrl = `https://www.google.com/maps?q=${record.latitude},${record.longitude}`;
  const normalizedStatus = statusClass(record.status);

  return (
    <article className="profile-attendance-row">
      <div className={`profile-attendance-icon ${normalizedStatus}`}>
        {record.status === "present" ? <CheckCircle2 size={21} /> : record.status === "late" ? <AlertTriangle size={21} /> : <MapPin size={21} />}
      </div>
      <div className="profile-attendance-copy">
        <div>
          <strong>{date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</strong>
          <span className={`profile-attendance-status ${normalizedStatus}`}>{statusLabel(record.status)}</span>
        </div>
        <p>
          <span>
            <Clock size={13} /> {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {record.airName && <span>{record.airName}</span>}
          {record.selfieDriveFileId && <span>ID foto: {record.selfieDriveFileId}</span>}
        </p>
      </div>
      <a href={mapsUrl} target="_blank" rel="noreferrer" aria-label="Buka lokasi absensi di Google Maps" className="profile-map-link">
        <Navigation size={17} />
        <ExternalLink size={11} />
      </a>
    </article>
  );
}
