import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { Mic2 } from "lucide-react";

// Components
import { Shell } from "./components/Shell";
import { AudioProvider } from "./contexts/AudioContext";
import { PageHeader } from "./components/PageHeader";
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
import { OnboardingPage } from "./components/OnboardingPage";
import { SplashPage } from "./components/SplashPage";
import { PodcastPage } from "./components/PodcastPage";
import { CoveragePage } from "./components/CoveragePage";
import { UsersManagementPage } from "./components/UsersManagementPage";
import { ScheduleSwapPage } from "./components/ScheduleSwapPage";
import { AdminVerificationPage } from "./components/AdminVerificationPage";
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
import { resolveOnAirAnnouncerFromAttendance } from "./services/onAir.service";
import {
  signOut,
  subscribeToSession,
  type AuthSession
} from "./services/auth.service";

// Utils & Hooks
import { getAnnouncerWorkload } from "./utils/announcerResolver";
import type { AttendanceRecord } from "./types/domain";
import { useCurrentBroadcastSlot } from "./hooks/useCurrentBroadcastSlot";

// Styles
import "./styles/app.css";

function AnnouncersPage({ data }: { data: DashboardSnapshot }) {
  return (
    <>
      <PageHeader
        eyebrow="Announcer Roster"
        title="Penyiar"
        description="Data penyiar Radio SBL."
      />
      <section className="announcer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
        {data.announcerProfiles.map((announcer, i) => {
          const workload = getAnnouncerWorkload(announcer.airName);

          return (
            <article className="announcer-card" key={announcer.fullName} style={{ animation: `fadeSlideUp 0.6s ease-out forwards`, animationDelay: `${i * 0.1}s`, opacity: 0, transform: "translateY(20px)" }}>
              <div className="announcer-photo-wrap" style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
                <img
                  src={announcer.photoUrl}
                  alt={`Foto ${announcer.airName}`}
                  className="announcer-photo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="announcer-card-head">
                <span>{announcer.airName.slice(0, 1)}</span>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                  <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{announcer.airName}</strong>
                  <small style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{announcer.fullName}</small>
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
              <div className="slot-list">
                {workload.slots.slice(0, 4).map((slot) => (
                  <div key={`${announcer.airName}-${slot.day}-${slot.time}`}>
                    <Mic2 size={15} />
                    <span>
                      {slot.day}, {slot.time}
                    </span>
                    <strong>{slot.program}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("splash");
  const [selectedAnnouncerAirName, setSelectedAnnouncerAirName] = useState("Amar");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
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

        // AUTO-INJECTION LOGIC UNTUK SUPER ADMIN
        if (session?.user.email === "sblfm2025@gmail.com" || session?.user.email === "sablfm2025@gmail.com" || session?.user.role === "super_admin") {
          console.log("Super Admin/Direktur terdeteksi, mulai sinkronisasi 16 staf...");
          const { syncSblStaff } = await import("./services/userProfile.service");
          const result = await syncSblStaff();
          if (result.success) {
            console.log(`Sinkronisasi ${result.count} staf selesai otomatis!`);
          }
        }
      } catch (err) {
        console.error("Gagal sinkron data otomatis:", err);
      }
    });
  }, [session]);

  useEffect(() => {
    if (!session) {
      setAttendanceRecords([]);
      return;
    }

    const unsubscribe = subscribeAttendanceRecords(setAttendanceRecords);

    void listAttendanceRecords().then(setAttendanceRecords);

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
      setSession(restoredSession);
      if (restoredSession) {
        setActivePage("dashboard");
      } else {
        setActivePage((prev) => {
          if (prev === "splash" || prev === "onboarding") return prev;
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
    () => resolveOnAirAnnouncerFromAttendance(currentSlot, attendanceRecords),
    [attendanceRecords, currentSlot]
  );

  const page = useMemo(() => {
    switch (activePage) {
      case "splash":
        return <SplashPage onNavigate={setActivePage} />;
      case "onboarding":
        return <OnboardingPage onNavigate={setActivePage} />;
      case "login":
        return (
          <LoginPage
            onEnter={(nextSession) => {
              setSession(nextSession);
              setActivePage("dashboard");
            }}
          />
        );
      case "attendance":
        return <AttendancePage data={dashboardData} session={session} onAttendanceRecorded={refreshAttendanceRecords} />;
      case "announcers":
        return <AnnouncersPage data={dashboardData} />;
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
        return <StreamingPage data={dashboardData} onAirAnnouncer={currentAnnouncer} onExit={() => setActivePage("dashboard")} />;
      case "liveOb":
        return <LiveObPage data={dashboardData} />;
      case "coverage":
        return <CoveragePage />;
      case "requests":
        return <SongRequestsPage />;
      case "podcast":
        return <PodcastPage />;
      case "complaints":
        return <ComplaintsPage data={dashboardData} />;
      case "aiScript":
        return <AiScriptPage data={dashboardData} session={session} />;
      case "users":
        return <UsersManagementPage />;
      case "scheduleSwap":
        return <ScheduleSwapPage session={session} />;
      case "adminVerification":
        return <AdminVerificationPage />;
      case "attendanceReport":
        return <AttendanceReportPage />;
      case "profile":
        return session ? (
          <ProfilePage session={session} onLogout={handleLogout} />
        ) : (
          <LoginPage
            onEnter={(nextSession) => {
              setSession(nextSession);
              setActivePage("dashboard");
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
            attendanceRecords={attendanceRecords}
          />
        ) : null;
    }
  }, [
    activePage,
    currentAnnouncer,
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

  const showMiniPlayer = session && !["splash", "onboarding", "login", "dashboard", "streaming", "podcast"].includes(activePage);

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
