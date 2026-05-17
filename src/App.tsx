import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { CalendarClock, Mic2, Radio, UsersRound } from "lucide-react";

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
import { PodcastPage } from "./components/PodcastPage";
import { CoveragePage } from "./components/CoveragePage";
import { UsersManagementPage } from "./components/UsersManagementPage";
import { ScheduleSwapPage } from "./components/ScheduleSwapPage";
import { AttendanceReportPage } from "./components/AttendanceReportPage";

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
import { getAnnouncerWorkload } from "./utils/announcerResolver";
import type { AppUser, AttendanceRecord } from "./types/domain";
import { useCurrentBroadcastSlot } from "./hooks/useCurrentBroadcastSlot";

// Styles
import "./styles/app.css";

function getInitialPageFromUrl(): PageKey | null {
  if (typeof window === "undefined") return null;

  const page = new URLSearchParams(window.location.search).get("page");
  const allowedPages: PageKey[] = [
    "dashboard",
    "announcers",
    "announcerProfile",
    "attendance",
    "schedule",
    "streaming",
    "liveOb",
    "coverage",
    "podcast",
    "requests",
    "complaints",
    "aiScript",
    "users",
    "scheduleSwap",
    "attendanceReport",
    "profile"
  ];

  return allowedPages.includes(page as PageKey) ? (page as PageKey) : null;
}

function AnnouncersPage({
  data
}: {
  data: DashboardSnapshot;
}) {
  const totalSlots = data.announcerProfiles.reduce(
    (sum, announcer) => sum + getAnnouncerWorkload(announcer.airName).slotCount,
    0
  );
  const totalHours = data.announcerProfiles.reduce(
    (sum, announcer) => sum + getAnnouncerWorkload(announcer.airName).totalHours,
    0
  );

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
            <strong>{data.announcerProfiles.length}</strong>
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

      <section className="announcer-grid" aria-label="Daftar profil penyiar">
        {data.announcerProfiles.map((announcer) => {
          const workload = getAnnouncerWorkload(announcer.airName);
          const daysText = workload.days.length > 0
            ? workload.days.join(", ")
            : "Belum ada jadwal utama";

          return (
            <div
              className="announcer-card"
              key={announcer.fullName}
            >
              <span className="announcer-status-pill">
                {announcer.active ? "Aktif" : "Tidak aktif"}
              </span>
              <div className="announcer-photo-wrap">
                <img
                  src={announcer.photoUrl}
                  alt={`Foto ${announcer.airName}`}
                  className="announcer-photo"
                />
              </div>
              <div className="announcer-card-head">
                <span aria-hidden="true">{announcer.airName.slice(0, 1)}</span>
                <div>
                  <strong>{announcer.airName}</strong>
                  <small>{announcer.fullName}</small>
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
            </div>
          );
        })}
      </section>
    </main>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("splash");
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
      setSession(restoredSession);
      if (restoredSession) {
        setActivePage(requestedPage || "dashboard");
      } else {
        setActivePage((prev) => {
          if (requestedPage) return "login";
          if (prev === "splash") return prev;
          return "login";
        });
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    if (session) {
      await signOut(session.provider);
    }

    setSession(null);
    setActivePage("login");
  }, [session]);

  const currentSlot = useCurrentBroadcastSlot();
  const currentAnnouncer = useMemo(
    () => resolveOnAirAnnouncerFromAttendance(currentSlot, attendanceRecords, new Date(), userProfiles),
    [attendanceRecords, currentSlot, userProfiles]
  );
  const currentAnnouncers = useMemo(
    () => resolveOnAirAnnouncersFromAttendance(currentSlot, attendanceRecords, new Date(), userProfiles),
    [attendanceRecords, currentSlot, userProfiles]
  );

  const page = useMemo(() => {
    switch (activePage) {
      case "splash":
        return <SplashPage onNavigate={setActivePage} />;
      case "login":
        return (
          <LoginPage
            onEnter={(nextSession) => {
              setSession(nextSession);
              setActivePage(getInitialPageFromUrl() || "dashboard");
            }}
          />
        );
      case "attendance":
        return <AttendancePage data={dashboardData} session={session} onAttendanceRecorded={refreshAttendanceRecords} />;
      case "announcers":
        return (
          <AnnouncersPage data={dashboardData} />
        );
      case "announcerProfile":
        return (
          <AnnouncerProfilePage
            airName={selectedAnnouncerAirName}
            data={dashboardData}
            onBack={() => setActivePage("announcers")}
          />
        );
      case "schedule":
        return (
          <BroadcastSchedulePage
            data={dashboardData}
            session={session}
            onOpenAnnouncerProfile={(airName) => {
              setSelectedAnnouncerAirName(airName);
              setActivePage("announcerProfile");
            }}
          />
        );
      case "streaming":
        return (
          <StreamingPage
            data={dashboardData}
            onAirAnnouncer={currentAnnouncer}
            onAirAnnouncers={currentAnnouncers}
            onExit={() => setActivePage("dashboard")}
          />
        );
      case "liveOb":
        return <LiveObPage data={dashboardData} />;
      case "coverage":
        return <CoveragePage />;
      case "requests":
        return <SongRequestsPage />;
      case "podcast":
        return <PodcastPage />;
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
      case "profile":
        return session ? (
          <ProfilePage session={session} onLogout={handleLogout} />
        ) : (
          <LoginPage
            onEnter={(nextSession) => {
              setSession(nextSession);
              setActivePage(getInitialPageFromUrl() || "dashboard");
            }}
          />
        );
      case "dashboard":
      default:
        return session ? (
          <DashboardPage 
            session={session} 
            onNavigate={setActivePage} 
            onLogout={handleLogout}
            onAirAnnouncer={currentAnnouncer} 
            onAirAnnouncers={currentAnnouncers}
            attendanceRecords={attendanceRecords}
          />
        ) : null;
    }
  }, [
    activePage,
    currentAnnouncer,
    currentAnnouncers,
    dashboardData,
    handleLogout,
    attendanceRecords,
    refreshAttendanceRecords,
    selectedAnnouncerAirName,
    session
  ]);

  if (!authInitialized) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fc" }}>
        <div className="spinner-small" style={{ borderTopColor: "#1665D8" }}></div>
      </div>
    );
  }

  const showMiniPlayer = session && !["splash", "login", "dashboard", "streaming", "podcast"].includes(activePage);

  return (
    <AudioProvider
      streamUrl={stationInfo.streamUrl}
      frequency={stationInfo.frequency}
      programTitle={currentSlot.title}
      announcer={currentAnnouncer}
    >
      <Shell 
        activePage={activePage} 
        session={session} 
        onNavigate={setActivePage} 
        onLogout={handleLogout}
        hasMiniPlayer={!!showMiniPlayer}
      >
        {page}
        {showMiniPlayer && <GlobalAudioPlayer hasBottomNav={true} />}
      </Shell>
    </AudioProvider>
  );
}
