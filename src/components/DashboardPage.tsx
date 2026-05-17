import { 
  ClipboardCheck, 
  CalendarClock, 
  FileText, 
  Radio, 
  Bell, 
  Play, 
  Pause, 
  Headphones, 
  Users, 
  User, 
  LogOut, 
  X,
  Podcast,
  Sparkles,
  Mic2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGlobalAudio } from "../contexts/useGlobalAudio";
import { dailyInsertPrograms, getProgramInfo, type BroadcastProgramSlot, type PageKey, weeklyBroadcastSchedule } from "../data/radioData";
import type { AuthSession } from "../services/auth.service";
import { useEffect, useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";
import type { AttendanceRecord, Permission } from "../types/domain";
import { canUser, getRoleLabel } from "../utils/rbac";
import { mergeScheduleSlotsRemote } from "../services/scheduleSlot.service";
import { getIndonesianDay, parseTimeRangeMinutes } from "../utils/scheduleClock";

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

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function findNextBroadcastProgram(
  now: Date,
  mainSlots: BroadcastProgramSlot[]
): BroadcastProgramSlot | undefined {
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
        candidates.push({
          ...slot,
          absoluteStart: dayStartMinutes + start
        });
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

type DashboardMenuItem = {
  key: PageKey;
  label: string;
  icon: LucideIcon;
  color: string;
  requiredPermission: Permission;
};

export function DashboardPage({ 
  session, 
  onNavigate, 
  onLogout,
  onAirAnnouncer, 
  attendanceRecords 
}: { 
  session: AuthSession, 
  onNavigate: (page: PageKey) => void, 
  onLogout: () => void,
  onAirAnnouncer: string, 
  attendanceRecords: AttendanceRecord[] 
}) {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState<BroadcastProgramSlot[]>(weeklyBroadcastSchedule);
  const currentSlot = useCurrentBroadcastSlot();
  
  const { playing, togglePlayback, metadata } = useGlobalAudio();

  useEffect(() => {
    let isMounted = true;

    mergeScheduleSlotsRemote(weeklyBroadcastSchedule).then((slots) => {
      if (isMounted) {
        setScheduleSlots(slots);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const nextSlot = useMemo(() => {
    if (!currentSlot.time) {
      return undefined;
    }

    return findNextBroadcastProgram(new Date(), scheduleSlots);
  }, [currentSlot.time, scheduleSlots]);

  const displayAnnouncer = useMemo(() => {
    if (attendanceRecords.length === 0) return "";
    return onAirAnnouncer;
  }, [attendanceRecords, onAirAnnouncer]);
  const hasTrackCoverArt = Boolean(metadata.albumArtUrl && !metadata.albumArtUrl.includes("LogoSBL"));
  const nextProgramInfo = nextSlot ? getProgramInfo(nextSlot.program) : null;

  const menuItems = useMemo(() => {
    const baseItems: DashboardMenuItem[] = [
      { key: "schedule", label: "Jadwal", icon: CalendarClock, color: "#0B6ED0", requiredPermission: "schedule:read" },
      { key: "streaming", label: "Streaming", icon: Radio, color: "#00A0A8", requiredPermission: "dashboard:read" },
      { key: "podcast", label: "Podcast", icon: Headphones, color: "#7C3AED", requiredPermission: "dashboard:read" },
      { key: "requests", label: "Request", icon: Headphones, color: "#F97316", requiredPermission: "complaints:submit" },
      { key: "attendance", label: "Absensi", icon: ClipboardCheck, color: "#16A34A", requiredPermission: "attendance:self" },
      { key: "scheduleSwap", label: "Tukar Jadwal", icon: CalendarClock, color: "#D97706", requiredPermission: "schedule:swap" },
      { key: "aiScript", label: "Naskah AI", icon: Sparkles, color: "#DB2777", requiredPermission: "ai:use" },
      { key: "liveOb", label: "Live OB", icon: Radio, color: "#E11D48", requiredPermission: "live_ob:manage" },
      { key: "coverage", label: "Event", icon: FileText, color: "#2563EB", requiredPermission: "coverage:manage" },
      { key: "announcers", label: "Penyiar", icon: Users, color: "#0891B2", requiredPermission: "schedule:read" },
      { key: "complaints", label: "Aduan", icon: Bell, color: "#475569", requiredPermission: "complaints:submit" }
    ];

    if (session.user.role === "super_admin" || session.user.role === "admin") {
      baseItems.push(
        { key: "users", label: "Kelola User", icon: Users, color: "#4F46E5", requiredPermission: "users:manage" },
        { key: "attendanceReport", label: "Rekap Absen", icon: FileText, color: "#0F766E", requiredPermission: "users:manage" }
      );
    }

    return baseItems.filter((item) => canUser(session.user.role, item.requiredPermission));
  }, [session.user.role]);

  const visibleMenuItems = showAllMenu ? menuItems : menuItems.slice(0, 8);
  const hasMoreMenu = menuItems.length > 8;

  return (
    <div style={{ paddingBottom: "100px", background: "#f8f9fc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            onClick={() => setShowProfilePopup(true)}
            style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", position: "relative" }}
          >
            <img 
              src={session.user.photoUrl || "/iconSBL.svg"} 
              alt="Profile" 
              style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", border: "2px solid white", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} 
            />
          </button>
          <div onClick={() => setShowProfilePopup(true)} style={{ cursor: "pointer" }}>
            <span style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "2px" }}>
              {(() => {
                const hour = new Date().getHours();
                if (hour < 11) return "Selamat Pagi,";
                if (hour < 15) return "Selamat Siang,";
                if (hour < 18) return "Selamat Sore,";
                return "Selamat Malam,";
              })()}
            </span>
            <strong style={{ display: "block", fontSize: "1rem", color: "var(--ink)", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>
              {session.user.displayName}
            </strong>
          </div>
        </div>
        <button
          type="button"
          aria-label="Buka notifikasi pertukaran jadwal"
          onClick={() => onNavigate("scheduleSwap")}
          style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}
        >
          <Bell size={24} />
        </button>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div
          className={`dashboard-radio-player${playing ? " is-playing" : ""}`}
          style={{ 
          background: "linear-gradient(135deg, #0066CC 0%, #004d99 100%)", 
          borderRadius: "24px", 
          padding: "24px", 
          color: "white", 
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 14px 28px rgba(0, 102, 204, 0.15)"
        }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100%", background: "url('/radio_background.png') center bottom / cover", opacity: 0.1 }}></div>
          <div className="dashboard-radio-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
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
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "18px", alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ 
                width: "80px", 
                height: "80px", 
                background: "white", 
                borderRadius: "22px", 
                overflow: "hidden", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 8px 16px rgba(0,0,0,0.12)"
              }}>
                <img
                  src={hasTrackCoverArt ? metadata.albumArtUrl : "/LogoSBL.svg"}
                  alt="Cover Art"
                  style={{
                    width: hasTrackCoverArt ? "100%" : "68%",
                    height: hasTrackCoverArt ? "100%" : "68%",
                    objectFit: hasTrackCoverArt ? "cover" : "contain"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  background: metadata.isOnline ? "#FF3B3B" : "rgba(255,255,255,0.2)", 
                  display: "inline-block", 
                  padding: "4px 10px", 
                  borderRadius: "8px", 
                  fontSize: "0.6rem", 
                  fontWeight: "900", 
                  marginBottom: "8px", 
                  letterSpacing: "1px",
                  textTransform: "uppercase"
                }}>
                  {metadata.isOnline ? "ON AIR" : "OFF AIR"}
                </div>
                <strong style={{ display: "block", fontSize: "1.2rem", marginBottom: "6px", fontWeight: "800", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentSlot.title}
                </strong>
                
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  {displayAnnouncer && (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", opacity: 0.9 }}>
                      <Headphones size={14} strokeWidth={2.5} />
                      <button 
                        onClick={() => onNavigate("announcers")}
                        style={{ background: "transparent", border: "none", color: "inherit", padding: 0, font: "inherit", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                      >
                        {displayAnnouncer}
                      </button>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", opacity: 0.7 }}>
                    <CalendarClock size={14} />
                    <span>{currentSlot.time.replace(/ WITA/g, '')}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", opacity: 0.8, color: "#E0F2FE" }}>
                  <Radio size={12} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {metadata.artist} - {metadata.title}
                  </span>
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={togglePlayback}
              style={{ 
                width: "56px", 
                height: "56px", 
                borderRadius: "50%", 
                background: "white", 
                color: "#0066CC", 
                border: "none", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                cursor: "pointer", 
                boxShadow: "0 8px 16px rgba(0,0,0,0.15)", 
                flexShrink: 0,
                marginLeft: "12px"
              }}
            >
              {playing ? <Pause size={28} fill="#0066CC" /> : <Play size={28} fill="#0066CC" style={{ marginLeft: "4px" }} />}
            </button>
          </div>
        </div>

        <div className="dashboard-menu-grid" style={{ marginBottom: "28px" }}>
          {visibleMenuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button 
                key={i} 
                type="button"
                onClick={() => onNavigate(item.key)}
                className="dashboard-menu-item dashboard-menu-item-colored"
                style={{ "--menu-accent": item.color } as CSSProperties}
                aria-label={`Buka menu ${item.label}`}
              >
                <div className="dashboard-menu-item-icon">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <span className="dashboard-menu-item-label">{item.label}</span>
              </button>
            )
          })}
        </div>

        {hasMoreMenu && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <button
              type="button"
              className={`dashboard-menu-more${showAllMenu ? " is-expanded" : ""}`}
              onClick={() => setShowAllMenu((current) => !current)}
              aria-label={showAllMenu ? "Sembunyikan menu tambahan" : "Tampilkan semua menu"}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "rgba(22, 101, 216, 0.1)", padding: "8px", borderRadius: "10px" }}>
                  <CalendarClock size={20} color="#1665D8" />
                </div>
                <strong style={{ fontSize: "0.95rem" }}>Jadwal Berikutnya</strong>
              </div>
              <button 
                onClick={() => onNavigate("schedule")}
                style={{ background: "transparent", border: "none", fontSize: "0.75rem", color: "#1665D8", fontWeight: 700, cursor: "pointer" }}
              >
                Lihat Semua
              </button>
            </div>
            {nextSlot ? (
              <div className="dashboard-next-card" onClick={() => onNavigate("schedule")}>
                <div className="dashboard-next-cover" aria-hidden="true">
                    <img src={nextProgramInfo?.imageUrl ?? "/LogoSBL.svg"} alt="" />
                </div>
                <div className="dashboard-next-copy">
                    <h3>{nextSlot.program}</h3>
                  <div className="dashboard-next-meta">
                      <Mic2 size={14} color="#64748B" />
                    <span>{nextSlot.announcer}</span>
                  </div>
                  <div className="dashboard-next-time">
                      <CalendarClock size={16} /> {nextSlot.day}, {nextSlot.time.replace(/ WITA/g, "")} WITA
                  </div>
                  <p>{nextProgramInfo?.description}</p>
                </div>
              </div>
            ) : (
              <div className="schedule-slot-card dashboard-schedule-card" onClick={() => onNavigate("schedule")}>
                <div className="schedule-slot-main">
                  <div className="schedule-slot-art" aria-hidden="true">
                    <img src="/LogoSBL.svg" alt="" />
                  </div>
                  <div className="schedule-slot-copy">
                    <h3>Cek Jadwal Mingguan</h3>
                    <div className="schedule-announcer">
                      <Mic2 size={14} color="#64748B" />
                      <span className="schedule-announcer-links">Penyiar belum ditentukan</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "white", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "rgba(255, 149, 0, 0.1)", padding: "8px", borderRadius: "10px" }}>
                  <Podcast size={20} color="#FF9500" />
                </div>
                <strong style={{ fontSize: "0.95rem" }}>Podcast Unggulan</strong>
              </div>
              <button 
                onClick={() => onNavigate("podcast")}
                style={{ background: "transparent", border: "none", fontSize: "0.75rem", color: "#FF9500", fontWeight: 700, cursor: "pointer" }}
              >
                Lihat Semua
              </button>
            </div>
            <div className="dashboard-podcast-list">
              {featuredPodcastEpisodes.map((episode) => (
                <article
                  key={episode.title}
                  className="podcast-episode-card dashboard-podcast-card"
                  onClick={() => onNavigate("podcast")}
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
                      onNavigate("podcast");
                    }}
                    aria-label={`Buka ${episode.title}`}
                  >
                    <Play fill="currentColor" size={16} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showProfilePopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 1000,
          display: "flex", alignItems: "flex-end"
        }} onClick={() => setShowProfilePopup(false)}>
          <div 
            style={{
              width: "100%", background: "white", borderRadius: "32px 32px 0 0",
              padding: "32px 24px 48px", display: "flex", flexDirection: "column", gap: "24px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "40px", height: "4px", background: "#E2E8F0", borderRadius: "2px", margin: "0 auto -12px" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Profil Saya</h3>
              <button onClick={() => setShowProfilePopup(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={18} color="var(--muted)" />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "#F8FAFC", borderRadius: "20px" }}>
              <img src={session.user.photoUrl || "/iconSBL.svg"} style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem" }}>{session.user.displayName}</strong>
                <small style={{ color: "var(--muted)" }}>{getRoleLabel(session.user.role)}</small>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button onClick={() => { setShowProfilePopup(false); onNavigate("profile"); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", border: "none", background: "white", borderRadius: "16px", textAlign: "left", fontSize: "0.95rem", fontWeight: 600 }}>
                <User size={20} color="#64748B" /> Edit Detail Profil
              </button>
              <button onClick={() => { if(confirm("Keluar?")) onLogout(); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", border: "none", background: "rgba(239, 68, 68, 0.05)", color: "#EF4444", borderRadius: "16px", textAlign: "left", fontSize: "0.95rem", fontWeight: 700 }}>
                <LogOut size={20} color="#EF4444" /> Keluar Sesi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
