import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Clock3,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Headphones,
  LogOut,
  Mic2,
  Pause,
  Play,
  Podcast,
  Radio,
  Sparkles,
  User,
  Users,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGlobalAudio } from "../contexts/useGlobalAudio";
import { dailyInsertPrograms, getProgramInfo, type BroadcastProgramSlot, type PageKey, weeklyBroadcastSchedule } from "../data/radioData";
import type { AuthSession } from "../services/auth.service";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";
import type { AttendanceRecord, Permission, SongRequest } from "../types/domain";
import { canUser, getRoleLabel } from "../utils/rbac";
import { mergeScheduleSlotsRemote } from "../services/scheduleSlot.service";
import { getIndonesianDay, parseTimeRangeMinutes } from "../utils/scheduleClock";
import { subscribeSongRequests } from "../services/songRequest.service";

const featuredPodcastEpisodes = [
  {
    title: "SBL FESTIVAL on AIR - Special Talkshow Hari Guru Nasional 2025",
    meta: "Episode pilihan - SBL Podcast",
    image: "https://image-cdn-fa.spotifycdn.com/image/ab67656300005f1f5decf14e352a2d9101a6d10c"
  },
  {
    title: "Pinrang di Mata Dunia: Behind the Scene Festival Budaya Internasional",
    meta: "Episode pilihan - SBL Podcast",
    image: "https://image-cdn-ak.spotifycdn.com/image/ab67656300005f1f8d8eab9e6c1793afef3838b7"
  }
];

type DashboardMenuItem = {
  key: PageKey;
  label: string;
  icon: LucideIcon;
  tone: string;
  requiredPermission: Permission;
};

type DashboardFocus = {
  mode: string;
  title: string;
  description: string;
  detail: string;
  actionLabel: string;
  actionPage: PageKey;
  tone: "prep" | "live" | "wrap" | "done";
};

type DashboardShortcut = {
  key: PageKey;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  priority: number;
};

type DashboardTimelineItem = {
  title: string;
  detail: string;
  tone: "live" | "info" | "warning" | "success";
  page?: PageKey;
};

type DashboardBriefingItem = {
  priority: "critical" | "important" | "passive";
  label: string;
  title: string;
  detail: string;
  actionLabel: string;
  page: PageKey;
  icon: LucideIcon;
};

type DashboardActionItem = {
  key: string;
  tone?: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  ariaLabel: string;
  page: PageKey;
};

type DashboardAssistantInsight = {
  label: string;
  title: string;
  detail: string;
  actionLabel: string;
  page: PageKey;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber";
};

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function findNextBroadcastProgram(now: Date, mainSlots: BroadcastProgramSlot[]): BroadcastProgramSlot | undefined {
  const currentAbsoluteMinutes = now.getTime() / 60000;
  const candidates: Array<BroadcastProgramSlot & { absoluteStart: number }> = [];

  for (let offset = 0; offset <= 7; offset += 1) {
    const date = addDays(now, offset);
    const day = getIndonesianDay(date);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayStartMinutes = dayStart.getTime() / 60000;

    mainSlots
      .filter((slot) => slot.day === day)
      .forEach((slot) => {
        const { start } = parseTimeRangeMinutes(slot.time);
        candidates.push({ ...slot, absoluteStart: dayStartMinutes + start });
      });

    dailyInsertPrograms.forEach((slot) => {
      const { start } = parseTimeRangeMinutes(slot.time);
      candidates.push({
        day,
        time: slot.time,
        program: slot.program,
        description: slot.description,
        announcer: slot.pic,
        absoluteStart: dayStartMinutes + start
      });
    });
  }

  return candidates
    .filter((slot) => slot.absoluteStart > currentAbsoluteMinutes + 0.01)
    .sort((a, b) => a.absoluteStart - b.absoluteStart)[0];
}

function toLocalDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function slotMatchesUser(slot: BroadcastProgramSlot, session: AuthSession): boolean {
  const names = [
    session.user.airName,
    session.user.displayName,
    session.user.email?.split("@")[0]
  ]
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLowerCase());

  const announcerText = slot.announcer.toLowerCase();
  return names.some((name) => announcerText.includes(name));
}

function findNextSlotToday(now: Date, slots: BroadcastProgramSlot[]): BroadcastProgramSlot | undefined {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots
    .map((slot) => ({ slot, start: parseTimeRangeMinutes(slot.time).start }))
    .filter((item) => item.start >= currentMinutes)
    .sort((a, b) => a.start - b.start)[0]?.slot;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi,";
  if (hour < 15) return "Selamat Siang,";
  if (hour < 18) return "Selamat Sore,";
  return "Selamat Malam,";
}

function getMinutesUntil(startTime: string, now: Date): number | null {
  const parsed = parseTimeRangeMinutes(startTime);
  if (!Number.isFinite(parsed.start)) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return parsed.start - currentMinutes;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) {
    return "sedang berlangsung";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}j ${mins}m lagi`;
  }

  return `${mins}m lagi`;
}

function formatRequestTime(value: unknown): string {
  const date = toLocalDate(value);
  if (!date) return "Baru masuk";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getOperationalFocus({
  activeUserSlot,
  dashboardUserSlot,
  todayAttendance,
  currentProgram
}: {
  activeUserSlot?: BroadcastProgramSlot;
  dashboardUserSlot?: BroadcastProgramSlot;
  todayAttendance?: AttendanceRecord;
  currentProgram: string;
}): DashboardFocus {
  if (activeUserSlot) {
    return {
      mode: "Mode On-Air",
      title: `Sedang siaran: ${currentProgram}`,
      description: "Fokus ke request pendengar, cue naskah, dan kontrol siaran. Menu lain tetap tersedia saat diperlukan.",
      detail: `${activeUserSlot.time.replace(/ WITA/g, "")} WITA - ${activeUserSlot.announcer}`,
      actionLabel: "Buka request",
      actionPage: "requests",
      tone: "live"
    };
  }

  if (!todayAttendance) {
    return {
      mode: "Persiapan siaran",
      title: "Mulai dari absensi masuk",
      description: dashboardUserSlot
        ? "Pastikan lokasi, koneksi, dan perangkat siap sebelum jadwal dimulai."
        : "Belum ada jadwal pribadi hari ini. Cek jadwal mingguan atau siapkan kebutuhan siaran umum.",
      detail: dashboardUserSlot
        ? `${dashboardUserSlot.program} - ${dashboardUserSlot.time.replace(/ WITA/g, "")} WITA`
        : "Cek jadwal mingguan",
      actionLabel: "Absen sekarang",
      actionPage: "attendance",
      tone: "prep"
    };
  }

  if (!todayAttendance.checkOutAt) {
    return {
      mode: "Mode kerja aktif",
      title: "Absensi masuk sudah tercatat",
      description: "Lanjutkan pekerjaan siaran atau operasional. Jangan lupa absen pulang setelah tugas selesai.",
      detail: dashboardUserSlot
        ? `${dashboardUserSlot.program} - ${dashboardUserSlot.time.replace(/ WITA/g, "")} WITA`
        : "Pantau dashboard dan notifikasi",
      actionLabel: "Buka absensi",
      actionPage: "attendance",
      tone: "wrap"
    };
  }

  return {
    mode: "Setelah siaran",
    title: "Absensi hari ini selesai",
    description: "Saatnya cek rekap, arsip, atau tindak lanjut request yang belum diproses.",
    detail: "Status kehadiran selesai",
    actionLabel: "Lihat profil",
    actionPage: "profile",
    tone: "done"
  };
}

export function DashboardPage({
  session,
  onNavigate,
  onLogout,
  onAirAnnouncer,
  onAirAnnouncers,
  attendanceRecords
}: {
  session: AuthSession;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
  onAirAnnouncer: string;
  onAirAnnouncers?: string[];
  attendanceRecords: AttendanceRecord[];
}) {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [activeAnnouncerIndex, setActiveAnnouncerIndex] = useState(0);
  const [scheduleSlots, setScheduleSlots] = useState<BroadcastProgramSlot[]>(weeklyBroadcastSchedule);
  const [recentPages, setRecentPages] = useState<PageKey[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const currentSlot = useCurrentBroadcastSlot();
  const { playing, togglePlayback, metadata } = useGlobalAudio();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void mergeScheduleSlotsRemote(weeklyBroadcastSchedule).then((slots) => {
      if (isMounted) {
        setScheduleSlots(slots);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeSongRequests((requests) => {
      setSongRequests(requests);
    });
  }, []);

  const nextSlot = useMemo(() => {
    if (!currentSlot.time) {
      return undefined;
    }

    return findNextBroadcastProgram(new Date(), scheduleSlots);
  }, [currentSlot.time, scheduleSlots]);

  const playerAnnouncers = useMemo(() => {
    const names = onAirAnnouncers && onAirAnnouncers.length > 0
      ? onAirAnnouncers
      : onAirAnnouncer.split(/\s+\/\s+/).filter(Boolean);
    return names;
  }, [onAirAnnouncer, onAirAnnouncers]);
  const playerAnnouncerKey = playerAnnouncers.join("|");

  useEffect(() => {
    setActiveAnnouncerIndex(0);

    if (playerAnnouncers.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveAnnouncerIndex((current) => (current + 1) % playerAnnouncers.length);
    }, 4_000);

    return () => window.clearInterval(intervalId);
  }, [playerAnnouncerKey, playerAnnouncers.length]);

  const displayAnnouncer = playerAnnouncers[activeAnnouncerIndex % Math.max(playerAnnouncers.length, 1)] ?? "";
  const displayAnnouncerTitle = playerAnnouncers.join(" / ");
  const hasTrackCoverArt = Boolean(metadata.albumArtUrl && !metadata.albumArtUrl.includes("LogoSBL"));
  const nextProgramInfo = nextSlot ? getProgramInfo(nextSlot.program) : null;
  const todayDay = getIndonesianDay(now);
  const todayAttendance = useMemo(
    () => attendanceRecords.find((record) => {
      const recordDate = toLocalDate(record.checkInAt);
      return record.userId === session.user.id && recordDate && isSameLocalDay(recordDate, now);
    }),
    [attendanceRecords, now, session.user.id]
  );
  const todaysUserSlots = useMemo(
    () => scheduleSlots.filter((slot) => slot.day === todayDay && slotMatchesUser(slot, session)),
    [scheduleSlots, session, todayDay]
  );
  const nextUserSlot = useMemo(
    () => findNextSlotToday(now, todaysUserSlots),
    [now, todaysUserSlots]
  );
  const activeUserSlot = todaysUserSlots.find((slot) => slot.time === currentSlot.time || slot.program === currentSlot.title);
  const dashboardUserSlot = activeUserSlot ?? nextUserSlot ?? todaysUserSlots[0];
  const nextUserSlotCountdown = nextUserSlot ? getMinutesUntil(nextUserSlot.time, now) : null;
  const attendanceLabel = todayAttendance
    ? todayAttendance.checkOutAt
      ? "Absen hari ini selesai"
      : "Sudah absen masuk"
    : "Belum absen hari ini";
  const attendanceTone = todayAttendance
    ? todayAttendance.status === "outside_radius" || todayAttendance.status === "needs_review"
      ? "warning"
      : "success"
    : "warning";
  const operationalFocus = getOperationalFocus({
    activeUserSlot,
    dashboardUserSlot,
    todayAttendance,
    currentProgram: currentSlot.title
  });
  const requestQueue = useMemo(() => {
    const activeStatuses = new Set<SongRequest["status"]>(["new", "notified", "queued"]);
    const activeRequests = songRequests
      .filter((request) => activeStatuses.has(request.status))
      .sort((left, right) => {
        const leftDate = toLocalDate(left.createdAt)?.getTime() ?? 0;
        const rightDate = toLocalDate(right.createdAt)?.getTime() ?? 0;
        return rightDate - leftDate;
      });

    return {
      active: activeRequests,
      latest: activeRequests[0],
      queued: activeRequests.filter((request) => request.status === "queued").length,
      playedToday: songRequests.filter((request) => {
        const requestDate = toLocalDate(request.createdAt);
        return request.status === "played" && requestDate && isSameLocalDay(requestDate, now);
      }).length
    };
  }, [now, songRequests]);
  const todaySongRequests = useMemo(
    () => songRequests.filter((request) => {
      const requestDate = toLocalDate(request.createdAt);
      return requestDate && isSameLocalDay(requestDate, now);
    }),
    [now, songRequests]
  );
  const popularRequestToday = useMemo(() => {
    const counts = new Map<string, number>();

    todaySongRequests.forEach((request) => {
      const title = request.title.trim();
      if (!title) return;
      counts.set(title, (counts.get(title) ?? 0) + 1);
    });

    return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0];
  }, [todaySongRequests]);
  const briefingItems = useMemo<DashboardBriefingItem[]>(() => {
    const items: DashboardBriefingItem[] = [];

    if (activeUserSlot) {
      items.push({
        priority: "critical",
        label: "Critical",
        title: "Mode siaran aktif",
        detail: requestQueue.latest
          ? `${requestQueue.active.length} request aktif. Terbaru: ${requestQueue.latest.title}.`
          : "Buka request lagu dan jaga layar tetap fokus ke kebutuhan on-air.",
        actionLabel: "Buka request",
        page: "requests",
        icon: Radio
      });
    } else if (!todayAttendance) {
      items.push({
        priority: "critical",
        label: "Critical",
        title: "Absensi belum masuk",
        detail: "Lengkapi absensi sebelum masuk tugas operasional hari ini.",
        actionLabel: "Absen",
        page: "attendance",
        icon: AlertCircle
      });
    }

    if (nextUserSlot && nextUserSlotCountdown !== null && nextUserSlotCountdown <= 45) {
      items.push({
        priority: "important",
        label: "Important",
        title: "Jadwal pribadi mendekat",
        detail: `${nextUserSlot.program} mulai ${formatCountdown(nextUserSlotCountdown)}.`,
        actionLabel: "Cek jadwal",
        page: "schedule",
        icon: CalendarClock
      });
    } else if (dashboardUserSlot) {
      items.push({
        priority: "important",
        label: "Important",
        title: "Rundown pribadi tersedia",
        detail: `${dashboardUserSlot.program} - ${dashboardUserSlot.time.replace(/ WITA/g, "")} WITA.`,
        actionLabel: "Buka jadwal",
        page: "schedule",
        icon: CalendarClock
      });
    } else if (session.user.role === "admin" || session.user.role === "super_admin") {
      items.push({
        priority: "important",
        label: "Important",
        title: "Monitoring staf",
        detail: "Cek rekap absensi untuk melihat catatan yang perlu atensi.",
        actionLabel: "Buka rekap",
        page: "attendanceReport",
        icon: FileText
      });
    }

    if (canUser(session.user.role, "ai:use")) {
      items.push({
        priority: "passive",
        label: "Passive",
        title: "Cue naskah cepat",
        detail: "Siapkan pembuka, bridging, atau penutup program lewat AI naskah.",
        actionLabel: "Buat naskah",
        page: "aiScript",
        icon: Sparkles
      });
    } else {
      items.push({
        priority: "passive",
        label: "Passive",
        title: metadata.isOnline ? "Streaming stabil" : "Streaming perlu dicek",
        detail: metadata.isOnline ? "Siaran publik sedang terdeteksi aktif." : "Buka streaming untuk mengecek status player.",
        actionLabel: "Buka streaming",
        page: "streaming",
        icon: Headphones
      });
    }

    return items.slice(0, 3);
  }, [
    activeUserSlot,
    dashboardUserSlot,
    metadata.isOnline,
    nextUserSlot,
    nextUserSlotCountdown,
    requestQueue.active.length,
    requestQueue.latest,
    session.user.role,
    todayAttendance
  ]);
  const timelineItems = useMemo<DashboardTimelineItem[]>(() => {
    const items: DashboardTimelineItem[] = [];

    if (activeUserSlot) {
      items.push({
        title: "Siaran aktif",
        detail: `${activeUserSlot.program} · ${activeUserSlot.time.replace(/ WITA/g, "")} WITA`,
        tone: "live",
        page: "requests"
      });
    } else if (nextUserSlot && nextUserSlotCountdown !== null) {
      items.push({
        title: "Menuju jadwal pribadi",
        detail: `${nextUserSlot.program} · ${formatCountdown(nextUserSlotCountdown)}`,
        tone: nextUserSlotCountdown <= 30 ? "warning" : "info",
        page: "schedule"
      });
    } else if (dashboardUserSlot) {
      items.push({
        title: "Jadwal berikutnya",
        detail: `${dashboardUserSlot.program} · ${dashboardUserSlot.time.replace(/ WITA/g, "")} WITA`,
        tone: "info",
        page: "schedule"
      });
    }

    if (todayAttendance) {
      items.push({
        title: todayAttendance.checkOutAt ? "Absensi selesai" : "Absensi masuk tercatat",
        detail: todayAttendance.checkOutAt ? "Siap lanjut evaluasi atau arsip siaran." : "Lanjut kerja dan jangan lupa absen pulang.",
        tone: todayAttendance.checkOutAt ? "success" : "info",
        page: "attendance"
      });
    } else {
      items.push({
        title: "Absensi belum diisi",
        detail: "Lengkapi absensi sebelum memasuki tugas inti.",
        tone: "warning",
        page: "attendance"
      });
    }

    if (!activeUserSlot && nextProgramInfo) {
      items.push({
        title: "Program terdekat",
        detail: nextProgramInfo.description.slice(0, 96),
        tone: "info",
        page: "schedule"
      });
    }

    if (requestQueue.latest) {
      items.push({
        title: "Request terbaru",
        detail: `${requestQueue.latest.title} dari ${requestQueue.latest.requesterName}`,
        tone: requestQueue.latest.status === "queued" ? "success" : "info",
        page: "requests"
      });
    }

    return items.slice(0, 4);
  }, [activeUserSlot, dashboardUserSlot, nextProgramInfo, nextUserSlot, nextUserSlotCountdown, requestQueue.latest, todayAttendance]);

  const assistantInsights = useMemo<DashboardAssistantInsight[]>(() => {
    const insights: DashboardAssistantInsight[] = [];
    const nextProgramName = dashboardUserSlot?.program ?? nextSlot?.program ?? currentSlot.title;

    if (activeUserSlot) {
      insights.push({
        label: "Ringkasan on-air",
        title: requestQueue.latest
          ? `${requestQueue.active.length} request perlu dipantau`
          : "Siaran berjalan tanpa request aktif",
        detail: requestQueue.latest
          ? `Request terbaru: ${requestQueue.latest.title}. Siapkan cue singkat sebelum diputar.`
          : "Jaga layar tetap fokus ke request, timer, dan cue program.",
        actionLabel: "Buka request",
        page: "requests",
        icon: Radio,
        tone: "green"
      });
    } else {
      insights.push({
        label: "Ringkasan shift",
        title: dashboardUserSlot ? `${dashboardUserSlot.program} perlu disiapkan` : "Pantau jadwal utama",
        detail: dashboardUserSlot
          ? `${dashboardUserSlot.time.replace(/ WITA/g, "")} WITA bersama ${dashboardUserSlot.announcer}.`
          : "Tidak ada jadwal pribadi terdeteksi hari ini. Cek susunan siaran sebelum mulai kerja.",
        actionLabel: "Buka jadwal",
        page: "schedule",
        icon: CalendarClock,
        tone: "blue"
      });
    }

    insights.push({
      label: "Rekomendasi cue",
      title: `Siapkan naskah untuk ${nextProgramName}`,
      detail: popularRequestToday
        ? `${popularRequestToday[0]} muncul ${popularRequestToday[1]} kali hari ini. Bisa dipakai sebagai bahan bridging.`
        : "Buat pembuka, bridging, atau penutup singkat agar transisi siaran lebih mulus.",
      actionLabel: "Buat naskah",
      page: "aiScript",
      icon: Sparkles,
      tone: "amber"
    });

    if (!todayAttendance) {
      insights.push({
        label: "Tindak lanjut",
        title: "Absensi belum lengkap",
        detail: "Lengkapi absensi sebelum mengambil tugas utama agar rekap harian tetap rapi.",
        actionLabel: "Absen",
        page: "attendance",
        icon: ClipboardCheck,
        tone: "amber"
      });
    } else if (session.user.role === "admin" || session.user.role === "super_admin") {
      insights.push({
        label: "Monitoring admin",
        title: "Cek laporan operasional",
        detail: "Lihat rekap absensi dan catatan staf untuk mendeteksi hal yang perlu validasi.",
        actionLabel: "Buka rekap",
        page: "attendanceReport",
        icon: FileText,
        tone: "blue"
      });
    } else {
      insights.push({
        label: "Tindak lanjut",
        title: requestQueue.active.length > 0 ? "Request masih aktif" : "Workflow aman",
        detail: requestQueue.active.length > 0
          ? "Ada request yang belum selesai. Buka antrean sebelum menutup sesi."
          : "Absensi sudah tercatat dan tidak ada request aktif yang mendesak.",
        actionLabel: requestQueue.active.length > 0 ? "Buka request" : "Lihat profil",
        page: requestQueue.active.length > 0 ? "requests" : "profile",
        icon: CheckCircle2,
        tone: "green"
      });
    }

    return insights;
  }, [
    activeUserSlot,
    currentSlot.title,
    dashboardUserSlot,
    nextSlot,
    popularRequestToday,
    requestQueue.active.length,
    requestQueue.latest,
    session.user.role,
    todayAttendance
  ]);

  const menuItems = useMemo(() => {
    const baseItems: DashboardMenuItem[] = [
      { key: "schedule", label: "Jadwal", icon: CalendarClock, tone: "schedule", requiredPermission: "schedule:read" },
      { key: "streaming", label: "Streaming", icon: Radio, tone: "streaming", requiredPermission: "dashboard:read" },
      { key: "podcast", label: "Podcast", icon: Headphones, tone: "podcast", requiredPermission: "dashboard:read" },
      { key: "requests", label: "Request", icon: Headphones, tone: "requests", requiredPermission: "complaints:submit" },
      { key: "attendance", label: "Absensi", icon: ClipboardCheck, tone: "attendance", requiredPermission: "attendance:self" },
      { key: "scheduleSwap", label: "Tukar Jadwal", icon: CalendarClock, tone: "schedule-swap", requiredPermission: "schedule:swap" },
      { key: "aiScript", label: "Naskah AI", icon: Sparkles, tone: "ai-script", requiredPermission: "ai:use" },
      { key: "liveOb", label: "Live OB", icon: Radio, tone: "live-ob", requiredPermission: "live_ob:manage" },
      { key: "coverage", label: "Event", icon: FileText, tone: "coverage", requiredPermission: "coverage:manage" },
      { key: "announcers", label: "Penyiar", icon: Users, tone: "announcers", requiredPermission: "schedule:read" },
      { key: "complaints", label: "Aduan", icon: Bell, tone: "complaints", requiredPermission: "complaints:submit" }
    ];

    if (session.user.role === "super_admin" || session.user.role === "admin") {
      baseItems.push(
        { key: "users", label: "Kelola User", icon: Users, tone: "users", requiredPermission: "users:manage" },
        { key: "attendanceReport", label: "Rekap Absen", icon: FileText, tone: "attendance-report", requiredPermission: "users:manage" }
      );
    }

    return baseItems.filter((item) => canUser(session.user.role, item.requiredPermission));
  }, [session.user.role]);

  const recentMenuItems = useMemo(() => {
    const lookup = new Map(menuItems.map((item) => [item.key, item] as const));
    return recentPages
      .map((page) => lookup.get(page))
      .filter((item): item is DashboardMenuItem => Boolean(item))
      .slice(0, 4);
  }, [menuItems, recentPages]);
  const primaryBriefingItem = briefingItems[0];
  const supportingBriefingItems = briefingItems.slice(1);

  const quickActions = useMemo<DashboardShortcut[]>(() => {
    const announcerPriority = session.user.role === "announcer" ? 0 : 1;
    const adminPriority = session.user.role === "super_admin" || session.user.role === "admin" ? 0 : 2;
    const userHasSlotToday = todaysUserSlots.length > 0;
    const liveMode = Boolean(activeUserSlot);

    const shortcuts: DashboardShortcut[] = [
      {
        key: "requests",
        label: liveMode ? "Buka request" : "Request lagu",
        description: liveMode ? "Pantau antrean pendengar saat siaran berjalan." : "Lihat antrean permintaan terbaru.",
        icon: Headphones,
        tone: "requests",
        priority: liveMode ? 0 : 2
      },
      {
        key: "attendance",
        label: todayAttendance ? "Lihat absensi" : "Absen sekarang",
        description: todayAttendance ? "Cek status kehadiran hari ini." : "Lengkapi absensi sebelum bertugas.",
        icon: ClipboardCheck,
        tone: "attendance",
        priority: activeUserSlot ? 2 : 0
      },
      {
        key: "schedule",
        label: userHasSlotToday ? "Jadwal saya" : "Cek jadwal",
        description: userHasSlotToday ? "Buka susunan siaran hari ini." : "Lihat jadwal mingguan lengkap.",
        icon: CalendarClock,
        tone: "schedule",
        priority: userHasSlotToday ? 0 : 1
      },
      {
        key: "aiScript",
        label: "Naskah cepat",
        description: "Buka generator naskah saat butuh cue cepat.",
        icon: Sparkles,
        tone: "ai-script",
        priority: announcerPriority
      },
      {
        key: "coverage",
        label: "Upload cepat",
        description: "Pantau atau kirim update liputan lapangan.",
        icon: FileText,
        tone: "coverage",
        priority: session.user.role === "reporter" ? 0 : 3
      },
      {
        key: "users",
        label: "Monitoring user",
        description: "Kelola akun dan akses operasional tim.",
        icon: Users,
        tone: "users",
        priority: adminPriority
      }
    ];

    return shortcuts
      .filter((shortcut) => canUser(session.user.role, menuItems.find((item) => item.key === shortcut.key)?.requiredPermission ?? "dashboard:read"))
      .sort((left, right) => left.priority - right.priority)
      .slice(0, 4);
  }, [activeUserSlot, menuItems, session.user.role, todayAttendance, todaysUserSlots.length]);

  const roleActionCards = useMemo<DashboardActionItem[]>(() => {
    const scheduleAction: DashboardActionItem = {
      key: "schedule",
      tone: "primary",
      icon: CalendarClock,
      eyebrow: "Jadwal saya hari ini",
      title: dashboardUserSlot?.program ?? "Tidak ada jadwal pribadi",
      description: dashboardUserSlot
        ? `${dashboardUserSlot.time.replace(/ WITA/g, "")} WITA - ${dashboardUserSlot.announcer}`
        : "Cek jadwal mingguan untuk melihat susunan siaran terbaru.",
      ariaLabel: "Buka jadwal saya",
      page: "schedule"
    };
    const attendanceAction: DashboardActionItem = {
      key: "attendance",
      tone: attendanceTone,
      icon: todayAttendance ? CheckCircle2 : AlertCircle,
      eyebrow: "Absensi",
      title: attendanceLabel,
      description: todayAttendance
        ? todayAttendance.status === "outside_radius"
          ? "Absen tercatat, tetapi lokasi perlu ditinjau."
          : "Status kehadiran sudah tercatat untuk hari ini."
        : "Lakukan absen masuk sebelum mulai bertugas.",
      ariaLabel: "Buka absensi",
      page: "attendance"
    };
    const requestAction: DashboardActionItem = {
      key: "requests",
      icon: Headphones,
      eyebrow: activeUserSlot ? "Request on-air" : "Request lagu",
      title: activeUserSlot ? "Pantau antrean sekarang" : "Cek antrean pendengar",
      description: activeUserSlot
        ? "Prioritaskan permintaan pendengar saat siaran berjalan."
        : "Proses permintaan lagu dengan cepat saat diperlukan.",
      ariaLabel: "Buka request lagu",
      page: "requests"
    };
    const aiAction: DashboardActionItem = {
      key: "aiScript",
      tone: "notice",
      icon: Sparkles,
      eyebrow: "Cue cepat",
      title: "Buat naskah siaran",
      description: "Siapkan pembuka, bridging, atau penutup program.",
      ariaLabel: "Buka naskah AI",
      page: "aiScript"
    };
    const streamingAction: DashboardActionItem = {
      key: "streaming",
      icon: Radio,
      eyebrow: "Streaming",
      title: metadata.isOnline ? "Siaran publik aktif" : "Cek player siaran",
      description: metadata.isOnline ? "Pantau program berjalan dan kontrol audio." : "Buka streaming untuk mengecek status siaran.",
      ariaLabel: "Buka streaming",
      page: "streaming"
    };
    const liveObAction: DashboardActionItem = {
      key: "liveOb",
      tone: "notice",
      icon: Radio,
      eyebrow: "Live tools",
      title: "Live/OB",
      description: "Buka checklist, rundown, dan link koordinasi siaran.",
      ariaLabel: "Buka Live OB",
      page: "liveOb"
    };
    const adminReportAction: DashboardActionItem = {
      key: "attendanceReport",
      tone: "primary",
      icon: FileText,
      eyebrow: "Monitoring",
      title: "Rekap absensi",
      description: "Lihat staf hadir, izin, dan catatan yang perlu validasi.",
      ariaLabel: "Buka rekap absensi",
      page: "attendanceReport"
    };
    const userAction: DashboardActionItem = {
      key: "users",
      icon: Users,
      eyebrow: "Admin",
      title: "Kelola user",
      description: "Pantau akses, role, dan profil operasional tim.",
      ariaLabel: "Buka kelola user",
      page: "users"
    };
    const complaintsAction: DashboardActionItem = {
      key: "complaints",
      tone: "warning",
      icon: Bell,
      eyebrow: "Aduan",
      title: "Tindak lanjut publik",
      description: "Pantau saran, pengaduan, dan status penyelesaian.",
      ariaLabel: "Buka aduan",
      page: "complaints"
    };
    const coverageAction: DashboardActionItem = {
      key: "coverage",
      tone: "primary",
      icon: FileText,
      eyebrow: "Liputan",
      title: "Tugas lapangan",
      description: "Cek deadline, upload dokumentasi, dan status tugas.",
      ariaLabel: "Buka liputan",
      page: "coverage"
    };
    const scheduleSwapAction: DashboardActionItem = {
      key: "scheduleSwap",
      tone: "notice",
      icon: CalendarClock,
      eyebrow: "Koordinasi",
      title: "Tukar jadwal",
      description: "Periksa konfirmasi pengganti atau permintaan rekan.",
      ariaLabel: "Buka tukar jadwal",
      page: "scheduleSwap"
    };

    const byRole: Record<string, DashboardActionItem[]> = {
      announcer: [requestAction, aiAction, scheduleAction, streamingAction],
      admin: [adminReportAction, userAction, scheduleSwapAction, complaintsAction],
      super_admin: [adminReportAction, userAction, scheduleSwapAction, complaintsAction],
      reporter: [coverageAction, attendanceAction, scheduleAction, aiAction],
      operator: [streamingAction, liveObAction, requestAction, scheduleAction],
      leader: [adminReportAction, coverageAction, scheduleAction, complaintsAction],
      employee: [attendanceAction, scheduleAction, requestAction, streamingAction],
      public: [streamingAction, requestAction, complaintsAction, scheduleAction]
    };

    const selected = byRole[session.user.role] ?? [scheduleAction, attendanceAction, requestAction, scheduleSwapAction];
    const permissionByPage = new Map(menuItems.map((item) => [item.key, item.requiredPermission] as const));

    return selected
      .filter((item) => canUser(session.user.role, permissionByPage.get(item.page) ?? "dashboard:read"))
      .slice(0, 4);
  }, [
    activeUserSlot,
    attendanceLabel,
    attendanceTone,
    dashboardUserSlot,
    menuItems,
    metadata.isOnline,
    session.user.role,
    todayAttendance
  ]);

  useEffect(() => {
    try {
      const storageKey = `radiosbl.recentPages:${session.user.id}`;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setRecentPages(parsed.filter((item): item is PageKey => typeof item === "string"));
      }
    } catch {
      setRecentPages([]);
    }
  }, [session.user.id]);

  const dashboardMenuPreviewCount = 4;
  const visibleMenuItems = showAllMenu ? menuItems : menuItems.slice(0, dashboardMenuPreviewCount);
  const hasMoreMenu = menuItems.length > dashboardMenuPreviewCount;

  function closeProfileSheet() {
    setShowProfilePopup(false);
    setShowLogoutConfirm(false);
  }

  function registerRecentPage(page: PageKey) {
    try {
      const storageKey = `radiosbl.recentPages:${session.user.id}`;
      const existing = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as unknown;
      const list = Array.isArray(existing) ? existing.filter((item): item is PageKey => typeof item === "string") : [];
      const next = [page, ...list.filter((item) => item !== page)].slice(0, 4);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setRecentPages(next);
    } catch {
      // ignore persistence failures
    }
  }

  function handleNavigate(page: PageKey) {
    registerRecentPage(page);
    onNavigate(page);
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <button type="button" className="dashboard-profile-trigger" onClick={() => setShowProfilePopup(true)}>
            <img src={session.user.photoUrl || "/iconSBL.svg"} alt="Profil" />
            <span>
              <small>{getGreeting()}</small>
              <strong>{session.user.displayName}</strong>
            </span>
          </button>
          <button
            type="button"
            className="dashboard-notification-button"
            aria-label="Buka notifikasi pertukaran jadwal"
            onClick={() => handleNavigate("scheduleSwap")}
          >
            <Bell size={22} />
          </button>
        </header>

        <section className={`dashboard-radio-player${playing ? " is-playing" : ""}`}>
          <div className="dashboard-radio-bg" />
          <div className="dashboard-radio-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <DashboardSpectrum />

          <div className="dashboard-radio-content">
            <div className="dashboard-radio-main">
              <div className="dashboard-radio-cover">
                <img
                  src={hasTrackCoverArt ? metadata.albumArtUrl : "/LogoSBL.svg"}
                  alt="Cover Art"
                  className={hasTrackCoverArt ? "track-cover" : ""}
                />
              </div>
              <div className="dashboard-radio-copy">
                <span className={`dashboard-radio-status ${metadata.isOnline ? "live" : ""}`}>
                  {metadata.isOnline ? "ON AIR" : "OFF AIR"}
                </span>
                <strong>{currentSlot.title}</strong>
                <div className="dashboard-radio-meta">
                  {displayAnnouncer && (
                    <span>
                      <Headphones size={14} strokeWidth={2.5} />
                      <button type="button" onClick={() => handleNavigate("announcers")} title={displayAnnouncerTitle}>
                        {displayAnnouncer}
                      </button>
                    </span>
                  )}
                  <span>
                    <CalendarClock size={14} />
                    {currentSlot.time.replace(/ WITA/g, "")}
                  </span>
                </div>
                <p>
                  <Radio size={12} />
                  <span>{metadata.artist} - {metadata.title}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className="dashboard-radio-play"
              onClick={togglePlayback}
              aria-label={playing ? "Jeda streaming" : "Putar streaming"}
            >
              {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
          </div>
        </section>

        <section className={`dashboard-focus-strip ${operationalFocus.tone}`} aria-label="Fokus operasional saat ini">
          <div>
            <span>{operationalFocus.mode}</span>
            <h2>{operationalFocus.title}</h2>
            <p>{operationalFocus.description}</p>
          </div>
          <div className="dashboard-focus-action">
            <small>{operationalFocus.detail}</small>
            <button type="button" onClick={() => handleNavigate(operationalFocus.actionPage)}>
              {operationalFocus.actionLabel}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="dashboard-briefing-panel" aria-label="Briefing operasional">
          <div className="dashboard-briefing-head">
            <div>
              <span>Operational Briefing</span>
              <strong>Yang perlu diprioritaskan sekarang</strong>
            </div>
            <button type="button" onClick={() => handleNavigate("menu")}>
              Semua fitur
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="dashboard-briefing-grid">
            {primaryBriefingItem && (() => {
              const Icon = primaryBriefingItem.icon;

              return (
                <article className={`dashboard-briefing-card ${primaryBriefingItem.priority}`}>
                  <span className="dashboard-briefing-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <small>{primaryBriefingItem.label}</small>
                    <strong>{primaryBriefingItem.title}</strong>
                    <p>{primaryBriefingItem.detail}</p>
                  </div>
                  <button type="button" onClick={() => handleNavigate(primaryBriefingItem.page)}>
                    {primaryBriefingItem.actionLabel}
                  </button>
                </article>
              );
            })()}

            {supportingBriefingItems.length > 0 && (
              <details className="dashboard-briefing-more">
                <summary>
                  <span>Prioritas lain</span>
                  <strong>{supportingBriefingItems.length}</strong>
                </summary>
                <div>
                  {supportingBriefingItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={`${item.priority}-${item.title}`} className={`dashboard-briefing-card ${item.priority}`}>
                  <span className="dashboard-briefing-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <small>{item.label}</small>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <button type="button" onClick={() => handleNavigate(item.page)}>
                    {item.actionLabel}
                  </button>
                </article>
              );
                  })}
                </div>
              </details>
            )}
          </div>
        </section>



        <section className="dashboard-smart-panel" aria-label="Aksi cepat dan jadwal">
          <DashboardPanel
            icon={<Sparkles size={20} />}
            title="Aksi Cepat"
            actionLabel="Semua Menu"
            onAction={() => handleNavigate("menu")}
          >
            <div className="dashboard-shortcut-grid">
              {quickActions.map((shortcut) => {
                const Icon = shortcut.icon;
                return (
                  <button
                    type="button"
                    key={shortcut.key}
                    className={`dashboard-shortcut-card tone-${shortcut.tone}`}
                    onClick={() => handleNavigate(shortcut.key)}
                  >
                    <span className="dashboard-shortcut-icon">
                      <Icon size={18} />
                    </span>
                    <strong>{shortcut.label}</strong>
                  </button>
                );
              })}
            </div>
          </DashboardPanel>

          <DashboardPanel
            icon={<CalendarClock size={20} />}
            title="Jadwal Berikutnya"
            actionLabel="Jadwal Lengkap"
            onAction={() => handleNavigate("schedule")}
          >
            {nextSlot ? (
              <button type="button" className="dashboard-next-card" onClick={() => handleNavigate("schedule")}>
                <span className="dashboard-next-cover" aria-hidden="true">
                  <img src={nextProgramInfo?.imageUrl ?? "/LogoSBL.svg"} alt="" />
                </span>
                <span className="dashboard-next-copy">
                  <h3>{nextSlot.program}</h3>
                  <span className="dashboard-next-meta">
                    <Mic2 size={14} color="#64748B" />
                    <span>{nextSlot.announcer}</span>
                  </span>
                  <span className="dashboard-next-time">
                    <CalendarClock size={16} /> {nextSlot.day}, {nextSlot.time.replace(/ WITA/g, "")} WITA
                  </span>
                </span>
              </button>
            ) : (
              <button type="button" className="schedule-slot-card dashboard-schedule-card" onClick={() => onNavigate("schedule")}>
                <span className="schedule-slot-main">
                  <span className="schedule-slot-art" aria-hidden="true">
                    <img src="/LogoSBL.svg" alt="" />
                  </span>
                  <span className="schedule-slot-copy">
                    <h3>Cek Jadwal Mingguan</h3>
                    <span className="schedule-announcer">
                      <Mic2 size={14} color="#64748B" />
                      <span className="schedule-announcer-links">Penyiar belum ditentukan</span>
                    </span>
                  </span>
                </span>
              </button>
            )}
          </DashboardPanel>
        </section>

        {canUser(session.user.role, "ai:use") && (
          <section className="dashboard-assistant-panel" aria-label="Asisten operasional">
            <div className="dashboard-assistant-head">
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <small>AI Operational Assistant</small>
                <strong>Ringkasan dan rekomendasi cepat</strong>
              </div>
              <button type="button" onClick={() => handleNavigate("aiScript")}>
                Naskah AI
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="dashboard-assistant-grid">
              {assistantInsights.slice(0, 1).map((item) => {
                const Icon = item.icon;
                return (
                  <article key={`${item.label}-${item.title}`} className={`dashboard-assistant-card tone-${item.tone}`}>
                    <span className="dashboard-assistant-icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <small>{item.label}</small>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <button type="button" onClick={() => handleNavigate(item.page)}>
                      {item.actionLabel}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="dashboard-activity-panel" aria-label="Aktivitas terbaru">
          <details className="dashboard-secondary-details">
            <summary>
              <span>
                <strong>Aktivitas Terbaru & Podcast</strong>
                <small>Log operasional dan siaran ulang terbaru.</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </summary>
            
            <section className="dashboard-stack">
              <DashboardPanel
                icon={<Clock3 size={20} />}
                title="Aktivitas Terbaru"
                actionLabel="Riwayat Lengkap"
                onAction={() => handleNavigate("menu")}
              >
                <div className="dashboard-timeline">
                  {timelineItems.slice(0, 3).map((item) => (
                    <button
                      key={`${item.title}-${item.detail}`}
                      type="button"
                      className={`dashboard-timeline-item tone-${item.tone}`}
                      onClick={() => item.page && handleNavigate(item.page)}
                    >
                      <span className="dashboard-timeline-dot" />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </DashboardPanel>

              <DashboardPanel
                icon={<Podcast size={20} />}
                title="Podcast Unggulan"
                tone="amber"
                actionLabel="Lihat Semua"
                onAction={() => handleNavigate("podcast")}
              >
                <div className="dashboard-podcast-list">
                  {featuredPodcastEpisodes.slice(0, 1).map((episode) => (
                    <article
                      key={episode.title}
                      className="podcast-episode-card dashboard-podcast-card"
                      onClick={() => handleNavigate("podcast")}
                    >
                      <span className="podcast-episode-art">
                        <img src={episode.image} alt={episode.title} />
                      </span>
                      <span className="podcast-episode-copy">
                        <strong>{episode.title}</strong>
                        <small>{episode.meta}</small>
                      </span>
                      <button
                        type="button"
                        className="podcast-card-play"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleNavigate("podcast");
                        }}
                        aria-label={`Buka ${episode.title}`}
                      >
                        <Play fill="currentColor" size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </DashboardPanel>
            </section>
          </details>
        </section>
      </div>

      {showProfilePopup && (
        <div className="dashboard-profile-backdrop" onClick={closeProfileSheet}>
          <section className="dashboard-profile-sheet" onClick={(event) => event.stopPropagation()}>
            <span className="dashboard-sheet-handle" aria-hidden="true" />
            <div className="dashboard-profile-sheet-head">
              <h3>Profil Saya</h3>
              <button type="button" onClick={closeProfileSheet} aria-label="Tutup profil saya">
                <X size={18} />
              </button>
            </div>
            <div className="dashboard-profile-card">
              <img src={session.user.photoUrl || "/iconSBL.svg"} alt="Foto profil" />
              <span>
                <strong>{session.user.displayName}</strong>
                <small>{getRoleLabel(session.user.role)}</small>
              </span>
            </div>
            <div className="dashboard-profile-actions">
              <button type="button" onClick={() => { closeProfileSheet(); handleNavigate("profile"); }}>
                <User size={20} /> Edit Detail Profil
              </button>
              <button type="button" className="danger" onClick={() => setShowLogoutConfirm(true)}>
                <LogOut size={20} /> Keluar Sesi
              </button>
            </div>

            {showLogoutConfirm && (
              <div className="dashboard-logout-confirm">
                <strong>Keluar dari akun ini?</strong>
                <p>Sesi login akan ditutup dari perangkat ini.</p>
                <div>
                  <button type="button" onClick={() => setShowLogoutConfirm(false)}>Batal</button>
                  <button type="button" className="danger" onClick={onLogout}>Keluar</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ActionCard({
  icon,
  eyebrow,
  title,
  description,
  tone,
  ariaLabel,
  onClick
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone?: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <article className={`dashboard-action-card ${tone || ""}`}>
      <span className="dashboard-action-icon">{icon}</span>
      <div>
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button type="button" onClick={onClick} aria-label={ariaLabel}>
        <ArrowRight size={18} />
      </button>
    </article>
  );
}

function DashboardPanel({
  icon,
  title,
  actionLabel,
  onAction,
  children,
  tone
}: {
  icon: ReactNode;
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
  tone?: "amber";
}) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-head">
        <div>
          <span className={tone || ""}>{icon}</span>
          <strong>{title}</strong>
        </div>
        <button type="button" onClick={onAction}>{actionLabel}</button>
      </div>
      {children}
    </section>
  );
}

function DashboardSpectrum() {
  return (
    <div className="dashboard-radio-visualizer" aria-hidden="true">
      <svg viewBox="0 0 720 190" preserveAspectRatio="none" focusable="false">
        <defs>
          <filter id="dashboardSpectrumGlow" x="-10%" y="-80%" width="120%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="dashboardSpectrumCyan" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#35D9FF" stopOpacity="0.38" />
            <stop offset="46%" stopColor="#00E5FF" stopOpacity="0.86" />
            <stop offset="100%" stopColor="#6DEBFF" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="dashboardSpectrumMagenta" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#6AD7FF" stopOpacity="0.26" />
            <stop offset="42%" stopColor="#FF4DDE" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#24D8FF" stopOpacity="0.34" />
          </linearGradient>
        </defs>
        <path className="spectrum-mesh mesh-one" d="M0 112 C60 38 112 160 176 92 S294 42 360 104 474 152 546 80 660 66 720 112" />
        <path className="spectrum-mesh mesh-two" d="M0 84 C74 138 118 52 184 106 S288 146 356 84 466 36 548 110 650 154 720 78" />
        <path className="spectrum-line spectrum-cyan" d="M0 100 C40 142 72 48 116 78 S190 126 232 86 300 70 340 104 410 135 456 94 520 56 578 94 664 118 720 86" />
        <path className="spectrum-line spectrum-magenta" d="M0 82 C52 128 84 116 126 74 S208 52 256 94 330 118 380 86 446 78 492 108 560 126 612 76 682 86 720 102" />
        <path className="spectrum-line spectrum-soft" d="M0 96 C64 74 94 104 140 98 S224 74 282 96 374 126 430 96 500 72 554 94 644 124 720 96" />
      </svg>
    </div>
  );
}
