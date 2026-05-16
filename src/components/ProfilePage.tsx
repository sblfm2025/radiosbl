import { useState, useEffect, useMemo, type CSSProperties, type FormEvent } from "react";
import {
  AlertTriangle,
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
    late: "Terlambat"
  };
  return labels[status];
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

function statusColor(status: AttendanceStatus) {
  const colors: Record<AttendanceStatus, { bg: string; text: string; icon: string }> = {
    present: { bg: "rgba(17,163,106,0.1)", text: "#059669", icon: "#11a36a" },
    outside_radius: { bg: "rgba(245,158,11,0.12)", text: "#b45309", icon: "#f59e0b" },
    late: { bg: "rgba(239,68,68,0.1)", text: "#dc2626", icon: "#ef4444" }
  };
  return colors[status];
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

  // Pastikan form selalu sinkron jika data user di sesi berubah (misal setelah auto-link)
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
          setMyRecords(
            records.sort((a, b) => toDate(b.checkInAt).getTime() - toDate(a.checkInAt).getTime())
          );
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
  const attendanceRate =
    attendanceStats.total > 0
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;
  const latestAttendance = filteredMyRecords[0];
  const periodLabel = formatPeriodLabel(periodRange.start, periodRange.end, periodMode);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (
        displayName !== session.user.displayName ||
        whatsapp !== session.user.whatsapp ||
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
    <div style={{ background: "#f8f9fc", minHeight: "100vh", paddingBottom: "100px" }}>
      <div style={{ background: "white", padding: "16px 20px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: "1.4rem", margin: "0 0 16px", color: "var(--ink)", fontWeight: 700 }}>Profil Saya</h1>
        <div style={{ display: "flex", gap: "24px" }}>
          <button 
            onClick={() => setActiveTab("info")}
            style={{ padding: "0 4px 12px", border: "none", background: "none", fontSize: "0.95rem", fontWeight: activeTab === "info" ? 800 : 500, color: activeTab === "info" ? "var(--blue)" : "var(--muted)", borderBottom: activeTab === "info" ? "3px solid var(--blue)" : "3px solid transparent", cursor: "pointer" }}
          >
            Informasi Akun
          </button>
          <button 
            onClick={() => setActiveTab("attendance")}
            style={{ padding: "0 4px 12px", border: "none", background: "none", fontSize: "0.95rem", fontWeight: activeTab === "attendance" ? 800 : 500, color: activeTab === "attendance" ? "var(--blue)" : "var(--muted)", borderBottom: activeTab === "attendance" ? "3px solid var(--blue)" : "3px solid transparent", cursor: "pointer" }}
          >
            Riwayat Absensi
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>
        
        {/* Profile Card (Header) */}
        <div style={{ background: "white", borderRadius: "32px", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "120px", background: "linear-gradient(135deg, var(--blue), #8b5cf6)", zIndex: 0 }}></div>
          
          <div style={{ position: "relative", zIndex: 1, marginTop: "24px", textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={session.user.photoUrl || "/iconSBL.svg"}
                alt="Foto Profil"
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid white", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", backgroundColor: "white" }}
              />
              <div style={{ position: "absolute", bottom: "4px", right: "4px", background: "var(--blue)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", border: "3px solid white" }}>
                <Camera size={14} />
              </div>
            </div>
            
            <h2 style={{ margin: "16px 0 4px", fontSize: "1.6rem", color: "var(--ink)", fontWeight: 800 }}>{session.user.displayName}</h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--muted)", fontSize: "0.9rem", marginBottom: "12px" }}>
              <Mail size={14} /> {session.user.email}
            </div>
            
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", padding: "6px 14px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "bold" }}>
              <Shield size={14} /> {getRoleLabel(session.user.role)}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {activeTab === "info" ? (
          <div style={{ background: "white", borderRadius: "32px", padding: "32px 24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)" }}>
            <h3 style={{ margin: "0 0 24px", fontSize: "1.2rem", color: "var(--ink)", fontWeight: 700 }}>Informasi Pribadi</h3>
            
            {error && <p style={{ background: "rgba(255, 59, 59, 0.1)", color: "#FF3B3B", padding: "12px 16px", borderRadius: "16px", fontSize: "0.85rem", marginBottom: "20px", fontWeight: "bold" }}>{error}</p>}
            {message && <p style={{ background: "rgba(17,163,106,0.1)", color: "#11a36a", padding: "12px 16px", borderRadius: "16px", fontSize: "0.85rem", marginBottom: "20px", fontWeight: "bold" }}>{message}</p>}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={16} color="var(--blue)" /> Nama Lengkap
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "1rem", background: "rgba(0,0,0,0.02)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={16} color="var(--blue)" /> Nomor WhatsApp
                </label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "1rem", background: "rgba(0,0,0,0.02)" }}
                />
              </div>

              {["super_admin", "admin", "announcer"].includes(session.user.role) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Mic2 size={16} color="var(--blue)" /> Nama Udara (Air Name)
                  </label>
                  <input
                    value={airName}
                    onChange={(e) => setAirName(e.target.value)}
                    placeholder="Contoh: Amar SBL"
                    style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "1rem", background: "rgba(0,0,0,0.02)" }}
                  />
                  <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Nama ini akan muncul pada jadwal dan pembuat naskah AI.</small>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Camera size={16} color="var(--blue)" /> URL Foto Profil
                </label>
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://.../foto.jpg"
                  style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "1rem", background: "rgba(0,0,0,0.02)" }}
                />
              </div>

              <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", margin: "12px 0" }}></div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <KeyRound size={16} color="var(--blue)" /> Ganti Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin ganti sandi"
                  style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "1rem", background: "rgba(0,0,0,0.02)" }}
                />
              </div>

              <button type="submit" disabled={loading} style={{ padding: "18px", borderRadius: "99px", background: "var(--blue)", color: "white", border: "none", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "16px", cursor: "pointer", fontSize: "1rem", boxShadow: "0 12px 24px rgba(22, 119, 237, 0.25)" }}>
                <CheckCircle2 size={20} />
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
            
            <button 
              type="button" 
              onClick={onLogout} 
              style={{ width: "100%", padding: "18px", borderRadius: "99px", background: "rgba(255, 59, 59, 0.1)", color: "#FF3B3B", border: "none", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "16px", cursor: "pointer", fontSize: "1rem" }}
            >
              <LogOut size={20} /> Keluar dari Akun
            </button>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "32px", padding: "32px 24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "24px" }}>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", color: "var(--ink)", fontWeight: 700 }}>Kehadiran Saya</h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>Statistik dan detail absensi untuk {periodLabel}.</p>
              </div>
              {latestAttendance && (
                <span style={{ flex: "0 0 auto", borderRadius: "99px", padding: "7px 12px", background: "#eef5ff", color: "var(--blue)", fontSize: "0.78rem", fontWeight: 800 }}>
                  Update terakhir {toDate(latestAttendance.checkInAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>

            <div style={{ borderRadius: "22px", padding: "16px", background: "#f8fafc", border: "1px solid rgba(15,23,42,0.06)", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "var(--ink)", fontWeight: 800, fontSize: "0.92rem" }}>
                <Filter size={17} color="var(--blue)" />
                Filter Rekap Absensi
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", alignItems: "end" }}>
                <label style={attendanceFilterLabelStyle}>
                  Periode
                  <select
                    value={periodMode}
                    onChange={(event) => setPeriodMode(event.target.value as PeriodMode)}
                    style={attendanceFilterControlStyle}
                  >
                    <option value="week">Minggu</option>
                    <option value="month">Bulan</option>
                    <option value="year">Tahun</option>
                  </select>
                </label>

                {periodMode === "week" && (
                  <label style={attendanceFilterLabelStyle}>
                    Pilih Minggu
                    <input
                      type="week"
                      value={weekValue}
                      onChange={(event) => setWeekValue(event.target.value)}
                      style={attendanceFilterControlStyle}
                    />
                  </label>
                )}

                {periodMode === "month" && (
                  <label style={attendanceFilterLabelStyle}>
                    Pilih Bulan
                    <input
                      type="month"
                      value={monthValue}
                      onChange={(event) => setMonthValue(event.target.value)}
                      style={attendanceFilterControlStyle}
                    />
                  </label>
                )}

                {periodMode === "year" && (
                  <label style={attendanceFilterLabelStyle}>
                    Pilih Tahun
                    <input
                      type="number"
                      min="2024"
                      max="2100"
                      value={yearValue}
                      onChange={(event) => setYearValue(Number(event.target.value) || today.getFullYear())}
                      style={attendanceFilterControlStyle}
                    />
                  </label>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "42px", borderRadius: "14px", padding: "10px 12px", background: "#eef5ff", color: "var(--blue)", fontWeight: 800, fontSize: "0.82rem" }}>
                  <CalendarDays size={16} />
                  <span>{periodLabel}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "24px" }}>
              <AttendanceStatCard icon={<CalendarDays size={18} />} label="Total" value={attendanceStats.total} color="var(--blue)" />
              <AttendanceStatCard icon={<CheckCircle2 size={18} />} label="Tepat Lokasi" value={attendanceStats.present} color="#11a36a" />
              <AttendanceStatCard icon={<MapPin size={18} />} label="Luar Radius" value={attendanceStats.outside} color="#f59e0b" />
              <AttendanceStatCard icon={<AlertTriangle size={18} />} label="Terlambat" value={attendanceStats.late} color="#ef4444" />
            </div>

            <div style={{ marginBottom: "24px", padding: "18px", borderRadius: "22px", background: "linear-gradient(135deg, rgba(22,119,237,0.08), rgba(17,163,106,0.08))", border: "1px solid rgba(22,119,237,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ color: "var(--ink)", fontWeight: 800, fontSize: "0.95rem" }}>Rasio tepat lokasi</span>
                <strong style={{ color: "var(--blue)", fontSize: "1.15rem" }}>{attendanceRate}%</strong>
              </div>
              <div style={{ height: "10px", borderRadius: "99px", background: "rgba(15,23,42,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${attendanceRate}%`, height: "100%", borderRadius: "99px", background: "linear-gradient(90deg, var(--blue), #11a36a)" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {attendanceLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  <div className="spinner-small" style={{ margin: "0 auto 12px" }}></div>
                  <p>Memuat riwayat absensi...</p>
                </div>
              ) : filteredMyRecords.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  <History size={48} style={{ opacity: 0.1, marginBottom: "12px" }} />
                  <p>Belum ada riwayat absensi pada periode ini.</p>
                </div>
              ) : (
                filteredMyRecords.slice(0, 30).map((rec: AttendanceRecord) => (
                  <AttendanceDetailRow key={rec.id} record={rec} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceStatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ borderRadius: "18px", padding: "16px", background: "#f8fafc", border: "1px solid rgba(15,23,42,0.06)" }}>
      <div style={{ color, marginBottom: "10px" }}>{icon}</div>
      <div style={{ fontSize: "1.55rem", fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 800, marginTop: "6px" }}>{label}</div>
    </div>
  );
}

const attendanceFilterLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "var(--muted)",
  fontSize: "0.78rem",
  fontWeight: 800
};

const attendanceFilterControlStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "12px",
  border: "1px solid rgba(15,23,42,0.12)",
  background: "white",
  color: "var(--ink)",
  outline: "none",
  padding: "9px 11px",
  fontWeight: 700
};

function AttendanceDetailRow({ record }: { record: AttendanceRecord }) {
  const date = toDate(record.checkInAt);
  const colors = statusColor(record.status);
  const mapsUrl = `https://www.google.com/maps?q=${record.latitude},${record.longitude}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "14px", alignItems: "center", padding: "14px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 6px 18px rgba(12, 36, 70, 0.04)" }}>
      <div style={{ background: colors.bg, color: colors.icon, width: "42px", height: "42px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {record.status === "present" ? <CheckCircle2 size={21} /> : record.status === "late" ? <AlertTriangle size={21} /> : <MapPin size={21} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "5px" }}>
          <strong style={{ color: "var(--ink)", fontSize: "0.95rem" }}>
            {date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
          </strong>
          <span style={{ padding: "4px 9px", borderRadius: "99px", background: colors.bg, color: colors.text, fontSize: "0.72rem", fontWeight: 800 }}>
            {statusLabel(record.status)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--muted)", fontSize: "0.8rem", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Clock size={13} /> {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {record.airName && <span>{record.airName}</span>}
          {record.selfieDriveFileId && <span>ID foto: {record.selfieDriveFileId}</span>}
        </div>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Buka lokasi absensi di Google Maps"
        style={{ width: "40px", height: "40px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef5ff", color: "var(--blue)", textDecoration: "none" }}
      >
        <Navigation size={17} />
        <ExternalLink size={11} style={{ marginLeft: "-2px", marginTop: "-10px" }} />
      </a>
    </div>
  );
}
