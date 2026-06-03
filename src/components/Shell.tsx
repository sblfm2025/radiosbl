import { Bell, LogIn, LogOut, ChevronLeft, ChevronRight, Volume2, User, Wifi, WifiOff } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { bottomNav, primaryNav, type NavItem, type PageKey } from "../data/radioData";
import { MenuPage } from "./MenuPage";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import type { AuthSession } from "../services/auth.service";
import { canUser, getRoleLabel } from "../utils/rbac";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import { useGlobalAudio } from "../contexts/useGlobalAudio";
import { getScheduleSwapQueryAliasesForUser } from "../services/scheduleSwap.service";
import { featureFlags } from "../config/featureFlags";

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
    label: "Beranda",
    items: ["dashboard"]
  },
  {
    label: "Kehadiran & Jadwal",
    items: ["attendance", "schedule", "scheduleSwap"]
  },
  {
    label: "Request & Inbox",
    items: ["songRequestReview", "requests", "studioInbox", "complaints"]
  },
  {
    label: "RadioBOSS",
    items: ["recordingControl", "recordingRules", "recordingHistory"]
  },
  {
    label: "Siaran",
    items: ["rundown", "broadcastLog", "handover", "aiScript", "streaming", "podcast"]
  },
  {
    label: "Konten & Liputan",
    items: ["pinrangBerkabar", "coverage", "liveOb"]
  },
  {
    label: "Tim & Administrasi",
    items: ["announcers", "attendanceReport", "users", "listenerAnalytics", "auditLog", "approvalQueue"]
  },
  {
    label: "Akun & Bantuan",
    items: ["profile", "tutorial", "pedoman"]
  }
];

const AUDIO_PERMISSION_ACCEPTED_KEY = "audio_permission_accepted";
const AUDIO_PERMISSION_DISMISSED_KEY = "audio_permission_dismissed";

function isFeaturePageEnabled(page: PageKey): boolean {
  if (page === "studioInbox") return featureFlags.listenerEngagement;
  if (page === "podcast") return featureFlags.contentHub;
  if (page === "rundown" || page === "broadcastLog" || page === "handover") {
    return featureFlags.broadcastWorkflow;
  }
  if (page === "listenerAnalytics") return featureFlags.listenerAnalytics;
  if (page === "auditLog" || page === "approvalQueue") return featureFlags.securityAuditLog;
  return true;
}

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
  const { togglePlayback } = useGlobalAudio();
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const profileNavItem: NavItem = {
    key: "profile" as PageKey,
    label: "Profil",
    icon: User
  };
  const shellNavItems = [...primaryNav, profileNavItem];
  const ConnectionIcon = online ? Wifi : WifiOff;
  const connectionLabel = online ? "Sinkron aktif" : "Mode offline";
  const connectionDescription = online ? "Data studio tersambung" : "Data lokal tetap bisa dibuka";
  const allowedNavItems = shellNavItems.filter(
    (item) =>
      isFeaturePageEnabled(item.key) &&
      (!item.requiredPermission || canUser(session?.user.role, item.requiredPermission))
  );
  const allowedBottomNavItems = bottomNav.filter(
    (item) =>
      isFeaturePageEnabled(item.key) &&
      (!item.requiredPermission || canUser(session?.user.role, item.requiredPermission))
  );
  const isDirectNavActive = useCallback((item: NavItem) => (
    activePage === item.key || (activePage === "announcerProfile" && item.key === "schedule")
  ), [activePage]);
  const isBottomNavActive = useCallback((item: NavItem) => {
    if (isDirectNavActive(item)) return true;
    if (item.key !== "menu") return false;
    return !allowedBottomNavItems.some((navItem) => isDirectNavActive(navItem));
  }, [allowedBottomNavItems, isDirectNavActive]);
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
    const aliases = getScheduleSwapQueryAliasesForUser(session.user).slice(0, 8);
    const counts = new Map<string, number>();
    let isMounted = true;

    const refreshLegacyRequests = async () => {
      const legacySnaps = await Promise.allSettled(
        aliases.map((alias) =>
          getDocs(query(
            collection(db, "schedule_swaps"),
            where("targetAnnouncerId", "==", alias)
          ))
        )
      );

      if (!isMounted) return;

      legacySnaps.forEach((result) => {
        if (result.status !== "fulfilled") {
          console.warn("Gagal memuat notifikasi tukar jadwal lama:", result.reason);
          return;
        }

        result.value.forEach((item) => {
          if (item.data().status === "pending_target") {
            counts.set(item.id, 1);
          }
        });
      });

      setPendingSwaps(counts.size);
    };

    const unsubscribers = aliases.map((alias) => {
      const q = query(
        collection(db, "schedule_swaps"),
        where("targetAnnouncerAliases", "array-contains", alias)
      );

      return onSnapshot(
        q,
        (snap) => {
          snap.docChanges().forEach((change) => {
            const status = change.doc.data().status;
            if (change.type === "removed" || status !== "pending_target") {
              counts.delete(change.doc.id);
            } else {
              counts.set(change.doc.id, 1);
            }
          });
          setPendingSwaps(counts.size);
        },
        (err) => {
          console.warn("Gagal memuat notifikasi tukar jadwal:", err);
        }
      );
    });

    void refreshLegacyRequests();

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [session]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/notifikasi.mp3");
      audioRef.current.preload = "auto";
    }
  }, []);

  useEffect(() => {
    if (!session || hideNavigation || audioPermissionGranted) {
      setShowAudioPrompt(false);
      return;
    }

    const alreadyAccepted = window.localStorage.getItem(AUDIO_PERMISSION_ACCEPTED_KEY) === "true";
    const alreadyDismissed = window.localStorage.getItem(AUDIO_PERMISSION_DISMISSED_KEY) === "true";

    if (alreadyAccepted) {
      setAudioPermissionGranted(true);
      setShowAudioPrompt(false);
      return;
    }

    if (alreadyDismissed) {
      setShowAudioPrompt(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowAudioPrompt(true);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [audioPermissionGranted, hideNavigation, session]);

  const handleAllowAudio = async () => {
    try {
      await togglePlayback();
    } catch {
      // User gesture completed; we still treat this as permission granted.
    }
    window.localStorage.setItem(AUDIO_PERMISSION_ACCEPTED_KEY, "true");
    window.localStorage.removeItem(AUDIO_PERMISSION_DISMISSED_KEY);
    setAudioPermissionGranted(true);
    setShowAudioPrompt(false);
  };

  const handleDismissAudioPrompt = () => {
    window.localStorage.setItem(AUDIO_PERMISSION_DISMISSED_KEY, "true");
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

  useEffect(() => {
    if (!session || hideNavigation || activePage === "menu") return;

    try {
      const storageKey = `radiosbl.recentPages:${session.user.id}`;
      const existing = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as unknown;
      const list = Array.isArray(existing) ? existing.filter((item): item is PageKey => typeof item === "string") : [];
      const next = [activePage, ...list.filter((item) => item !== activePage)].slice(0, 6);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Recent navigation is a convenience; keep the shell usable if storage is blocked.
    }
  }, [activePage, hideNavigation, session]);

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
                    const isActive = isDirectNavActive(item);

                    return (
                      <button
                        key={item.key}
                        onClick={() => onNavigate(item.key)}
                        className={`shell-nav-button${isActive ? " active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
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
        <div
          className={`connection-pill ${online ? "online" : "offline"}`}
          role="status"
          aria-live="polite"
          title={`${connectionLabel}: ${connectionDescription}`}
        >
          <span className="connection-dot" aria-hidden="true" />
          <ConnectionIcon size={15} aria-hidden="true" />
          <span className="connection-copy">
            <strong>{connectionLabel}</strong>
            <small>{connectionDescription}</small>
          </span>
        </div>
        <div className="session-card">
          <button
              type="button"
              className="dashboard-notification-button shell-notification-button"
              onClick={() => session && onNavigate("scheduleSwap")}
              aria-label="Buka notifikasi pertukaran jadwal"
            >
              <Bell size={20} />
              {(session && pendingSwaps > 0) && (
                <span className="shell-notification-badge">
                  {pendingSwaps}
                </span>
              )}
            </button>
          <button className="session-user" onClick={() => onNavigate("profile")}>
            <span className="session-avatar" aria-hidden="true">
              {session?.user.photoUrl ? (
                <img src={session.user.photoUrl} alt="" />
              ) : (
                session?.user.displayName.slice(0, 1) ?? "S"
              )}
            </span>
            <div className="session-user-meta">
              <strong>{session?.user.displayName ?? "Studio SBL"}</strong>
              <small>
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

      <main className={`content content-${activePage}${hasMiniPlayer ? " has-mini-player" : ""}`}>
        {!hideNavigation && !online && (
          <div className="shell-offline-strip" role="status" aria-live="polite">
            <WifiOff size={18} aria-hidden="true" />
            <span>
              <strong>Mode offline</strong>
              <small>Beberapa data akan sinkron saat koneksi kembali.</small>
            </span>
          </div>
        )}
        {showAudioPrompt && !hideNavigation && (
          <div className={`shell-audio-prompt${hasMiniPlayer ? " with-mini-player" : ""}`}>
            <div className="shell-audio-prompt-icon">
              <Volume2 size={20} color="white" />
            </div>
            <div className="shell-audio-prompt-copy">
              <strong>Aktifkan suara notifikasi</strong>
              <p>Notifikasi siaran dan jadwal akan terdengar.</p>
            </div>
            <div className="shell-audio-prompt-actions">
              <button 
                type="button" 
                onClick={handleAllowAudio}
                className="shell-audio-primary"
              >
                Izinkan
              </button>
              <button
                type="button"
                onClick={handleDismissAudioPrompt}
                className="shell-audio-secondary"
              >
                Nanti saja
              </button>
            </div>
          </div>
        )}
        {activePage === "menu" ? (
          <MenuPage
            activePage={activePage}
            session={session}
            pendingSwaps={pendingSwaps}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        ) : children}
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
          {allowedBottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isBottomNavActive(item);
            const isDirectActive = isDirectNavActive(item);
            return (
              <button
                key={item.key}
                className={isActive ? "active" : ""}
                onClick={() => onNavigate(item.key)}
                aria-label={item.label}
                aria-current={isDirectActive ? "page" : undefined}
              >
                <div className="shell-bottom-nav-icon">
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                  {(item.key === "scheduleSwap" || item.key === "menu") && pendingSwaps > 0 && (
                    <span className="shell-bottom-nav-badge">
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
