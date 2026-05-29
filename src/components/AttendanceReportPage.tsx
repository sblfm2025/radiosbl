import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  MapPin,
  MonitorSmartphone,
  Navigation,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Users,
  X,
  XCircle
} from "lucide-react";
import {
  createManualAttendanceRecord,
  listAttendanceRecords,
  updateAttendanceRecord,
  updateAttendanceStatus
} from "../services/attendance.service";
import { listUserProfiles } from "../services/userProfile.service";
import type { AuthSession } from "../services/auth.service";
import type { AppUser, AttendanceRecord, FaceMatchStatus, TimestampLike, UserRole } from "../types/domain";

type PeriodMode = "week" | "month" | "year";
type ReportTab = "summary" | "daily" | "announcers" | "leaves";
type NoticeState = { type: "success" | "danger"; text: string } | null;
type FaceMatchFilter = "all" | FaceMatchStatus | "face_attention";
type ManualAttendanceForm = {
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  status: AttendanceRecord["status"];
  note: string;
};

const manualStatusOptions: Array<{ value: AttendanceRecord["status"]; label: string }> = [
  { value: "valid", label: "Diterima / Valid" },
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "outside_radius", label: "Luar Radius" },
  { value: "sick", label: "Sakit" },
  { value: "leave", label: "Izin" },
  { value: "needs_review", label: "Butuh Review" },
  { value: "rejected", label: "Ditolak" }
];

const STATUS_CONFIG: Record<string, { label: string; tone: string }> = {
  present: { label: "Hadir (Radius)", tone: "green" },
  outside_radius: { label: "Luar Radius", tone: "amber" },
  late: { label: "Terlambat", tone: "red" },
  valid: { label: "Valid", tone: "green" },
  needs_review: { label: "Butuh Review", tone: "amber" },
  rejected: { label: "Ditolak", tone: "red" },
  sick: { label: "Sakit", tone: "blue" },
  leave: { label: "Izin", tone: "purple" },
  out_of_office: { label: "Tugas Luar", tone: "amber" }
};

const FACE_MATCH_CONFIG: Record<string, { label: string; tone: string }> = {
  matched_candidate: { label: "Cocok", tone: "green" },
  review_candidate: { label: "Perlu Review", tone: "amber" },
  mismatch_candidate: { label: "Tidak Cocok", tone: "red" },
  not_enrolled: { label: "Belum Enroll", tone: "muted" },
  disabled: { label: "Nonaktif", tone: "muted" },
  unavailable: { label: "Tidak Tersedia", tone: "muted" }
};

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

function getDurationLabel(checkIn: Date, checkOut?: Date | null): string {
  if (!checkOut) return "-";
  const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
  if (diffMinutes < 0) return "0m";
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
}

function isPreviewableSelfieReference(value: string): boolean {
  return /^(https?:|data:image\/|blob:)/i.test(value);
}

function isDemoSelfieReference(value: string): boolean {
  return value.startsWith("demo-attendance-");
}

function isPendingSelfieReference(value: string): boolean {
  return value === "pending_upload" || value.startsWith("offline-attendance-");
}

function getSelfieViewUrl(value: string): string {
  if (isPreviewableSelfieReference(value)) {
    return value;
  }

  return `https://drive.google.com/file/d/${encodeURIComponent(value)}/view`;
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

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toDateTimeLocalInput(value: TimestampLike | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  return `${toDateInputValue(date)}T${toTimeInputValue(date)}`;
}

function fromDateAndTimeInput(dateValue: string, timeValue: string): string {
  return new Date(`${dateValue}T${timeValue || "00:00"}:00`).toISOString();
}

function fromDateTimeLocalInput(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
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

function faceMatchFilterMatchesRecord(record: AttendanceRecord, selectedFaceMatch: FaceMatchFilter): boolean {
  if (selectedFaceMatch === "all") {
    return true;
  }
  if (selectedFaceMatch === "face_attention") {
    return (
      record.faceMatchStatus === "review_candidate" ||
      record.faceMatchStatus === "mismatch_candidate" ||
      record.faceSpoofCheckStatus === "needs_review"
    );
  }
  return record.faceMatchStatus === selectedFaceMatch;
}

function isLeaveRecord(record: AttendanceRecord): boolean {
  return record.status === "sick" || record.status === "leave" || Boolean(record.outOfOfficeReason);
}

function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status]?.label || status;
}

function getFaceMatchLabel(status?: string): string {
  return status ? FACE_MATCH_CONFIG[status]?.label || status : "Belum dicek";
}

function getFaceMatchTone(status?: string): string {
  return status ? FACE_MATCH_CONFIG[status]?.tone || "muted" : "muted";
}

function getSpoofCheckLabel(status?: string): string {
  if (status === "passed") {
    return "Gerakan Valid";
  }
  if (status === "needs_review") {
    return "Perlu Review";
  }
  if (status === "unavailable") {
    return "Tidak Tersedia";
  }
  return "Belum dicek";
}

function getFaceFilterLabel(value: FaceMatchFilter): string {
  if (value === "face_attention") {
    return "Butuh Atensi";
  }
  if (value === "all") {
    return "Semua Face Match";
  }
  return getFaceMatchLabel(value);
}

function recordMatchesSearch(record: AttendanceRecord, searchQuery: string, userById: Map<string, AppUser>): boolean {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return true;

  const user = userById.get(record.userId);
  const checkInAt = toDate(record.checkInAt);
  const haystack = [
    record.displayName,
    record.airName,
    record.status,
    getStatusLabel(record.status),
    record.outOfOfficeReason,
    record.aiVerificationText,
    user?.displayName,
    user?.airName,
    user?.email,
    user?.role,
    checkInAt.toLocaleDateString("id-ID", { dateStyle: "medium" }),
    checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function userMatchesSearch(user: AppUser, searchQuery: string, latest?: AttendanceRecord): boolean {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return true;

  return [
    user.displayName,
    user.airName,
    user.email,
    user.role,
    latest?.status,
    latest ? getStatusLabel(latest.status) : ""
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function AttendanceReportPage({ session }: { session: AuthSession | null }) {
  const today = useMemo(() => new Date(), []);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterFaceMatch, setFilterFaceMatch] = useState<FaceMatchFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [weekValue, setWeekValue] = useState(toWeekInputValue(today));
  const [monthValue, setMonthValue] = useState(toMonthInputValue(today));
  const [yearValue, setYearValue] = useState(today.getFullYear());
  const [activeTab, setActiveTab] = useState<ReportTab>("summary");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState<ManualAttendanceForm>({
    userId: "",
    date: toDateInputValue(today),
    checkInTime: toTimeInputValue(today),
    checkOutTime: "",
    status: "valid",
    note: ""
  });
  const [savingManual, setSavingManual] = useState(false);
  const canManageAttendance = Boolean(session && ["super_admin", "admin"].includes(session.user.role));

  async function handleReviewStatus(recordId: string, newStatus: AttendanceRecord["status"]) {
    try {
      await updateAttendanceStatus(recordId, newStatus);
      setRecords((prev) => prev.map((record) => (record.id === recordId ? { ...record, status: newStatus } : record)));
      setSelectedRecord((prev) => (prev?.id === recordId ? { ...prev, status: newStatus } : prev));
      setNotice({
        type: "success",
        text: newStatus === "valid" ? "Status absensi diterima." : "Status absensi ditolak."
      });
    } catch (err) {
      setNotice({ type: "danger", text: "Gagal memperbarui status. Coba ulangi beberapa saat lagi." });
      console.error(err);
    }
  }

  async function handleRecordUpdate(recordId: string, patch: Partial<AttendanceRecord>) {
    try {
      await updateAttendanceRecord(recordId, patch);
      setRecords((prev) => prev.map((record) => (record.id === recordId ? { ...record, ...patch } : record)));
      setSelectedRecord((prev) => (prev?.id === recordId ? { ...prev, ...patch } : prev));
      setNotice({ type: "success", text: "Koreksi absensi berhasil disimpan." });
    } catch (err) {
      setNotice({ type: "danger", text: "Gagal menyimpan koreksi absensi." });
      console.error(err);
    }
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = users.find((item) => item.id === manualForm.userId);

    if (!user) {
      setNotice({ type: "danger", text: "Pilih staf terlebih dahulu." });
      return;
    }

    try {
      setSavingManual(true);
      const checkInAt = fromDateAndTimeInput(manualForm.date, manualForm.checkInTime);
      const checkOutAt = manualForm.checkOutTime
        ? fromDateAndTimeInput(manualForm.date, manualForm.checkOutTime)
        : undefined;
      const notePrefix = `Input manual oleh ${session?.user.displayName || "Admin"}`;
      const note = manualForm.note.trim() ? `${notePrefix}: ${manualForm.note.trim()}` : notePrefix;
      const id = await createManualAttendanceRecord({
        userId: user.id,
        displayName: user.displayName,
        airName: user.airName,
        checkInAt,
        checkOutAt,
        status: manualForm.status,
        outOfOfficeReason: note,
        recordedBy: session?.user.id,
        recordedByName: session?.user.displayName
      });
      const nextRecord: AttendanceRecord = {
        id,
        userId: user.id,
        displayName: user.displayName,
        airName: user.airName,
        checkInAt,
        checkOutAt,
        clientTime: new Date().toISOString(),
        latitude: -3.8112091495447213,
        longitude: 119.65144231962896,
        accuracyMeters: 0,
        distanceToCenter: 0,
        userAgent: `Manual attendance entry by ${session?.user.displayName || "Admin"}`,
        confidenceScore: 100,
        aiVerificationText: "Input manual oleh admin.",
        outOfOfficeReason: note,
        selfieDriveFileId: "manual_entry",
        selfieUploadStatus: "uploaded",
        selfieUploadError: "",
        status: manualForm.status
      };

      setRecords((prev) => [nextRecord, ...prev]);
      setShowManualForm(false);
      setManualForm((current) => ({ ...current, userId: "", checkOutTime: "", note: "" }));
      setNotice({ type: "success", text: "Absensi manual berhasil ditambahkan." });
    } catch (err) {
      setNotice({ type: "danger", text: "Gagal menambahkan absensi manual." });
      console.error(err);
    } finally {
      setSavingManual(false);
    }
  }

  function handleExportCsv() {
    const headers = [
      "ID",
      "Nama Staf",
      "Nama Udara",
      "Role",
      "Tanggal",
      "Jam Masuk",
      "Jam Pulang",
      "Durasi",
      "Status",
      "Face Match",
      "Face Distance",
      "Face Mode",
      "Enrollment",
      "Reference Count",
      "Cek Kamera",
      "Movement Score",
      "Catatan Tambahan"
    ];
    const rows = filteredRecords.map((record) => {
      const user = userById.get(record.userId);
      const checkIn = toDate(record.checkInAt);
      const checkOut = record.checkOutAt ? toDate(record.checkOutAt) : null;
      const durLabel = checkOut ? getDurationLabel(checkIn, checkOut) : "";

      const escapedNote = record.outOfOfficeReason ? `"${record.outOfOfficeReason.replace(/"/g, '""')}"` : "";
      const escapedAirName = (record.airName || user?.airName || "").replace(/"/g, '""');

      return [
        record.userId,
        record.displayName || user?.displayName || "",
        `"${escapedAirName}"`,
        user?.role || "",
        checkIn.toLocaleDateString("id-ID"),
        checkIn.toLocaleTimeString("id-ID"),
        checkOut ? checkOut.toLocaleTimeString("id-ID") : "",
        durLabel,
        record.status,
        getFaceMatchLabel(record.faceMatchStatus),
        typeof record.faceMatchDistance === "number" ? record.faceMatchDistance.toFixed(4) : "",
        record.faceRecognitionMode || "",
        record.faceEnrollmentStatus || "",
        record.faceReferenceCount ?? "",
        getSpoofCheckLabel(record.faceSpoofCheckStatus),
        typeof record.faceMovementScore === "number" ? record.faceMovementScore.toFixed(4) : "",
        escapedNote
      ].join(",");
    });

    const csvContent = `data:text/csv;charset=utf-8,${[headers.join(","), ...rows].join("\n")}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_SBL_${periodLabel.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
        setNotice({ type: "danger", text: "Gagal memuat rekap absensi. Periksa koneksi lalu muat ulang halaman." });
        console.error("Gagal memuat rekap:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
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
        .filter((record) => faceMatchFilterMatchesRecord(record, filterFaceMatch))
        .filter((record) => recordMatchesSearch(record, searchQuery, userById))
        .sort((a, b) => toDate(b.checkInAt).getTime() - toDate(a.checkInAt).getTime()),
    [filterFaceMatch, filterRole, periodRange.end, periodRange.start, records, searchQuery, userById]
  );

  const periodRecords = useMemo(
    () =>
      records.filter((record) => {
        const date = toDate(record.checkInAt);
        return date >= periodRange.start && date < periodRange.end;
      }),
    [periodRange.end, periodRange.start, records]
  );

  const staffSummary = useMemo(() => {
    const staffUsers = users
      .filter((user) => user.role !== "public" && (filterRole === "all" || user.role === filterRole))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return staffUsers.map((user) => {
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
    }).filter((item) => userMatchesSearch(item.user, searchQuery, item.latest));
  }, [filterRole, periodRecords, searchQuery, users]);

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter((record) => record.status === "present").length,
    outside: filteredRecords.filter((record) => record.status === "outside_radius").length,
    late: filteredRecords.filter((record) => record.status === "late").length,
    faceMatched: filteredRecords.filter((record) => record.faceMatchStatus === "matched_candidate").length,
    faceReview: filteredRecords.filter((record) => record.faceMatchStatus === "review_candidate").length,
    faceMismatch: filteredRecords.filter((record) => record.faceMatchStatus === "mismatch_candidate").length,
    spoofReview: filteredRecords.filter((record) => record.faceSpoofCheckStatus === "needs_review").length
  };

  const periodLabel = formatPeriodLabel(periodRange.start, periodRange.end, periodMode);
  const leaveRecords = useMemo(() => filteredRecords.filter(isLeaveRecord), [filteredRecords]);
  const attentionRecords = useMemo(
    () =>
      filteredRecords.filter((record) =>
        record.status === "needs_review"
        || record.status === "outside_radius"
        || record.status === "late"
        || record.status === "rejected"
        || record.faceMatchStatus === "review_candidate"
        || record.faceMatchStatus === "mismatch_candidate"
        || record.faceSpoofCheckStatus === "needs_review"
        || isLeaveRecord(record)
      ),
    [filteredRecords]
  );
  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const topAttentionRecord = attentionRecords[0] || null;

  function handleResetFilters() {
    setSearchQuery("");
    setFilterRole("all");
    setFilterFaceMatch("all");
  }

  return (
    <div className="attendance-report">
      <div className="attendance-report-content">
        <header className="attendance-report-hero">
          <div>
            <p>Rekap Absensi</p>
            <h1>Rekap Kehadiran Staf</h1>
            <span>Pantau kedisiplinan, lokasi absensi, dan validasi kehadiran kru Radio SBL.</span>
          </div>
          <div className="attendance-report-period">
            <Calendar size={18} />
            <span>{periodLabel}</span>
          </div>
        </header>

        {notice && (
          <div className={`attendance-report-notice ${notice.type}`}>
            {notice.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Tutup pesan">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="attendance-report-tabs">
          <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>Ringkasan</TabButton>
          <TabButton active={activeTab === "daily"} onClick={() => setActiveTab("daily")}>Harian</TabButton>
          <TabButton active={activeTab === "announcers"} onClick={() => setActiveTab("announcers")}>Penyiar / Staf</TabButton>
          <TabButton active={activeTab === "leaves"} onClick={() => setActiveTab("leaves")}>Izin & Cuti</TabButton>
        </div>

        <section className="attendance-report-filter">
          <div className="attendance-report-section-title">
            <Filter size={18} />
            <h2>Filter Rekap</h2>
          </div>
          <div className="attendance-report-filter-grid">
            <label className="attendance-report-search">
              Cari Rekap
              <span>
                <Search size={17} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Nama, role, status, alasan..."
                />
              </span>
            </label>

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

            <label>
              Role
              <select value={filterRole} onChange={(event) => setFilterRole(event.target.value as UserRole | "all")}>
                <option value="all">Semua Role</option>
                <option value="announcer">Penyiar</option>
                <option value="reporter">Reporter</option>
                <option value="operator">Operator</option>
                <option value="employee">Staf / Pegawai</option>
              </select>
            </label>

            <label>
              Face Match
              <select value={filterFaceMatch} onChange={(event) => setFilterFaceMatch(event.target.value as FaceMatchFilter)}>
                <option value="all">Semua Face Match</option>
                <option value="face_attention">Butuh Atensi</option>
                <option value="matched_candidate">Cocok</option>
                <option value="review_candidate">Perlu Review</option>
                <option value="mismatch_candidate">Tidak Cocok</option>
                <option value="not_enrolled">Belum Enroll</option>
                <option value="unavailable">Tidak Tersedia</option>
              </select>
            </label>

            <div className="attendance-report-period-chip">
              <Calendar size={17} />
              <span>{periodLabel}</span>
            </div>
          </div>
        </section>

        {activeTab === "summary" && (
          <>
            <div className="attendance-report-stats">
              <StatCard tone="blue" icon={<Users size={20} />} label="Total Absen" value={stats.total} />
              <StatCard tone="green" icon={<CheckCircle2 size={20} />} label="Tepat Lokasi" value={stats.present} />
              <StatCard tone="amber" icon={<MapPin size={20} />} label="Luar Radius" value={stats.outside} />
              <StatCard tone="red" icon={<AlertTriangle size={20} />} label="Terlambat" value={stats.late} />
            </div>
            <div className="attendance-report-stats face">
              <StatCard tone="green" icon={<CheckCircle2 size={20} />} label="Face Cocok" value={stats.faceMatched} />
              <StatCard tone="amber" icon={<ShieldAlert size={20} />} label="Face Review" value={stats.faceReview} />
              <StatCard tone="red" icon={<XCircle size={20} />} label="Face Tidak Cocok" value={stats.faceMismatch} />
              <StatCard tone="amber" icon={<Camera size={20} />} label="Gerakan Review" value={stats.spoofReview} />
            </div>

            <section className="attendance-report-focus">
              <div className="attendance-report-focus-card">
                <div>
                  <span>Rasio tepat lokasi</span>
                  <strong>{attendanceRate}%</strong>
                  <p>{stats.present} dari {stats.total} rekam absensi aktif.</p>
                </div>
                <div className="report-progress">
                  <progress value={attendanceRate} max={100} aria-label="Rasio tepat lokasi rekap aktif" />
                </div>
              </div>
              <div className="attendance-report-focus-card warning">
                <div>
                  <span>Perlu atensi</span>
                  <strong>{attentionRecords.length}</strong>
                  <p>{topAttentionRecord ? `${topAttentionRecord.displayName || userById.get(topAttentionRecord.userId)?.displayName || "Staf"} - ${getStatusLabel(topAttentionRecord.status)}` : "Belum ada catatan prioritas."}</p>
                </div>
                {topAttentionRecord && (
                  <button type="button" onClick={() => setSelectedRecord(topAttentionRecord)}>
                    Buka detail
                  </button>
                )}
              </div>
              <div className="attendance-report-focus-card">
                <div>
                  <span>Filter aktif</span>
                  <strong>{filteredRecords.length}</strong>
                  <p>{searchQuery.trim() ? `Hasil untuk "${searchQuery.trim()}".` : filterFaceMatch !== "all" ? `Face filter ${getFaceFilterLabel(filterFaceMatch)}.` : filterRole === "all" ? "Semua role ditampilkan." : `Role ${filterRole} ditampilkan.`}</p>
                </div>
                {(searchQuery.trim() || filterRole !== "all" || filterFaceMatch !== "all") && (
                  <button type="button" onClick={handleResetFilters}>
                    <RotateCcw size={15} /> Reset
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === "announcers" && (
          <section className="attendance-report-panel">
            <PanelHeader
              title="Rekap Absensi Staf"
              description={`Ringkasan kehadiran staf untuk ${periodLabel}.`}
              aside={`${staffSummary.length} staf`}
            />

            {loading ? (
              <LoadingState />
            ) : staffSummary.length === 0 ? (
              <EmptyState icon={<Users size={40} />} text="Belum ada data staf pada filter ini." onReset={handleResetFilters} />
            ) : (
              <>
                <div className="attendance-report-table-wrap">
                  <table className="attendance-report-table">
                    <thead>
                      <tr>
                        <th>NAMA STAF</th>
                        <th>TOTAL</th>
                        <th>TEPAT LOKASI</th>
                        <th>LUAR RADIUS</th>
                        <th>TERLAMBAT</th>
                        <th>RASIO</th>
                        <th>TERAKHIR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffSummary.map((item) => (
                        <tr key={item.user.id}>
                          <td>
                            <strong>{item.user.displayName}</strong>
                            <span>{item.user.airName || item.user.email}</span>
                          </td>
                          <td className="numeric">{item.total}</td>
                          <td className="numeric green">{item.present}</td>
                          <td className="numeric amber">{item.outside}</td>
                          <td className="numeric red">{item.late}</td>
                          <td className="ratio-cell">
                            <div className="report-progress">
                              <progress value={item.rate} max={100} aria-label={`Rasio kehadiran ${item.user.displayName}`} />
                            </div>
                            <strong>{item.rate}%</strong>
                          </td>
                          <td className="muted">
                            {item.latest
                              ? toDate(item.latest.checkInAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="attendance-report-mobile-list">
                  {staffSummary.map((item) => (
                    <article key={item.user.id} className="attendance-report-card">
                      <div>
                        <strong>{item.user.displayName}</strong>
                        <span>{item.user.airName || item.user.email}</span>
                      </div>
                      <div className="attendance-report-card-grid">
                        <Metric label="Total" value={item.total} />
                        <Metric label="Tepat" value={item.present} tone="green" />
                        <Metric label="Luar" value={item.outside} tone="amber" />
                        <Metric label="Terlambat" value={item.late} tone="red" />
                      </div>
                      <div className="attendance-report-card-foot">
                        <div className="report-progress">
                          <progress value={item.rate} max={100} aria-label={`Rasio kehadiran ${item.user.displayName}`} />
                        </div>
                        <strong>{item.rate}%</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "daily" && (
          <section className="attendance-report-panel">
            <PanelHeader
              title="Daftar Kehadiran"
              description="Klik baris untuk melihat foto selfie dan detail absensi."
              action={(
                <div className="attendance-report-head-actions">
                  {canManageAttendance && (
                    <button type="button" className="attendance-report-manual-button" onClick={() => setShowManualForm(true)}>
                      <Plus size={18} /> Input Manual
                    </button>
                  )}
                  <ExportButton onClick={handleExportCsv} />
                </div>
              )}
            />

            {loading ? (
              <LoadingState />
            ) : filteredRecords.length === 0 ? (
              <EmptyState icon={<Calendar size={44} />} text="Belum ada data absensi pada filter ini." onReset={handleResetFilters} />
            ) : (
              <>
                <div className="attendance-report-table-wrap">
                  <table className="attendance-report-table clickable">
                    <thead>
                      <tr>
                        <th>STAF</th>
                        <th>ROLE</th>
                        <th>WAKTU</th>
                        <th>STATUS</th>
                        <th>FACE MATCH</th>
                        <th>CEK KAMERA</th>
                        <th>LOKASI</th>
                        <th>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.slice(0, 100).map((record) => {
                        const user = userById.get(record.userId);
                        const checkInAt = toDate(record.checkInAt);

                        return (
                          <tr key={record.id} onClick={() => setSelectedRecord(record)}>
                            <td>
                              <strong>{record.displayName || user?.displayName || "Staf Radio SBL"}</strong>
                              <span>{record.airName || user?.airName || "-"}</span>
                            </td>
                            <td className="muted">{user?.role || "-"}</td>
                            <td>
                              <div className="report-time-range">
                                <span className="in">{checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                                <span>-</span>
                                <span className={record.checkOutAt ? "out" : "muted"}>
                                  {record.checkOutAt ? toDate(record.checkOutAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                                </span>
                              </div>
                              <span>{checkInAt.toLocaleDateString("id-ID")} - Durasi: {record.checkOutAt ? getDurationLabel(checkInAt, toDate(record.checkOutAt)) : "-"}</span>
                            </td>
                            <td><StatusBadge status={record.status} /></td>
                            <td>
                              <span className={`attendance-report-status ${getFaceMatchTone(record.faceMatchStatus)}`}>
                                {getFaceMatchLabel(record.faceMatchStatus)}
                              </span>
                            </td>
                            <td>
                              <span className={`attendance-report-status ${record.faceSpoofCheckStatus === "passed" ? "green" : record.faceSpoofCheckStatus === "needs_review" ? "amber" : "muted"}`}>
                                {getSpoofCheckLabel(record.faceSpoofCheckStatus)}
                              </span>
                            </td>
                            <td className="muted">
                              <MapPin size={14} /> {record.accuracyMeters ? `+/-${record.accuracyMeters}m` : "-"}
                            </td>
                            <td><button type="button" className="attendance-report-detail-button">Detail</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="attendance-report-mobile-list">
                  {filteredRecords.slice(0, 100).map((record) => {
                    const user = userById.get(record.userId);
                    const checkInAt = toDate(record.checkInAt);

                    return (
                      <button key={record.id} type="button" className="attendance-report-card clickable" onClick={() => setSelectedRecord(record)}>
                        <div>
                          <strong>{record.displayName || user?.displayName || "Staf Radio SBL"}</strong>
                          <span>{record.airName || user?.airName || user?.role || "-"}</span>
                        </div>
                        <div className="attendance-report-card-row">
                          <Clock size={15} />
                          <span>{checkInAt.toLocaleDateString("id-ID")} - {checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="attendance-report-card-row">
                          <MapPin size={15} />
                          <span>{record.accuracyMeters ? `+/-${record.accuracyMeters}m` : "Lokasi tidak tersedia"}</span>
                        </div>
                        <StatusBadge status={record.status} />
                        <span className={`attendance-report-status ${getFaceMatchTone(record.faceMatchStatus)}`}>
                          Face: {getFaceMatchLabel(record.faceMatchStatus)}
                        </span>
                        <span className={`attendance-report-status ${record.faceSpoofCheckStatus === "passed" ? "green" : record.faceSpoofCheckStatus === "needs_review" ? "amber" : "muted"}`}>
                          Kamera: {getSpoofCheckLabel(record.faceSpoofCheckStatus)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "leaves" && (
          <section className="attendance-report-panel">
            <PanelHeader
              title="Daftar Izin, Sakit & Tugas Luar"
              description="Klik baris untuk melihat detail dan melakukan persetujuan."
              action={<ExportButton onClick={handleExportCsv} />}
            />

            {loading ? (
              <LoadingState />
            ) : leaveRecords.length === 0 ? (
              <EmptyState icon={<Calendar size={44} />} text="Tidak ada data izin atau cuti pada filter ini." onReset={handleResetFilters} />
            ) : (
              <>
                <div className="attendance-report-table-wrap">
                  <table className="attendance-report-table clickable">
                    <thead>
                      <tr>
                        <th>STAF</th>
                        <th>WAKTU PENGAJUAN</th>
                        <th>JENIS</th>
                        <th>ALASAN / CATATAN</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRecords.map((record) => {
                        const user = userById.get(record.userId);
                        const checkInAt = toDate(record.checkInAt);

                        return (
                          <tr key={record.id} onClick={() => setSelectedRecord(record)}>
                            <td>
                              <strong>{record.displayName || user?.displayName || "Staf Radio SBL"}</strong>
                              <span>{user?.role || "-"}</span>
                            </td>
                            <td>
                              <strong>{checkInAt.toLocaleDateString("id-ID")}</strong>
                              <span>{checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                            </td>
                            <td><StatusBadge status={record.status === "needs_review" ? "out_of_office" : record.status} /></td>
                            <td className="report-note">"{record.outOfOfficeReason || "-"}"</td>
                            <td><StatusBadge status={record.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="attendance-report-mobile-list">
                  {leaveRecords.map((record) => {
                    const user = userById.get(record.userId);
                    const checkInAt = toDate(record.checkInAt);

                    return (
                      <button key={record.id} type="button" className="attendance-report-card clickable" onClick={() => setSelectedRecord(record)}>
                        <div>
                          <strong>{record.displayName || user?.displayName || "Staf Radio SBL"}</strong>
                          <span>{user?.role || "-"}</span>
                        </div>
                        <div className="attendance-report-card-row">
                          <Calendar size={15} />
                          <span>{checkInAt.toLocaleDateString("id-ID")} - {checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p>"{record.outOfOfficeReason || "-"}"</p>
                        <StatusBadge status={record.status} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {selectedRecord && (
        <>
          <aside className="attendance-report-drawer">
            <div className="attendance-report-drawer-head">
              <h3>Detail Absensi</h3>
              <button type="button" onClick={() => setSelectedRecord(null)} aria-label="Tutup detail absensi">
                <X size={20} />
              </button>
            </div>
            <div className="attendance-report-drawer-body">
              <SidePanelDetail
                record={selectedRecord}
                user={userById.get(selectedRecord.userId)}
                session={session}
                onReview={handleReviewStatus}
                onUpdate={handleRecordUpdate}
              />
            </div>
          </aside>
          <button
            type="button"
            className="attendance-report-backdrop"
            onClick={() => setSelectedRecord(null)}
            aria-label="Tutup detail absensi"
          />
        </>
      )}

      {showManualForm && (
        <div className="attendance-report-modal-layer">
          <button
            type="button"
            className="attendance-report-backdrop"
            onClick={() => setShowManualForm(false)}
            aria-label="Tutup input manual"
          />
          <form className="attendance-report-manual-modal" onSubmit={handleManualSubmit}>
            <div className="attendance-report-drawer-head">
              <h3>Input Absensi Manual</h3>
              <button type="button" onClick={() => setShowManualForm(false)} aria-label="Tutup input manual">
                <X size={20} />
              </button>
            </div>

            <label>
              Staf
              <select
                value={manualForm.userId}
                onChange={(event) => setManualForm((current) => ({ ...current, userId: event.target.value }))}
                required
              >
                <option value="">Pilih staf</option>
                {users.filter((user) => user.role !== "public").map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} {user.airName ? `- ${user.airName}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="attendance-report-manual-grid">
              <label>
                Tanggal
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(event) => setManualForm((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </label>
              <label>
                Jam Masuk
                <input
                  type="time"
                  value={manualForm.checkInTime}
                  onChange={(event) => setManualForm((current) => ({ ...current, checkInTime: event.target.value }))}
                  required
                />
              </label>
              <label>
                Jam Pulang
                <input
                  type="time"
                  value={manualForm.checkOutTime}
                  onChange={(event) => setManualForm((current) => ({ ...current, checkOutTime: event.target.value }))}
                />
              </label>
              <label>
                Status
                <select
                  value={manualForm.status}
                  onChange={(event) => setManualForm((current) => ({ ...current, status: event.target.value as AttendanceRecord["status"] }))}
                >
                  {manualStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Catatan Admin
              <textarea
                value={manualForm.note}
                onChange={(event) => setManualForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Contoh: Absensi ditambahkan karena kamera/GPS bermasalah."
              />
            </label>

            <button type="submit" className="attendance-report-manual-submit" disabled={savingManual}>
              <Save size={18} /> {savingManual ? "Menyimpan..." : "Simpan Absensi"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={active ? "active" : ""}>
      {children}
    </button>
  );
}

function PanelHeader({ title, description, aside, action }: { title: string; description: string; aside?: string; action?: ReactNode }) {
  return (
    <div className="attendance-report-panel-head">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {aside && <span>{aside}</span>}
      {action}
    </div>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="attendance-report-export" onClick={onClick}>
      <Download size={18} /> Export CSV
    </button>
  );
}

function LoadingState() {
  return (
    <div className="attendance-report-loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="ui-skeleton-row" key={index}>
          <span className="ui-skeleton avatar" />
          <span className="ui-skeleton-copy">
            <span className="ui-skeleton line medium" />
            <span className="ui-skeleton line short" />
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, text, onReset }: { icon: ReactNode; text: string; onReset?: () => void }) {
  return (
    <div className="attendance-report-empty">
      {icon}
      <p>{text}</p>
      {onReset && (
        <button type="button" onClick={onReset}>
          <RotateCcw size={15} /> Reset filter
        </button>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <span className={tone || ""}>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function SidePanelDetail({
  record,
  user,
  session,
  onReview,
  onUpdate
}: {
  record: AttendanceRecord;
  user?: AppUser;
  session: AuthSession | null;
  onReview: (id: string, status: AttendanceRecord["status"]) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<AttendanceRecord>) => Promise<void> | void;
}) {
  const checkInAt = toDate(record.checkInAt);
  const mapUrl = `https://www.google.com/maps?q=${record.latitude},${record.longitude}`;
  const isAdmin = session && ["super_admin", "admin"].includes(session.user.role);
  const selfieUrl = record.selfieDriveFileId ? getSelfieViewUrl(record.selfieDriveFileId) : "";
  const canPreviewSelfie = record.selfieDriveFileId ? isPreviewableSelfieReference(record.selfieDriveFileId) : false;
  const isDemoSelfie = record.selfieDriveFileId ? isDemoSelfieReference(record.selfieDriveFileId) : false;
  const isPendingSelfie = record.selfieDriveFileId ? isPendingSelfieReference(record.selfieDriveFileId) : false;
  const selfieNotice = isPendingSelfie
    ? "Bukti selfie masih menunggu sinkronisasi."
    : isDemoSelfie
      ? "Bukti selfie belum tersimpan ke arsip file asli."
      : record.selfieUploadStatus === "failed"
        ? "Upload bukti selfie gagal dan perlu ditinjau."
        : "";
  const [editStatus, setEditStatus] = useState<AttendanceRecord["status"]>(record.status);
  const [editCheckInAt, setEditCheckInAt] = useState(toDateTimeLocalInput(record.checkInAt));
  const [editCheckOutAt, setEditCheckOutAt] = useState(toDateTimeLocalInput(record.checkOutAt));
  const [editNote, setEditNote] = useState(record.outOfOfficeReason || "");

  useEffect(() => {
    setEditStatus(record.status);
    setEditCheckInAt(toDateTimeLocalInput(record.checkInAt));
    setEditCheckOutAt(toDateTimeLocalInput(record.checkOutAt));
    setEditNote(record.outOfOfficeReason || "");
  }, [record]);

  function handleCorrectionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const patch: Partial<AttendanceRecord> = {
      status: editStatus,
      checkInAt: fromDateTimeLocalInput(editCheckInAt) || record.checkInAt,
      outOfOfficeReason: editNote
    };
    const nextCheckOutAt = fromDateTimeLocalInput(editCheckOutAt);
    if (nextCheckOutAt) {
      patch.checkOutAt = nextCheckOutAt;
    }
    void onUpdate(record.id, patch);
  }

  return (
    <div className="attendance-report-detail">
      <div className="attendance-report-person">
        <div><Users size={28} /></div>
        <div>
          <h4>{record.displayName || user?.displayName || "Staf SBL"}</h4>
          <span>{user?.role || "-"} - {record.airName || user?.airName || "-"}</span>
        </div>
      </div>

      <div className="attendance-report-badges">
        <StatusBadge status={record.status} />
        <span className={`attendance-report-status ${getFaceMatchTone(record.faceMatchStatus)}`}>
          Face: {getFaceMatchLabel(record.faceMatchStatus)}
        </span>
        {record.outOfOfficeReason && <span>Tugas: {record.outOfOfficeReason}</span>}
      </div>

      <DetailSection icon={<Camera size={16} />} title="Verifikasi Selfie">
        {record.selfieDriveFileId ? (
          canPreviewSelfie ? (
            <div className="attendance-report-selfie">
              <img src={record.selfieDriveFileId} alt="Selfie" />
            </div>
          ) : (
            <div className={`attendance-report-selfie-empty ${selfieNotice ? "warning" : ""}`}>
              {selfieNotice ? <AlertTriangle size={32} /> : <Camera size={32} />}
              <p>{selfieNotice || record.selfieDriveFileId}</p>
              <small>{record.selfieDriveFileId}</small>
              {!selfieNotice && (
                <a href={selfieUrl} target="_blank" rel="noreferrer">Buka bukti selfie</a>
              )}
            </div>
          )
        ) : (
          <div className="attendance-report-selfie-empty">
            <Camera size={32} />
            <p>Tidak ada foto selfie</p>
          </div>
        )}
        <div className="attendance-report-ai-row">
          <span>Skor AI Wajah:</span>
          <strong className={record.confidenceScore && record.confidenceScore >= 80 ? "good" : "bad"}>{record.confidenceScore || 0}%</strong>
        </div>
        <p className="attendance-report-ai-note">{record.aiVerificationText || "-"}</p>
      </DetailSection>

      <DetailSection icon={<ShieldAlert size={16} />} title="Face Recognition">
        <div className="attendance-report-detail-grid">
          <div>
            <small>Face Match</small>
            <strong>{getFaceMatchLabel(record.faceMatchStatus)}</strong>
            <small>Mode: {record.faceRecognitionMode || "-"}</small>
          </div>
          <div>
            <small>Distance</small>
            <strong>{typeof record.faceMatchDistance === "number" ? record.faceMatchDistance.toFixed(4) : "-"}</strong>
            <small>Referensi: {record.faceReferenceCount ?? 0} foto</small>
          </div>
        </div>
        <p className="attendance-report-ai-note">
          Model {record.faceModelVersion || record.faceRecognitionVersion || "-"} - Enrollment {record.faceEnrollmentStatus || "not_enrolled"}
          {record.faceRecognitionError ? ` - ${record.faceRecognitionError}` : ""}
        </p>
        <div className="attendance-report-ai-row">
          <span>Cek Kamera Langsung:</span>
          <strong className={record.faceSpoofCheckStatus === "passed" ? "good" : "bad"}>
            {getSpoofCheckLabel(record.faceSpoofCheckStatus)}
          </strong>
        </div>
        <p className="attendance-report-ai-note">
          Movement score {typeof record.faceMovementScore === "number" ? record.faceMovementScore.toFixed(4) : "-"}
          {record.faceSpoofCheckError ? ` - ${record.faceSpoofCheckError}` : ""}
        </p>
      </DetailSection>

      <DetailSection icon={<MapPin size={16} />} title="Data Waktu & Lokasi">
        <div className="attendance-report-detail-grid">
          <div>
            <small>Masuk - Pulang</small>
            <strong>
              <span className="in">{checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              <span> - </span>
              <span className={record.checkOutAt ? "out" : ""}>
                {record.checkOutAt ? toDate(record.checkOutAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
              </span>
            </strong>
            <small>{checkInAt.toLocaleDateString("id-ID")}</small>
          </div>
          <div>
            <small>Durasi Kerja</small>
            <strong>{record.checkOutAt ? getDurationLabel(checkInAt, toDate(record.checkOutAt)) : "-"}</strong>
            <small>Jarak: {record.distanceToCenter ? `${Math.round(record.distanceToCenter)}m` : "-"} (+/-{record.accuracyMeters}m)</small>
          </div>
        </div>
        <a className="attendance-report-map-link" href={mapUrl} target="_blank" rel="noreferrer">
          Buka di Google Maps <Navigation size={14} />
        </a>
      </DetailSection>

      <DetailSection icon={<MonitorSmartphone size={16} />} title="Device Info">
        <p className="attendance-report-device">{record.userAgent || "Tidak terdeteksi"}</p>
      </DetailSection>

      {isAdmin && (
        <div className="attendance-report-admin-actions">
          <h5><ShieldAlert size={16} /> Aksi Validasi Admin</h5>
          <div>
            <button type="button" className="approve" onClick={() => void onReview(record.id, "valid")}>
              <CheckCircle size={18} /> Terima Absen
            </button>
            <button type="button" className="reject" onClick={() => void onReview(record.id, "rejected")}>
              <XCircle size={18} /> Tolak Absen
            </button>
          </div>
          <form className="attendance-report-correction-form" onSubmit={handleCorrectionSubmit}>
            <label>
              Status
              <select value={editStatus} onChange={(event) => setEditStatus(event.target.value as AttendanceRecord["status"])}>
                {manualStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              Masuk
              <input type="datetime-local" value={editCheckInAt} onChange={(event) => setEditCheckInAt(event.target.value)} />
            </label>
            <label>
              Pulang
              <input type="datetime-local" value={editCheckOutAt} onChange={(event) => setEditCheckOutAt(event.target.value)} />
            </label>
            <label>
              Catatan
              <textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} />
            </label>
            <button type="submit" className="approve">
              <Save size={18} /> Simpan Koreksi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function DetailSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="attendance-report-detail-section">
      <h5>{icon} {title}</h5>
      {children}
    </section>
  );
}

function StatCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <article className={`attendance-report-stat ${tone}`}>
      <div>{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { label, tone } = STATUS_CONFIG[status] || { label: status, tone: "muted" };

  return <span className={`attendance-report-status ${tone}`}>{label}</span>;
}
