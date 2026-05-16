import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  MapPin,
  Users
} from "lucide-react";
import { listAttendanceRecords } from "../services/attendance.service";
import { listUserProfiles } from "../services/userProfile.service";
import type { AppUser, AttendanceRecord, TimestampLike, UserRole } from "../types/domain";

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

function roleMatchesRecord(record: AttendanceRecord, selectedRole: string, userById: Map<string, AppUser>): boolean {
  if (selectedRole === "all") {
    return true;
  }

  return userById.get(record.userId)?.role === selectedRole;
}

export function AttendanceReportPage() {
  const today = useMemo(() => new Date(), []);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [weekValue, setWeekValue] = useState(toWeekInputValue(today));
  const [monthValue, setMonthValue] = useState(toMonthInputValue(today));
  const [yearValue, setYearValue] = useState(today.getFullYear());

  useEffect(() => {
    async function loadData() {
      try {
        const [attData, userData] = await Promise.all([
          listAttendanceRecords(),
          listUserProfiles()
        ]);
        setRecords(attData);
        setUsers(userData);
      } catch (err) {
        console.error("Gagal memuat rekap:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const userById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users]
  );

  const periodRange = useMemo(
    () => getPeriodRange(periodMode, weekValue, monthValue, yearValue),
    [monthValue, periodMode, weekValue, yearValue]
  );

  const filteredRecords = useMemo(
    () =>
      records
        .filter((record) => {
          const date = toDate(record.checkInAt);
          return date >= periodRange.start && date < periodRange.end;
        })
        .filter((record) => roleMatchesRecord(record, filterRole, userById))
        .sort((a, b) => toDate(b.checkInAt).getTime() - toDate(a.checkInAt).getTime()),
    [filterRole, periodRange.end, periodRange.start, records, userById]
  );

  const periodRecords = useMemo(
    () =>
      records.filter((record) => {
        const date = toDate(record.checkInAt);
        return date >= periodRange.start && date < periodRange.end;
      }),
    [periodRange.end, periodRange.start, records]
  );

  const announcerSummary = useMemo(() => {
    const announcerUsers = users
      .filter((user) => user.role === "announcer")
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return announcerUsers.map((user) => {
      const userRecords = periodRecords.filter((record) => record.userId === user.id);
      const present = userRecords.filter((record) => record.status === "present").length;
      const outside = userRecords.filter((record) => record.status === "outside_radius").length;
      const late = userRecords.filter((record) => record.status === "late").length;
      const total = userRecords.length;

      return {
        user,
        total,
        present,
        outside,
        late,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
        latest: userRecords
          .slice()
          .sort((a, b) => toDate(b.checkInAt).getTime() - toDate(a.checkInAt).getTime())[0]
      };
    });
  }, [periodRecords, users]);

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter((record) => record.status === "present").length,
    outside: filteredRecords.filter((record) => record.status === "outside_radius").length,
    late: filteredRecords.filter((record) => record.status === "late").length
  };

  const periodLabel = formatPeriodLabel(periodRange.start, periodRange.end, periodMode);

  return (
    <div className="attendance-report" style={{ padding: "20px", background: "#f8f9fc", minHeight: "100vh" }}>
      <header style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 8px" }}>Rekap Kehadiran Staf</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>Pantau kedisiplinan dan lokasi absensi seluruh kru Radio SBL.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard icon={<Users size={20} />} label="Total Absen" value={stats.total} color="var(--blue)" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Tepat Lokasi" value={stats.present} color="#11a36a" />
        <StatCard icon={<MapPin size={20} />} label="Luar Radius" value={stats.outside} color="#f59e0b" />
        <StatCard icon={<AlertTriangle size={20} />} label="Terlambat" value={stats.late} color="#ef4444" />
      </div>

      <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "var(--ink)", fontWeight: 800 }}>
          <Filter size={18} color="var(--blue)" />
          Filter Rekap
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", fontWeight: 800, color: "var(--muted)" }}>
            Periode
            <select
              value={periodMode}
              onChange={(event) => setPeriodMode(event.target.value as PeriodMode)}
              style={filterControlStyle}
            >
              <option value="week">Minggu</option>
              <option value="month">Bulan</option>
              <option value="year">Tahun</option>
            </select>
          </label>

          {periodMode === "week" && (
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", fontWeight: 800, color: "var(--muted)" }}>
              Pilih Minggu
              <input type="week" value={weekValue} onChange={(event) => setWeekValue(event.target.value)} style={filterControlStyle} />
            </label>
          )}

          {periodMode === "month" && (
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", fontWeight: 800, color: "var(--muted)" }}>
              Pilih Bulan
              <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} style={filterControlStyle} />
            </label>
          )}

          {periodMode === "year" && (
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", fontWeight: 800, color: "var(--muted)" }}>
              Pilih Tahun
              <input
                type="number"
                min="2024"
                max="2100"
                value={yearValue}
                onChange={(event) => setYearValue(Number(event.target.value) || today.getFullYear())}
                style={filterControlStyle}
              />
            </label>
          )}

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", fontWeight: 800, color: "var(--muted)" }}>
            Role
            <select
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value as UserRole | "all")}
              style={filterControlStyle}
            >
              <option value="all">Semua Role</option>
              <option value="announcer">Penyiar</option>
              <option value="reporter">Reporter</option>
              <option value="operator">Operator</option>
              <option value="employee">Staf / Pegawai</option>
            </select>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", borderRadius: "14px", background: "#eef5ff", color: "var(--blue)", fontWeight: 800, minHeight: "44px" }}>
            <Calendar size={17} />
            <span>{periodLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Rekap Absensi Penyiar</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              Ringkasan kehadiran penyiar untuk {periodLabel}.
            </p>
          </div>
          <span style={{ padding: "8px 12px", borderRadius: "99px", background: "#eef5ff", color: "var(--blue)", fontWeight: 800, fontSize: "0.8rem" }}>
            {announcerSummary.length} penyiar
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px" }}><div className="spinner-small" style={{ margin: "auto" }}></div></div>
        ) : announcerSummary.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>
            <Users size={40} style={{ opacity: 0.18, marginBottom: "10px" }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Belum ada data penyiar.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "780px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f3f5", textAlign: "left" }}>
                  <th style={tableHeadStyle}>PENYIAR</th>
                  <th style={tableHeadStyle}>TOTAL</th>
                  <th style={tableHeadStyle}>TEPAT LOKASI</th>
                  <th style={tableHeadStyle}>LUAR RADIUS</th>
                  <th style={tableHeadStyle}>TERLAMBAT</th>
                  <th style={tableHeadStyle}>RASIO</th>
                  <th style={tableHeadStyle}>TERAKHIR</th>
                </tr>
              </thead>
              <tbody>
                {announcerSummary.map((item) => (
                  <tr key={item.user.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 800 }}>{item.user.displayName}</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{item.user.airName || item.user.email}</div>
                    </td>
                    <td style={summaryCellStyle}>{item.total}</td>
                    <td style={{ ...summaryCellStyle, color: "#059669" }}>{item.present}</td>
                    <td style={{ ...summaryCellStyle, color: "#d97706" }}>{item.outside}</td>
                    <td style={{ ...summaryCellStyle, color: "#dc2626" }}>{item.late}</td>
                    <td style={{ padding: "16px", minWidth: "130px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "8px", background: "rgba(15,23,42,0.08)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${item.rate}%`, height: "100%", background: item.rate >= 80 ? "#11a36a" : item.rate >= 50 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <strong style={{ fontSize: "0.82rem", color: "var(--ink)", minWidth: "34px" }}>{item.rate}%</strong>
                      </div>
                    </td>
                    <td style={{ padding: "16px", color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700 }}>
                      {item.latest
                        ? toDate(item.latest.checkInAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Daftar Kehadiran</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              Menampilkan {filteredRecords.length} data untuk {periodLabel}.
            </p>
          </div>
          <button style={{ padding: "10px 16px", borderRadius: "12px", border: "none", background: "var(--blue)", color: "white", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
            <Download size={18} /> Export
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}><div className="spinner-small" style={{ margin: "auto" }}></div></div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: "center", padding: "44px 16px", color: "var(--muted)" }}>
            <Calendar size={44} style={{ opacity: 0.18, marginBottom: "12px" }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Belum ada data absensi pada filter ini.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f3f5", textAlign: "left" }}>
                  <th style={tableHeadStyle}>STAF</th>
                  <th style={tableHeadStyle}>ROLE</th>
                  <th style={tableHeadStyle}>WAKTU</th>
                  <th style={tableHeadStyle}>STATUS</th>
                  <th style={tableHeadStyle}>LOKASI (GPS)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 100).map((record) => {
                  const user = userById.get(record.userId);
                  const checkInAt = toDate(record.checkInAt);

                  return (
                    <tr key={record.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: "bold" }}>{record.displayName || user?.displayName || "Staf Radio SBL"}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{record.airName || user?.airName || "-"}</div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 700 }}>
                        {user?.role || "-"}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontSize: "0.9rem" }}>{checkInAt.toLocaleDateString("id-ID")}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <StatusBadge status={record.status} />
                      </td>
                      <td style={{ padding: "16px" }}>
                        <a
                          href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--blue)", fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: 700 }}
                        >
                          <MapPin size={14} /> Lihat Maps
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const filterControlStyle = {
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(15,23,42,0.12)",
  outline: "none",
  background: "#fff",
  color: "var(--ink)",
  fontWeight: 700,
  minHeight: "44px"
};

const tableHeadStyle = {
  padding: "16px",
  color: "var(--muted)",
  fontWeight: 700,
  fontSize: "0.85rem"
};

const summaryCellStyle = {
  padding: "16px",
  color: "var(--ink)",
  fontWeight: 900,
  fontSize: "0.95rem"
};

function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
      <div style={{ color, marginBottom: "12px" }}>{icon}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "4px" }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    present: { label: "Hadir (Radius)", bg: "#ecfdf5", text: "#059669" },
    outside_radius: { label: "Luar Radius", bg: "#fffbeb", text: "#d97706" },
    late: { label: "Terlambat", bg: "#fef2f2", text: "#dc2626" }
  };
  const { label, bg, text } = config[status] || { label: status, bg: "#f3f4f6", text: "#374151" };

  return (
    <span style={{ padding: "4px 12px", borderRadius: "99px", background: bg, color: text, fontSize: "0.75rem", fontWeight: "bold" }}>
      {label}
    </span>
  );
}
