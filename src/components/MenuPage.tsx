import { Bell, Clock3, LogIn, LogOut, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { primaryNav, type NavItem, type PageKey } from "../data/radioData";
import type { AuthSession } from "../services/auth.service";
import { canUser, getRoleLabel } from "../utils/rbac";

type MenuPageProps = {
  activePage: PageKey;
  session: AuthSession | null;
  pendingSwaps: number;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
};

const menuGroups: Array<{ label: string; items: PageKey[] }> = [
  {
    label: "Beranda",
    items: ["dashboard"]
  },
  {
    label: "Kehadiran & Jadwal",
    items: ["attendance", "schedule", "scheduleSwap"]
  },
  {
    label: "Interaksi Pendengar",
    items: ["requests", "studioInbox", "complaints"]
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
    label: "Akun",
    items: ["profile"]
  },
  {
    label: "Bantuan & Informasi",
    items: ["tutorial", "pedoman"]
  }
];

const profileNavItem: NavItem = {
  key: "profile" as PageKey,
  label: "Profil",
  icon: LogIn
};

const quickActionKeys: PageKey[] = ["attendance", "requests", "schedule", "aiScript", "scheduleSwap", "pinrangBerkabar", "liveOb", "coverage"];

export function MenuPage({
  activePage,
  session,
  pendingSwaps,
  onNavigate,
  onLogout
}: MenuPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentPages, setRecentPages] = useState<PageKey[]>([]);
  const navItems = [...primaryNav, profileNavItem];
  const allowedItems = navItems.filter(
    (item) => !item.requiredPermission || canUser(session?.user.role, item.requiredPermission)
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const quickActions = quickActionKeys
    .map((key) => allowedItems.find((item) => item.key === key))
    .filter((item): item is (typeof allowedItems)[number] => Boolean(item))
    .slice(0, 4);
  const recentItems = useMemo(() => (
    recentPages
      .map((key) => allowedItems.find((item) => item.key === key))
      .filter((item): item is (typeof allowedItems)[number] => Boolean(item))
      .filter((item) => item.key !== "profile")
      .slice(0, 5)
  ), [allowedItems, recentPages]);
  const groupedItems = useMemo(
    () =>
      menuGroups
        .map((group) => {
          const items = group.items
            .map((key) => allowedItems.find((item) => item.key === key))
            .filter((item): item is (typeof allowedItems)[number] => Boolean(item))
            .filter((item) => {
              if (!normalizedSearch) {
                return true;
              }

              return getSearchText(item, group.label).includes(normalizedSearch);
            });

          return { ...group, items };
        })
        .filter((group) => group.items.length > 0),
    [allowedItems, normalizedSearch]
  );
  const hasSearchResult = groupedItems.length > 0;

  useEffect(() => {
    if (!session) return;

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
  }, [session]);

  function handleNavigate(page: PageKey) {
    try {
      if (session && page !== "menu") {
        const storageKey = `radiosbl.recentPages:${session.user.id}`;
        const existing = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as unknown;
        const list = Array.isArray(existing) ? existing.filter((item): item is PageKey => typeof item === "string") : [];
        const next = [page, ...list.filter((item) => item !== page)].slice(0, 6);
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        setRecentPages(next);
      }
    } catch {
      // Recent navigation is optional and should not block movement.
    }

    onNavigate(page);
  }

  return (
    <main className="menu-page">
      <section className="menu-hero" aria-label="Menu lengkap Radio SBL">
        <div className="menu-hero-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Menu Lengkap</p>
            <h1>Semua fitur Radio SBL</h1>
            <p>
              Fitur disusun berdasarkan alur kerja: jadwal, request pendengar, RadioBOSS, siaran, konten, dan administrasi.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="menu-profile-chip"
          onClick={() => handleNavigate("profile")}
        >
          <span className="session-avatar" aria-hidden="true">
            {session?.user.photoUrl ? (
              <img src={session.user.photoUrl} alt="" />
            ) : (
              session?.user.displayName.slice(0, 1) ?? "S"
            )}
          </span>
          <span>
            <strong>{session?.user.displayName ?? "Studio SBL"}</strong>
            <small>{session ? getRoleLabel(session.user.role) : "Tamu / Umum"}</small>
          </span>
        </button>
      </section>

      <section className="menu-quick-panel" aria-label="Pencarian dan aksi cepat">
        <label className="menu-search-field">
          <Search size={18} />
          <input
            type="search"
            placeholder="Cari fitur, jadwal, request, rekaman, user..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        {quickActions.length > 0 && (
          <div className="menu-quick-actions" aria-label="Aksi cepat">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <button type="button" key={item.key} onClick={() => handleNavigate(item.key)}>
                  <Icon size={18} />
                  <span>{getQuickActionLabel(item.key)}</span>
                  {item.key === "scheduleSwap" && pendingSwaps > 0 && <em>{pendingSwaps}</em>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {recentItems.length > 0 && !normalizedSearch && (
        <section className="menu-recent-panel" aria-label="Halaman terakhir dipakai">
          <div>
            <Clock3 size={18} />
            <span>
              <strong>Terakhir dipakai</strong>
              <small>Lanjutkan pekerjaan tanpa mencari ulang.</small>
            </span>
          </div>
          <div className="menu-recent-actions">
            {recentItems.map((item) => {
              const Icon = item.icon;

              return (
                <button type="button" key={item.key} onClick={() => handleNavigate(item.key)}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="menu-group-stack" aria-label="Daftar menu aplikasi">
        {hasSearchResult ? (
          groupedItems.map((group) => (
            <details 
              className="menu-group" 
              key={group.label}
              open={Boolean(normalizedSearch) || isGroupOpenByDefault(group.label, session?.user.role)}
            >
              <summary>
                <h2>{group.label}</h2>
              </summary>
                <div className="menu-grid">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.key;

                    return (
                      <button
                        type="button"
                        key={item.key}
                        className={isActive ? "menu-tile active" : "menu-tile"}
                        onClick={() => handleNavigate(item.key)}
                      >
                        <span className="menu-tile-icon">
                          <Icon size={21} />
                          {item.key === "scheduleSwap" && pendingSwaps > 0 && (
                            <em>{pendingSwaps}</em>
                          )}
                        </span>
                        <span>
                          <strong>{item.label}</strong>
                          <small>{getMenuDescription(item.key)}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
            </details>
          ))
        ) : (
          <div className="menu-empty-search">
            <Search size={28} />
            <p>Tidak ada fitur yang cocok dengan pencarian itu.</p>
          </div>
        )}
      </section>

      <section className="menu-session-actions" aria-label="Aksi akun">
        <button type="button" onClick={() => handleNavigate("scheduleSwap")}>
          <Bell size={18} />
          <span>Notifikasi tukar jadwal</span>
          {pendingSwaps > 0 && <em>{pendingSwaps}</em>}
        </button>
        <button type="button" onClick={session ? onLogout : () => onNavigate("login")}>
          {session ? <LogOut size={18} /> : <LogIn size={18} />}
          <span>{session ? "Keluar" : "Masuk ke akun"}</span>
        </button>
      </section>

      <div style={{ textAlign: "center", padding: "32px 20px 16px", marginTop: "12px", color: "var(--color-text-muted)" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.5px" }}>Developed by <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>MAROA Project</span></p>
        <p style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>&copy; {new Date().getFullYear()} LPPL Radio Suara Bumi Lasinrang</p>
      </div>
    </main>
  );
}

function getSearchText(item: NavItem, groupLabel: string): string {
  const aliases: Partial<Record<PageKey, string>> = {
    attendance: "absen masuk pulang lokasi gps selfie hadir",
    schedule: "jadwal siaran program penyiar kalender hari ini",
    scheduleSwap: "tukar jadwal pengganti konfirmasi permintaan",
    requests: "request pendengar salam lagu umum publik",
    aiScript: "naskah ai script draft berita cue",
    liveOb: "ob live luar studio event",
    coverage: "liputan event dokumentasi reporter",
    attendanceReport: "rekap absen laporan kehadiran admin",
    users: "user staf role akses manajemen",
    streaming: "radio online live player siaran",
    podcast: "podcast arsip audio spotify",
    pinrangBerkabar: "video youtube pinrang berkabar playlist kabar berita",
    announcers: "penyiar kru profil air name",
    complaints: "aduan saran keluhan warga",
    profile: "profil akun password preferensi",
    tutorial: "tutorial panduan bantuan faq help troubleshooting",
    pedoman: "pedoman media siber aturan kebijakan privasi",
    recordingControl: "radioboss kontrol rekaman manual command queue start stop skip retry",
    recordingRules: "radioboss rekaman rules auto recording program gateway",
    recordingHistory: "radioboss rekaman history file path gateway arsip"
  };

  return [
    groupLabel,
    item.label,
    getMenuDescription(item.key),
    aliases[item.key] ?? ""
  ].join(" ").toLowerCase();
}

function getQuickActionLabel(key: PageKey): string {
  switch (key) {
    case "attendance":
      return "Absen sekarang";
    case "scheduleSwap":
      return "Cek tukar jadwal";
    case "requests":
      return "Request pendengar";
    case "aiScript":
      return "Buat naskah";
    case "liveOb":
      return "Live OB";
    case "pinrangBerkabar":
      return "Video Pinrang";
    case "coverage":
      return "Agenda liputan";
    default:
      return "Buka fitur";
  }
}

function getMenuDescription(key: PageKey): string {
  switch (key) {
    case "dashboard":
      return "Ringkasan hari ini";
    case "schedule":
      return "Program dan penyiar";
    case "attendance":
      return "Absen dan lokasi";
    case "requests":
      return "Form request pendengar";
    case "scheduleSwap":
      return "Konfirmasi pengganti";
    case "streaming":
      return "Radio online";
    case "podcast":
      return "Arsip audio";
    case "pinrangBerkabar":
      return "Video YouTube";
    case "announcers":
      return "Profil kru siaran";
    case "aiScript":
      return "Draft naskah siaran";
    case "coverage":
      return "Agenda liputan";
    case "liveOb":
      return "Live luar studio";
    case "complaints":
      return "Aduan dan saran";
    case "studioInbox":
      return "Moderasi interaksi";
    case "rundown":
      return "Susunan segmen siaran";
    case "broadcastLog":
      return "Catatan siaran selesai";
    case "handover":
      return "Serah terima shift";
    case "listenerAnalytics":
      return "Analitik pendengar";
    case "auditLog":
      return "Riwayat keamanan";
    case "approvalQueue":
      return "Persetujuan sensitif";
    case "attendanceReport":
      return "Rekap kehadiran";
    case "users":
      return "Role dan akses";
    case "profile":
      return "Akun dan preferensi";
    case "tutorial":
      return "Panduan penggunaan aplikasi";
    case "pedoman":
      return "Aturan dan kebijakan privasi";
    case "recordingRules":
      return "Aturan rekaman program";
    case "recordingControl":
      return "Start/stop rekaman";
    case "recordingHistory":
      return "Riwayat file rekaman";
    default:
      return "Fitur Radio SBL";
  }
}

function isGroupOpenByDefault(label: string, role?: string): boolean {
  if (label === "Beranda") return true;
  if (label === "Kehadiran & Jadwal") return true;
  if (label === "Interaksi Pendengar") return true;
  if (label === "RadioBOSS") return role === "admin" || role === "super_admin" || role === "operator";
  if (label === "Siaran") return true;
  if (label === "Konten & Liputan") return role === "reporter" || role === "leader";
  if (label === "Tim & Administrasi") return role === "admin" || role === "super_admin";
  if (label === "Akun") return false;
  if (label === "Bantuan & Informasi") return false;
  return false;
}
