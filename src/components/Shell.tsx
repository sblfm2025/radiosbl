import { Bell, LogIn, LogOut, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { bottomNav, primaryNav, type PageKey } from "../data/radioData";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import type { AuthSession } from "../services/auth.service";
import { canUser, getRoleLabel } from "../utils/rbac";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import { useGlobalAudio } from "../contexts/useGlobalAudio";

type ShellProps = {
  activePage: PageKey;
  session: AuthSession | null;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
  hasMiniPlayer?: boolean;
  children: React.ReactNode;
};

const sidebarGroups: Array<{ label: string; items: PageKey[] }> = [
  {
    label: "Utama",
    items: ["dashboard", "schedule", "streaming", "podcast", "requests"]
  },
  {
    label: "Siaran & Produksi",
    items: [
      "attendance",
      "scheduleSwap",
      "aiScript",
      "liveOb",
      "coverage",
      "announcers"
    ]
  },
  {
    label: "Manajemen",
    items: ["users", "attendanceReport", "complaints"]
  }
];

export function Shell({
  activePage,
  session,
  onNavigate,
  onLogout,
  hasMiniPlayer = false,
  children
}: ShellProps) {
  const online = useOnlineStatus();
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousNotificationCount = useRef(0);
  const hasInitializedNotification = useRef(false);
  const { playing, togglePlayback } = useGlobalAudio();
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const allowedNavItems = primaryNav.filter(
    (item) => !item.requiredPermission || canUser(session?.user.role, item.requiredPermission)
  );
  const hideNavigation =
    activePage === "splash" ||
    activePage === "login" ||
    (!session && activePage === "profile");

  const checkScroll = useCallback(() => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const scrollLeftBy = () => {
    navRef.current?.scrollBy({ left: -150, behavior: "smooth" });
  };

  const scrollRightBy = () => {
    navRef.current?.scrollBy({ left: 150, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => checkScroll();
    const timer = setTimeout(handleScroll, 200);
    window.addEventListener("resize", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleScroll);
    };
  }, [checkScroll]);

  useEffect(() => {
    if (!session || session.provider !== "firebase") return;
    
    const db = getFirebaseFirestore();
    const q = query(
      collection(db, "schedule_swaps"),
      where("targetAnnouncerId", "==", session.user.id),
      where("status", "==", "pending_target")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingSwaps(snap.size);
    });

    return () => {
      unsub();
    };
  }, [session]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/notifikasi.mp3");
      audioRef.current.preload = "auto";
    }
  }, []);

  useEffect(() => {
    if (!session || audioPermissionGranted) return;
    setShowAudioPrompt(true);
  }, [session, audioPermissionGranted]);

  const handleAllowAudio = async () => {
    try {
      await togglePlayback();
    } catch {
      // User gesture completed; we still treat this as permission granted.
    }
    setAudioPermissionGranted(true);
    setShowAudioPrompt(false);
  };

  useEffect(() => {
    if (!session) return;

    const count = pendingSwaps;
    if (hasInitializedNotification.current && previousNotificationCount.current === 0 && count > 0) {
      void audioRef.current?.play().catch(() => {});
    }

    previousNotificationCount.current = count;
    hasInitializedNotification.current = true;
  }, [pendingSwaps, session]);

  useEffect(() => {
    if (navRef.current) {
      const activeBtn = navRef.current.querySelector("button.active") as HTMLElement;
      if (activeBtn) {
        const container = navRef.current;
        const scrollLeft = activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
        window.setTimeout(checkScroll, 260);
      }
    }
  }, [activePage, checkScroll]);

  return (
    <div className={`app-shell app-shell-${activePage}${hasMiniPlayer ? " has-mini-player" : ""}${hideNavigation ? " no-sidebar" : ""}`}>
      {hideNavigation ? null : (
        <aside className="sidebar">
          <button className="brand-lockup" onClick={() => onNavigate("dashboard")}
          >
            <img src="/LogoSBL.svg" alt="Logo Radio Suara Bumi Lasinrang" />
            <span>
              <strong>Radio SBL</strong>
              <small>Suara Pinrang</small>
            </span>
          </button>
          <nav className="side-nav" aria-label="Navigasi utama">
          {sidebarGroups.map((group) => {
            const groupItems = group.items
              .map((key) => allowedNavItems.find((item) => item.key === key))
              .filter((item): item is (typeof allowedNavItems)[number] => Boolean(item));

            if (groupItems.length === 0) {
              return null;
            }

            return (
              <div className="side-nav-group" key={group.label}>
                <span className="side-nav-heading">{group.label}</span>
                <div className="side-nav-items">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.key || (activePage === "announcerProfile" && item.key === "schedule");

                    return (
                      <button
                        key={item.key}
                        className={isActive ? "active" : ""}
                        onClick={() => onNavigate(item.key)}
                        style={{ position: 'relative' }}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                        {item.key === "scheduleSwap" && pendingSwaps > 0 && (
                          <em className="side-nav-badge danger">
                            {pendingSwaps}
                          </em>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className={`connection-pill ${online ? "online" : "offline"}`}>
          <span />
          {online ? "Online" : "Offline mode"}
        </div>
        <div className="session-card">            <button
              type="button"
              className="notification-button"
              onClick={() => session && onNavigate("scheduleSwap")}
              aria-label="Buka notifikasi pertukaran jadwal"
              style={{ position: "relative", marginRight: "12px", background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <Bell size={20} />
              {(session && pendingSwaps > 0) && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", borderRadius: "999px", background: "#FF3B3B", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800 }}>
                  {pendingSwaps}
                </span>
              )}
            </button>          <button className="session-user" onClick={() => onNavigate("profile")}>
            <span className="session-avatar" aria-hidden="true">
              {session?.user.photoUrl ? (
                <img src={session.user.photoUrl} alt="" />
              ) : (
                session?.user.displayName.slice(0, 1) ?? "S"
              )}
            </span>
            <div className="session-user-meta">
              <strong style={{ fontSize: "0.9rem", color: "var(--ink)" }}>{session?.user.displayName ?? "Studio SBL"}</strong>
              <small style={{ fontSize: "0.75rem", color: "var(--blue)", fontWeight: "bold" }}>
                {session ? getRoleLabel(session.user.role) : "Tamu / Umum"}
              </small>
            </div>
          </button>
          <button className="login-switch" onClick={session ? onLogout : () => onNavigate("login")}>
            {session ? <LogOut size={18} /> : <LogIn size={18} />}
            {session ? "Keluar" : "Login page"}
          </button>
        </div>
      </aside>)}

      <main className={`content content-${activePage}`}>
        {showAudioPrompt && !hideNavigation && (
          <div style={{
            position: "fixed",
            bottom: hasMiniPlayer ? "140px" : "80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "400px",
            background: "rgba(22, 119, 237, 0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "white",
            padding: "16px",
            borderRadius: "20px",
            boxShadow: "0 12px 32px rgba(22, 119, 237, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            zIndex: 100,
            animation: "slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <style>
              {`
                @keyframes slideUpFade {
                  from { opacity: 0; transform: translate(-50%, 20px); }
                  to { opacity: 1; transform: translate(-50%, 0); }
                }
              `}
            </style>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "14px", padding: "12px", display: "flex", flexShrink: 0 }}>
              <Volume2 size={24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: "4px" }}>Izinkan Suara Sistem</strong>
              <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.9, lineHeight: 1.4 }}>
                Aktifkan audio untuk mendengar notifikasi pertukaran jadwal siaran.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
              <button 
                type="button" 
                onClick={handleAllowAudio}
                style={{ background: "white", color: "var(--blue)", border: "none", padding: "8px 16px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
              >
                Izinkan
              </button>
              <button
                type="button"
                onClick={() => setShowAudioPrompt(false)}
                style={{ background: "transparent", color: "rgba(255,255,255,0.8)", border: "none", fontSize: "0.75rem", cursor: "pointer", padding: "4px 8px" }}
              >
                Nanti
              </button>
            </div>
          </div>
        )}
        {children}
      </main>

      {hideNavigation ? null : (
        <div className={`bottom-nav-container${hasMiniPlayer ? " has-mini-player" : ""}`}>
          <button 
            onClick={scrollLeftBy}
            className={`bottom-nav-hint left${canScrollLeft ? " visible" : ""}`}
            type="button"
            aria-label="Geser menu ke kiri"
          >
          <ChevronLeft size={28} />
        </button>
        <nav 
          className="bottom-nav" 
          aria-label="Navigasi mobile" 
          ref={navRef} 
          onScroll={checkScroll}
          onTouchMove={checkScroll}
          onTouchEnd={checkScroll}
        >
          {bottomNav.filter(item => !item.requiredPermission || canUser(session?.user.role, item.requiredPermission)).map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key || (activePage === "announcerProfile" && item.key === "schedule");
            return (
              <button
                key={item.key}
                className={isActive ? "active" : ""}
                onClick={() => onNavigate(item.key)}
                aria-label={item.label}
              >
                <div style={{ position: 'relative' }}>
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                  {item.key === "scheduleSwap" && pendingSwaps > 0 && (
                    <span style={{ position: 'absolute', right: '-8px', top: '-4px', background: '#FF3B3B', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px', border: '2px solid white' }}>
                      {pendingSwaps}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button 
          onClick={scrollRightBy}
          className={`bottom-nav-hint right${canScrollRight ? " visible" : ""}`}
          type="button"
          aria-label="Geser menu ke kanan"
        >
          <ChevronRight size={28} />
        </button>
      </div>
      )}
    </div>
  );
}
