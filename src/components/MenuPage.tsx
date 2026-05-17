import { Bell, LogIn, LogOut, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
    label: "Operasional",
    items: ["dashboard", "attendance", "schedule", "requests", "scheduleSwap"]
  },
  {
    label: "Siaran",
    items: ["streaming", "podcast", "announcers"]
  },
  {
    label: "Konten",
    items: ["aiScript", "coverage", "liveOb", "complaints"]
  },
  {
    label: "Administrasi",
    items: ["attendanceReport", "users"]
  },
  {
    label: "Sistem",
    items: ["profile"]
  }
];

const profileNavItem: NavItem = {
  key: "profile" as PageKey,
  label: "Profil",
  icon: LogIn
};

const quickActionKeys: PageKey[] = ["attendance", "scheduleSwap", "requests", "aiScript", "liveOb", "coverage"];

export function MenuPage({
  activePage,
  session,
  pendingSwaps,
  onNavigate,
  onLogout
}: MenuPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const navItems = [...primaryNav, profileNavItem];
  const allowedItems = navItems.filter(
    (item) => !item.requiredPermission || canUser(session?.user.role, item.requiredPermission)
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const quickActions = quickActionKeys
    .map((key) => allowedItems.find((item) => item.key === key))
    .filter((item): item is (typeof allowedItems)[number] => Boolean(item))
    .slice(0, 4);
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

  return (
    <main className="menu-page">
      <section className="menu-hero" aria-label="Menu lengkap Radio SBL">
        <div className="menu-hero-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Menu Lengkap</p>
            <h1>Semua fitur Radio SBL</h1>
            <p>
              Pilih fitur sesuai kebutuhan siaran, operasional, konten, dan administrasi.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="menu-profile-chip"
          onClick={() => onNavigate("profile")}
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
            placeholder="Cari fitur, jadwal, request, user..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        {quickActions.length > 0 && (
          <div className="menu-quick-actions" aria-label="Aksi cepat">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <button type="button" key={item.key} onClick={() => onNavigate(item.key)}>
                  <Icon size={18} />
                  <span>{getQuickActionLabel(item.key)}</span>
                  {item.key === "scheduleSwap" && pendingSwaps > 0 && <em>{pendingSwaps}</em>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="menu-group-stack" aria-label="Daftar menu aplikasi">
        {hasSearchResult ? (
          groupedItems.map((group) => (
            <div className="menu-group" key={group.label}>
              <h2>{group.label}</h2>
                <div className="menu-grid">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.key;

                    return (
                      <button
                        type="button"
                        key={item.key}
                        className={isActive ? "menu-tile active" : "menu-tile"}
                        onClick={() => onNavigate(item.key)}
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
            </div>
          ))
        ) : (
          <div className="menu-empty-search">
            <Search size={28} />
            <p>Tidak ada fitur yang cocok dengan pencarian itu.</p>
          </div>
        )}
      </section>

      <section className="menu-session-actions" aria-label="Aksi akun">
        <button type="button" onClick={() => onNavigate("scheduleSwap")}>
          <Bell size={18} />
          <span>Notifikasi tukar jadwal</span>
          {pendingSwaps > 0 && <em>{pendingSwaps}</em>}
        </button>
        <button type="button" onClick={session ? onLogout : () => onNavigate("login")}>
          {session ? <LogOut size={18} /> : <LogIn size={18} />}
          <span>{session ? "Keluar" : "Masuk ke akun"}</span>
        </button>
      </section>
    </main>
  );
}

function getSearchText(item: NavItem, groupLabel: string): string {
  const aliases: Partial<Record<PageKey, string>> = {
    attendance: "absen masuk pulang lokasi gps selfie hadir",
    schedule: "jadwal siaran program penyiar kalender hari ini",
    scheduleSwap: "tukar jadwal pengganti konfirmasi permintaan",
    requests: "request lagu pendengar salam putar",
    aiScript: "naskah ai script draft berita cue",
    liveOb: "ob live luar studio event",
    coverage: "liputan event dokumentasi reporter",
    attendanceReport: "rekap absen laporan kehadiran admin",
    users: "user staf role akses manajemen",
    streaming: "radio online live player siaran",
    podcast: "podcast arsip audio spotify",
    announcers: "penyiar kru profil air name",
    complaints: "aduan saran keluhan warga",
    profile: "profil akun password preferensi"
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
      return "Kelola request";
    case "aiScript":
      return "Buat naskah";
    case "liveOb":
      return "Live OB";
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
      return "Permintaan pendengar";
    case "scheduleSwap":
      return "Konfirmasi pengganti";
    case "streaming":
      return "Radio online";
    case "podcast":
      return "Arsip audio";
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
    case "attendanceReport":
      return "Rekap kehadiran";
    case "users":
      return "Role dan akses";
    case "profile":
      return "Akun dan preferensi";
    default:
      return "Fitur Radio SBL";
  }
}
