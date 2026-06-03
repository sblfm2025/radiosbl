import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef
} from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Clock3,
  Mic2,
  Radio,
  Search,
  UsersRound
} from "lucide-react";

// Components
import { Shell } from "./components/Shell";
import { AudioProvider } from "./contexts/AudioContext";
import { GlobalAudioPlayer } from "./components/GlobalAudioPlayer";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./components/DashboardPage";
import { BroadcastSchedulePage } from "./components/BroadcastSchedulePage";
import { AnnouncerProfilePage } from "./components/AnnouncerProfilePage";
import { AiScriptPage } from "./components/AiScriptPage";
import { SongRequestsPage } from "./components/SongRequestsPage";
import { LiveObPage } from "./components/LiveObPage";
import { ProfilePage } from "./components/ProfilePage";
import { ComplaintsPage } from "./components/ComplaintsPage";
import { AttendancePage } from "./components/AttendancePage";
import { StreamingPage } from "./components/StreamingPage";
import { SplashPage } from "./components/SplashPage";
import { PodcastPage as PodcastPageLegacy } from "./components/PodcastPage";
import PodcastPageNew from "./features/contentHub/pages/PodcastPage";
import { featureFlags } from "./config/featureFlags";
import { PinrangBerkabarPage } from "./components/PinrangBerkabarPage";
import { CoveragePage } from "./components/CoveragePage";
import { UsersManagementPage } from "./components/UsersManagementPage";
import { ScheduleSwapPage } from "./components/ScheduleSwapPage";
import { AttendanceReportPage } from "./components/AttendanceReportPage";
import { TutorialPage } from "./components/TutorialPage";
import { PedomanMediaPage } from "./components/PedomanMediaPage";
import StudioInboxPage from "./features/engagement/pages/StudioInboxPage";
import RundownPage from "./features/broadcastWorkflow/pages/RundownPage";
import BroadcastLogPage from "./features/broadcastWorkflow/pages/BroadcastLogPage";
import HandoverPage from "./features/broadcastWorkflow/pages/HandoverPage";
import ListenerAnalyticsPage from "./features/analytics/pages/ListenerAnalyticsPage";
import { ListenerAnalyticsTracker } from "./features/analytics/components/ListenerAnalyticsTracker";
import AuditLogPage from "./features/securityAudit/pages/AuditLogPage";
import ApprovalQueuePage from "./features/securityAudit/pages/ApprovalQueuePage";
import ProgramRecordingRulesPage from "./pages/radioboss/ProgramRecordingRulesPage";
import RecordingHistoryPage from "./pages/radioboss/RecordingHistoryPage";
import RecordingControlPage from "./pages/radioboss/RecordingControlPage";
import SongRequestReviewPage from "./pages/radioboss/SongRequestReviewPage";

// Data & Repository
import {
  announcerBreakdown,
  announcers,
  complaints,
  dailyInsertPrograms,
  directorProfile,
  dashboardStats,
  liveChecklist,
  modules,
  stationInfo,
  todayPrograms,
  weeklyBroadcastSchedule,
  type PageKey
} from "./data/radioData";
import {
  getDashboardSnapshot,
  type DashboardSnapshot
} from "./data/mockRepository";

// Services
import { getWeeklySchedule } from "./services/scheduleSlot.service";
import {
  listAttendanceRecords,
  subscribeAttendanceRecords
} from "./services/attendance.service";
import {
  resolveOnAirAttendanceRecords,
  resolveOnAirAnnouncerFromAttendance,
  resolveOnAirAnnouncersFromAttendance
} from "./services/onAir.service";
import {
  signOut,
  subscribeToSession,
  type AuthSession
} from "./services/auth.service";
import { listUserProfiles } from "./services/userProfile.service";

// Utils & Hooks
import { getAnnouncerWorkload, formatAirNameOnly } from "./utils/announcerResolver";
import type { AppUser, AttendanceRecord } from "./types/domain";
import { useCurrentBroadcastSlot } from "./hooks/useCurrentBroadcastSlot";

// Styles
import "./styles/app.css";

function getInitialPageFromUrl(): PageKey | null {
  if (typeof window === "undefined") return null;

  const page = new URLSearchParams(window.location.search).get("page");

  return isNavigablePage(page) ? page : null;
}

const navigablePages: PageKey[] = [
  "dashboard",
  "announcers",
  "announcerProfile",
  "attendance",
  "schedule",
  "streaming",
  "liveOb",
  "coverage",
  "pinrangBerkabar",
  "podcast",
  "requests",
  "studioInbox",
  "videoHub",
  "complaints",
  "aiScript",
  "users",
  "scheduleSwap",
  "attendanceReport",
  "rundown",
  "broadcastLog",
  "handover",
  "recordingControl",
  "recordingRules",
  "recordingHistory",
  "songRequestReview",
  "listenerAnalytics",
  "auditLog",
  "approvalQueue",
  "profile",
  "menu",
  "tutorial",
  "pedoman",
  "login"
];

function isNavigablePage(page: string | null): page is PageKey {
  return navigablePages.includes(page as PageKey);
}

function buildPageUrl(page: PageKey): string {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  return `${url.pathname}${url.search}${url.hash}`;
}

function toAppLocalDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatOnAirAttendanceLabel(records: AttendanceRecord[]): string {
  if (records.length === 0) {
    return "Belum absensi";
  }

  if (records.length > 1) {
    return `${records.length} penyiar sudah absensi`;
  }

  const checkInAt = toAppLocalDate(records[0].checkInAt);
  const timeLabel = checkInAt
    ? checkInAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "";

  return timeLabel ? `Sudah absensi ${timeLabel}` : "Sudah absensi";
}

function getPostLoginPageFromUrl(): PageKey {
  const requestedPage = getInitialPageFromUrl();
  return requestedPage && requestedPage !== "login" ? requestedPage : "dashboard";
}

function AnnouncersPage({
  data,
  onOpenAnnouncerProfile
}: {
  data: DashboardSnapshot;
  onOpenAnnouncerProfile: (airName: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const announcerRoster = useMemo(
    () =>
      data.announcerProfiles.map((announcer) => ({
        announcer,
        workload: getAnnouncerWorkload(announcer.airName)
      })),
    [data.announcerProfiles]
  );
  const totalSlots = announcerRoster.reduce((sum, item) => sum + item.workload.slotCount, 0);
  const totalHours = announcerRoster.reduce((sum, item) => sum + item.workload.totalHours, 0);
  const activeAnnouncers = announcerRoster.filter((item) => item.announcer.active).length;
  const spotlightAnnouncer = announcerRoster.reduce(
    (selected, item) =>
      item.workload.slotCount > selected.workload.slotCount ? item : selected,
    announcerRoster[0]
  );
  const searchNeedle = searchTerm.trim().toLowerCase();
  const filteredRoster = searchNeedle
    ? announcerRoster.filter(({ announcer, workload }) => {
        const searchable = [
          announcer.airName,
          announcer.fullName,
          ...announcer.scheduleNames,
          ...workload.days,
          ...workload.slots.flatMap((slot) => [slot.program, slot.day, slot.time])
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(searchNeedle);
      })
    : announcerRoster;
  const rosterCopy = searchNeedle
    ? `${filteredRoster.length} dari ${announcerRoster.length} penyiar cocok dengan pencarian.`
    : "Pilih kartu untuk membuka profil dan melihat slot siaran utama.";

  const firstSpotlightSlot = spotlightAnnouncer?.workload.slots[0];
  const spotlightText = firstSpotlightSlot
    ? `${firstSpotlightSlot.day}, ${firstSpotlightSlot.time}`
    : "Belum ada slot utama";

  return (
    <main className="announcers-page">
      <section className="announcers-hero" aria-label="Ringkasan penyiar Radio SBL">
        <div className="announcers-hero-copy">
          <div className="announcers-title-lockup">
            <img src="/LogoSBL.svg" alt="Radio SBL" />
            <div>
              <p className="eyebrow">Suara Pinrang, Suara Kita!</p>
              <h1>Daftar Penyiar</h1>
            </div>
          </div>
          <p>
            Kenali kru siaran Radio SBL, jadwal utama, dan beban siaran tiap penyiar
            dalam satu tampilan yang mudah dipindai.
          </p>
        </div>

        <div className="announcers-summary-grid" aria-label="Ringkasan data penyiar">
          <span>
            <UsersRound size={20} />
            <strong>{activeAnnouncers}</strong>
            Penyiar aktif
          </span>
          <span>
            <CalendarClock size={20} />
            <strong>{totalSlots}</strong>
            Slot jadwal
          </span>
          <span>
            <Radio size={20} />
            <strong>{totalHours}</strong>
            Jam siaran
          </span>
        </div>
      </section>

      <section className="announcers-command-panel" aria-label="Kontrol daftar penyiar">
        <label className="announcers-search-field">
          <Search size={18} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari penyiar, program, hari..."
            aria-label="Cari penyiar"
          />
        </label>
        <div className="announcers-focus-row" aria-label="Sorotan roster penyiar">
          <article>
            <BadgeCheck size={18} />
            <small>Roster aktif</small>
            <strong>{activeAnnouncers} penyiar siap</strong>
            <span>{rosterCopy}</span>
          </article>
          <article>
            <Clock3 size={18} />
            <small>Slot terpadat</small>
            <strong>{spotlightAnnouncer ? formatAirNameOnly(spotlightAnnouncer.announcer.airName) : "Belum ada"}</strong>
            <span>{spotlightText}</span>
          </article>
        </div>
      </section>

      <section className="announcer-grid" aria-label="Daftar profil penyiar">
        {filteredRoster.map(({ announcer, workload }) => {
          const daysText = workload.days.length > 0
            ? workload.days.join(", ")
            : "Belum ada jadwal utama";
          const firstSlot = workload.slots[0];

          return (
            <button
              type="button"
              className="announcer-card"
              key={announcer.fullName}
              onClick={() => onOpenAnnouncerProfile(announcer.airName)}
              aria-label={`Buka profil ${formatAirNameOnly(announcer.airName)}`}
            >
              <span className={`announcer-status-pill${announcer.active ? "" : " is-muted"}`}>
                {announcer.active ? "Aktif" : "Tidak aktif"}
              </span>
              <div className="announcer-photo-wrap">
                <img
                  src={announcer.photoUrl}
                  alt={`Foto ${formatAirNameOnly(announcer.airName)}`}
                  className="announcer-photo"
                />
              </div>
              <div className="announcer-card-head">
                <span aria-hidden="true">{formatAirNameOnly(announcer.airName).slice(0, 1)}</span>
                <div>
                  <strong>{formatAirNameOnly(announcer.airName)}</strong>
                  <small>Penyiar Radio SBL</small>
                </div>
                <em>#{announcer.decreeOrder}</em>
              </div>
              <div className="announcer-stats">
                <span>
                  <strong>{workload.days.length}</strong>
                  Hari
                </span>
                <span>
                  <strong>{workload.totalHours}</strong>
                  Jam
                </span>
                <span>
                  <strong>{workload.slotCount}</strong>
                  Slot
                </span>
              </div>
              <p className="announcer-days">{daysText}</p>
              <div className="announcer-next-slot">
                <CalendarClock size={15} />
                <span>
                  {firstSlot
                    ? `Mulai ${firstSlot.day}, ${firstSlot.time} WITA`
                    : "Jadwal utama belum tersedia"}
                </span>
              </div>
              <div className="slot-list">
                {workload.slots.slice(0, 3).map((slot) => (
                  <div key={`${announcer.airName}-${slot.day}-${slot.time}`}>
                    <Mic2 size={15} />
                    <span>
                      {slot.day}, {slot.time}
                    </span>
                    <strong>{slot.program}</strong>
                  </div>
                ))}
                {workload.slots.length === 0 && <p>Belum ada slot siaran utama.</p>}
              </div>
              <span className="announcer-card-action">
                Lihat profil
                <ArrowRight size={15} />
              </span>
            </button>
          );
        })}
        {filteredRoster.length === 0 && (
          <div className="announcer-empty-state">
            <Mic2 size={30} />
            <strong>Penyiar tidak ditemukan</strong>
            <p>Coba cari berdasarkan nama udara, nama lengkap, hari, atau program siaran.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("splash");
  const scrollMap = useRef<Record<string, number>>({});
  const prevPageRef = useRef<PageKey>("splash");
  const isApplyingHistoryRef = useRef(false);
  const sessionRef = useRef<AuthSession | null>(null);
  const lastManualLoginAtRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollMap.current[activePage] = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activePage]);

  useEffect(() => {
    const prevPage = prevPageRef.current;
    
    if (!window.location.hash) {
      const isReturningToAnnouncers = activePage === "announcers" && prevPage === "announcerProfile";
      if (isReturningToAnnouncers) {
        window.scrollTo({ top: scrollMap.current[activePage] || 0, behavior: "instant" });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
    
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.classList.remove("page-transition-enter");
      void rootEl.offsetWidth; 
      rootEl.classList.add("page-transition-enter");
    }

    prevPageRef.current = activePage;
  }, [activePage]);

  const [selectedAnnouncerAirName, setSelectedAnnouncerAirName] = useState("Amar");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [userProfiles, setUserProfiles] = useState<AppUser[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardSnapshot>({
    stats: dashboardStats,
    programs: todayPrograms,
    modules,
    liveChecklist,
    complaints,
    weeklySchedule: weeklyBroadcastSchedule,
    insertPrograms: dailyInsertPrograms,
    announcers: announcerBreakdown,
    announcerProfiles: announcers,
    director: directorProfile,
    station: stationInfo
  });

  const navigateToPage = useCallback((page: PageKey, options?: { replace?: boolean }) => {
    if (typeof window !== "undefined" && page !== "splash" && !isApplyingHistoryRef.current) {
      const nextUrl = buildPageUrl(page);
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (nextUrl && nextUrl !== currentUrl) {
        if (options?.replace) {
          window.history.replaceState({ page }, "", nextUrl);
        } else {
          window.history.pushState({ page }, "", nextUrl);
        }
      }
    }

    setActivePage(page);
  }, []);

  const enterAuthenticatedArea = useCallback((nextSession: AuthSession) => {
    lastManualLoginAtRef.current = Date.now();
    sessionRef.current = nextSession;
    setSession(nextSession);
    navigateToPage(getPostLoginPageFromUrl(), { replace: true });
  }, [navigateToPage]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const handlePopState = () => {
      const requestedPage = getInitialPageFromUrl();
      isApplyingHistoryRef.current = true;
      setActivePage(requestedPage || (session ? "dashboard" : "login"));
      window.setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [session]);

  useEffect(() => {
    void getDashboardSnapshot().then(async (data) => {
      try {
        const dynamicWeekly = await getWeeklySchedule();
        setDashboardData({
          ...data,
          weeklySchedule: dynamicWeekly
        });
      } catch (err) {
        console.error("Gagal sinkron data otomatis:", err);
      }
    });
  }, [session]);

  useEffect(() => {
    if (!session) {
      setAttendanceRecords([]);
      setUserProfiles([]);
      return;
    }

    const unsubscribe = subscribeAttendanceRecords(setAttendanceRecords);

    void listAttendanceRecords().then(setAttendanceRecords);
    void listUserProfiles().then(setUserProfiles);

    return () => {
      unsubscribe();
    };
  }, [session]);

  const refreshAttendanceRecords = useCallback(async () => {
    const records = await listAttendanceRecords();
    setAttendanceRecords(records);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSession((restoredSession) => {
      const requestedPage = getInitialPageFromUrl();
      if (restoredSession) {
        sessionRef.current = restoredSession;
        setSession(restoredSession);
        navigateToPage(getPostLoginPageFromUrl(), { replace: true });
      } else {
        const isLikelyStaleAuthCallback =
          sessionRef.current !== null && Date.now() - lastManualLoginAtRef.current < 5000;

        if (isLikelyStaleAuthCallback) {
          setAuthInitialized(true);
          return;
        }

        sessionRef.current = null;
        setSession(null);
        setActivePage((prev) => {
          const nextPage = requestedPage ? "login" : prev === "splash" ? prev : "login";
          if (nextPage !== "splash") {
            navigateToPage(nextPage, { replace: true });
          }
          return nextPage;
        });
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, [navigateToPage]);

  const handleLogout = useCallback(async () => {
    if (session) {
      await signOut(session.provider);
    }

    setSession(null);
    navigateToPage("login", { replace: true });
  }, [navigateToPage, session]);

  const currentSlot = useCurrentBroadcastSlot();
  const currentAnnouncer = useMemo(
    () => resolveOnAirAnnouncerFromAttendance(currentSlot, attendanceRecords, new Date(), userProfiles),
    [attendanceRecords, currentSlot, userProfiles]
  );
  const currentAnnouncers = useMemo(
    () => resolveOnAirAnnouncersFromAttendance(currentSlot, attendanceRecords, new Date(), userProfiles),
    [attendanceRecords, currentSlot, userProfiles]
  );
  const onAirAttendanceLabel = useMemo(
    () => formatOnAirAttendanceLabel(
      resolveOnAirAttendanceRecords(currentSlot, attendanceRecords, new Date(), userProfiles)
    ),
    [attendanceRecords, currentSlot, userProfiles]
  );

  const page = useMemo(() => {
    switch (activePage) {
      case "splash":
        return <SplashPage onNavigate={(targetPage) => navigateToPage(targetPage, { replace: true })} />;
      case "login":
        return (
          <LoginPage
            onEnter={enterAuthenticatedArea}
          />
        );
      case "attendance":
        return <AttendancePage data={dashboardData} session={session} onAttendanceRecorded={refreshAttendanceRecords} />;
      case "announcers":
        return (
          <AnnouncersPage
            data={dashboardData}
            onOpenAnnouncerProfile={(airName) => {
              setSelectedAnnouncerAirName(airName);
              navigateToPage("announcerProfile");
            }}
          />
        );
      case "announcerProfile":
        return (
          <AnnouncerProfilePage
            airName={selectedAnnouncerAirName}
            data={dashboardData}
            onBack={() => navigateToPage("announcers")}
          />
        );
      case "schedule":
        return (
          <BroadcastSchedulePage
            data={dashboardData}
            session={session}
            onNavigate={navigateToPage}
            onOpenAnnouncerProfile={(airName) => {
              setSelectedAnnouncerAirName(airName);
              navigateToPage("announcerProfile");
            }}
          />
        );
      case "streaming":
        return (
          <StreamingPage
            data={dashboardData}
            onAirAnnouncer={currentAnnouncer}
            onAirAnnouncers={currentAnnouncers}
            onExit={() => navigateToPage("dashboard")}
            session={session?.user || null}
          />
        );
      case "liveOb":
        return <LiveObPage data={dashboardData} />;
      case "coverage":
        return <CoveragePage />;
      case "requests":
        return <SongRequestsPage />;
      case "studioInbox":
        return <StudioInboxPage session={session} />;
      case "podcast":
        return featureFlags.contentHub ? <PodcastPageNew /> : <PodcastPageLegacy />;
      case "videoHub":
        return <PinrangBerkabarPage />;
      case "rundown":
        return featureFlags.broadcastWorkflow ? (
          <RundownPage session={session} data={dashboardData} />
        ) : session ? (
          <DashboardPage
            session={session} 
            onNavigate={navigateToPage}
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
            onAirAttendanceLabel={onAirAttendanceLabel}
          />
        ) : null;
      case "broadcastLog":
        return featureFlags.broadcastWorkflow ? (
          <BroadcastLogPage session={session} data={dashboardData} />
        ) : session ? (
          <DashboardPage
            session={session} 
            onNavigate={navigateToPage}
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
            onAirAttendanceLabel={onAirAttendanceLabel}
          />
        ) : null;
      case "handover":
        return featureFlags.broadcastWorkflow ? (
          <HandoverPage session={session} />
        ) : session ? (
          <DashboardPage
            session={session} 
            onNavigate={navigateToPage}
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
            onAirAttendanceLabel={onAirAttendanceLabel}
          />
        ) : null;
      case "recordingControl":
        return <RecordingControlPage session={session} />;
      case "recordingRules":
        return <ProgramRecordingRulesPage data={dashboardData} session={session} />;
      case "recordingHistory":
        return <RecordingHistoryPage />;
      case "songRequestReview":
        return <SongRequestReviewPage session={session} />;
      case "pinrangBerkabar":
        return <PinrangBerkabarPage />;
      case "complaints":
        return <ComplaintsPage data={dashboardData} session={session} />;
      case "aiScript":
        return <AiScriptPage data={dashboardData} session={session} />;
      case "users":
        return <UsersManagementPage />;
      case "scheduleSwap":
        return <ScheduleSwapPage session={session} />;
      case "attendanceReport":
        return <AttendanceReportPage session={session} />;
      case "listenerAnalytics":
        return featureFlags.listenerAnalytics ? (
          <ListenerAnalyticsPage session={session} />
        ) : session ? (
          <DashboardPage
            session={session} 
            onNavigate={navigateToPage}
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
            onAirAttendanceLabel={onAirAttendanceLabel}
          />
        ) : null;
      case "auditLog":
        return featureFlags.securityAuditLog ? (
          <AuditLogPage session={session} />
        ) : session ? (
          <DashboardPage
            session={session} 
            onNavigate={navigateToPage}
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
            onAirAttendanceLabel={onAirAttendanceLabel}
          />
        ) : null;
      case "approvalQueue":
        return featureFlags.securityAuditLog ? (
          <ApprovalQueuePage session={session} />
        ) : session ? (
          <DashboardPage
            session={session} 
            onNavigate={navigateToPage}
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
            onAirAttendanceLabel={onAirAttendanceLabel}
          />
        ) : null;
      case "tutorial":
        return <TutorialPage />;
      case "pedoman":
        return <PedomanMediaPage />;
      case "profile":
        return session ? (
          <ProfilePage session={session} onLogout={handleLogout} />
        ) : (
          <LoginPage
            onEnter={enterAuthenticatedArea}
          />
        );
      case "menu":
        return null;
      case "dashboard":
      default:
        return session ? (
          <DashboardPage 
            session={session} 
            onNavigate={navigateToPage}
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
            onAirAttendanceLabel={onAirAttendanceLabel}
          />
        ) : null;
    }
  }, [
    activePage,
    currentAnnouncer,
    currentAnnouncers,
    dashboardData,
    enterAuthenticatedArea,
    handleLogout,
    attendanceRecords,
    navigateToPage,
    onAirAttendanceLabel,
    refreshAttendanceRecords,
    selectedAnnouncerAirName,
    session
  ]);

  if (!authInitialized) {
    return (
      <div className="app-loading-state">
        <div className="spinner-small"></div>
      </div>
    );
  }

  const showMiniPlayer = session && !["splash", "login", "dashboard", "streaming", "podcast", "menu"].includes(activePage);

  return (
    <AudioProvider
      streamUrl={stationInfo.streamUrl}
      frequency={stationInfo.frequency}
      programTitle={currentSlot.title}
      announcer={currentAnnouncer}
    >
      {featureFlags.listenerAnalytics && (
        <ListenerAnalyticsTracker
          session={session}
          programTitle={currentSlot.title}
        />
      )}
      <Shell 
        activePage={activePage} 
        session={session} 
        onNavigate={navigateToPage}
        onLogout={handleLogout}
        hasMiniPlayer={!!showMiniPlayer}
      >
        {page}
      </Shell>
      {showMiniPlayer && (
        <GlobalAudioPlayer
          hasBottomNav={true}
          onOpenStreaming={() => navigateToPage("streaming")}
        />
      )}
    </AudioProvider>
  );
}
