import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Eye,
  KeyRound,
  Mic,
  RefreshCcw,
  Save,
  Search,
  Shield,
  Users,
  Video,
  X,
  XCircle
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { listUserProfiles, upsertUserProfile, syncSblStaff } from "../services/userProfile.service";
import { subscribeAttendanceRecords } from "../services/attendance.service";
import { getRoleLabel } from "../utils/rbac";
import type { AppUser, UserRole, AttendanceRecord } from "../types/domain";
import { getFirebaseAuth } from "../lib/firebase";

const AVAILABLE_ROLES: UserRole[] = [
  "super_admin", "admin", "leader", "announcer", "reporter", "operator", "employee", "public"
];

const USER_TABS = [
  { id: "all", label: "Semua User" },
  { id: "management", label: "Manajemen" },
  { id: "announcer", label: "Penyiar" },
  { id: "reporter", label: "Reporter" },
  { id: "operator", label: "Operator" },
  { id: "public", label: "Tamu/Pendengar" }
];

type Notice = { tone: "success" | "error"; text: string };
type PendingConfirmation =
  | { kind: "sync" }
  | { kind: "reset-password"; email: string };

export function UsersManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [exporting, setExporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<AppUser>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const showNotice = useCallback((text: string, tone: Notice["tone"] = "success", timeout = 3200) => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice((current) => current?.text === text ? null : current), timeout);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await listUserProfiles();
      setUsers(usersData);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      showNotice("Gagal memuat daftar user.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    loadUsers();

    const unsubscribeAttendances = subscribeAttendanceRecords((records) => {
      setAttendances(records);
    });

    return () => {
      unsubscribeAttendances();
    };
  }, [loadUsers]);

  async function handleUpdateRole(uid: string, newRole: UserRole) {
    setUpdatingId(uid);
    try {
      await upsertUserProfile(uid, { role: newRole });
      setUsers((prev) => prev.map((user) => user.id === uid ? { ...user, role: newRole } : user));
      if (selectedUser?.id === uid) setSelectedUser((prev) => prev ? { ...prev, role: newRole } : null);
      showNotice("Role berhasil diperbarui.");
    } catch {
      showNotice("Gagal memperbarui role.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleStatus(user: AppUser) {
    setUpdatingId(user.id);
    const newStatus = !user.active;
    try {
      await upsertUserProfile(user.id, { active: newStatus });
      setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, active: newStatus } : item));
      if (selectedUser?.id === user.id) setSelectedUser((prev) => prev ? { ...prev, active: newStatus } : null);
      showNotice(`Status user ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`);
    } catch {
      showNotice("Gagal memperbarui status.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  function openUserDetail(user: AppUser) {
    setSelectedUser(user);
    setEditError("");
    setEditUserForm({
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoUrl,
      airName: user.airName,
      whatsapp: user.whatsapp
    });
  }

  function closeUserDetail() {
    setSelectedUser(null);
    setEditUserForm({});
    setEditSaving(false);
    setEditError("");
  }

  function handleEditFormChange(field: keyof Partial<AppUser>, value: string) {
    setEditUserForm((prev) => ({ ...prev, [field]: value }));
  }

  function requestResetPassword() {
    if (!selectedUser?.email) return;
    setPendingConfirmation({ kind: "reset-password", email: selectedUser.email });
  }

  async function sendResetPassword(email: string) {
    setResettingPwd(true);
    setEditError("");
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      showNotice(`Tautan reset sandi terkirim ke email: ${email}`, "success", 5000);
    } catch (err: unknown) {
      setEditError("Gagal mengirim email: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setResettingPwd(false);
    }
  }

  async function handleSaveUserProfile(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setEditSaving(true);
    setEditError("");

    try {
      const payload: Partial<AppUser> = {
        displayName: editUserForm.displayName?.trim() || selectedUser.displayName,
        email: editUserForm.email?.trim() || selectedUser.email,
        photoUrl: editUserForm.photoUrl?.trim() || selectedUser.photoUrl,
        airName: editUserForm.airName?.trim() || selectedUser.airName,
        whatsapp: editUserForm.whatsapp?.trim() || selectedUser.whatsapp
      };

      await upsertUserProfile(selectedUser.id, payload);
      setUsers((prev) => prev.map((user) => user.id === selectedUser.id ? { ...user, ...payload } : user));
      setSelectedUser((prev) => prev ? { ...prev, ...payload } : null);
      showNotice("Profil user berhasil diperbarui.");
      closeUserDetail();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setEditSaving(false);
    }
  }

  async function runSyncStaff() {
    setSyncing(true);
    try {
      const result = await syncSblStaff();
      if (result.success) {
        showNotice(`Berhasil mensinkronkan ${result.count} personil SBL ke Firestore!`);
      } else {
        showNotice("Gagal mensinkronkan beberapa data.", "error");
      }
      await loadUsers();
    } catch {
      showNotice("Terjadi kesalahan sistem saat sinkronisasi.", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function confirmPendingAction() {
    const action = pendingConfirmation;
    if (!action) return;
    setPendingConfirmation(null);
    if (action.kind === "sync") {
      await runSyncStaff();
      return;
    }
    await sendResetPassword(action.email);
  }

  function handleExportCsv() {
    setExporting(true);
    try {
      const headers = ["Nama Lengkap", "Air Name", "Email", "WhatsApp", "Role", "Status Aktif", "Hadir Bulan Ini", "Izin/Sakit"];
      const rows = users.map((user) => {
        const userAttendances = attendances.filter((attendance) => attendance.userId === user.id);
        const presentCount = userAttendances.filter((attendance) => attendance.status === "present" || attendance.status === "outside_radius").length;
        const sickLeaveCount = userAttendances.filter((attendance) => attendance.status === "sick" || attendance.status === "leave").length;

        return [
          `"${user.displayName || ""}"`,
          `"${user.airName || ""}"`,
          `"${user.email || ""}"`,
          `"${user.whatsapp || ""}"`,
          `"${getRoleLabel(user.role)}"`,
          user.active ? "\"Aktif\"" : "\"Nonaktif\"",
          `"${presentCount}"`,
          `"${sickLeaveCount}"`
        ].join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Data_Staf_RadioSBL_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotice("Data Staf berhasil diekspor ke CSV.");
    } catch {
      showNotice("Gagal mengekspor data.", "error");
    } finally {
      setExporting(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase();
    const matchesSearch = (user.displayName || "").toLowerCase().includes(keyword) ||
      (user.email || "").toLowerCase().includes(keyword) ||
      (user.airName || "").toLowerCase().includes(keyword);

    if (!matchesSearch) return false;
    if (activeTab === "all") return true;
    if (activeTab === "management") return ["super_admin", "admin", "leader"].includes(user.role);
    if (activeTab === "announcer") return user.role === "announcer";
    if (activeTab === "reporter") return user.role === "reporter";
    if (activeTab === "operator") return user.role === "operator";
    if (activeTab === "public") return user.role === "public";
    return true;
  });

  const totalActive = users.filter((user) => user.active && user.role !== "public").length;
  const totalAnnouncers = users.filter((user) => user.active && user.role === "announcer").length;
  const totalReporters = users.filter((user) => user.active && user.role === "reporter").length;
  const selectedMetrics = selectedUser ? getUserAttendanceSummary(selectedUser) : null;
  const pendingConfirmationCopy = getConfirmationCopy(pendingConfirmation);

  function getUserAttendanceSummary(user: AppUser) {
    const userAttendances = attendances
      .filter((attendance) =>
        attendance.userId === user.id ||
        (attendance.displayName && attendance.displayName === user.displayName) ||
        (attendance.airName && attendance.airName === user.airName)
      )
      .sort((a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime());
    const presentCount = userAttendances.filter((attendance) => attendance.status === "present" || attendance.status === "outside_radius").length;
    const leaveCount = userAttendances.filter((attendance) => attendance.status === "sick" || attendance.status === "leave").length;
    const totalDays = presentCount + leaveCount;
    const lastCheckIn = userAttendances[0] ? new Date(userAttendances[0].checkInAt) : null;

    return {
      presentCount,
      leaveCount,
      totalDays,
      performanceScore: totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0,
      lastCheckIn,
      isOnline: Boolean(lastCheckIn && Date.now() - lastCheckIn.getTime() < 12 * 60 * 60 * 1000)
    };
  }

  function getProfileAlert(user: AppUser) {
    if (!user.whatsapp) return "Nomor WhatsApp belum diisi";
    if (!user.airName && user.role === "announcer") return "Air Name penyiar belum diisi";
    return "";
  }

  return (
    <div className="users-management-page">
      <header className="users-page-header">
        <div className="users-title-row">
          <div>
            <div className="users-title-lockup">
              <Users size={28} />
              <h1>Smart User Management</h1>
            </div>
            <p>Pusat komando SDM & Operasional Radio SBL.</p>
          </div>
          <div className="users-header-actions">
            <button type="button" onClick={handleExportCsv} disabled={exporting}>
              <Save size={18} />
              {exporting ? "Mengekspor..." : "Export CSV"}
            </button>
            <button type="button" onClick={() => setPendingConfirmation({ kind: "sync" })} disabled={syncing}>
              <RefreshCcw size={18} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Menyinkronkan..." : "Sinkronkan"}
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className={`users-notice ${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

      <section className="users-summary-grid" aria-label="Ringkasan staf">
        <SummaryCard tone="blue" label="TOTAL STAF AKTIF" value={totalActive} icon={<Users size={24} />} />
        <SummaryCard tone="amber" label="PENYIAR AKTIF" value={totalAnnouncers} icon={<Mic size={24} />} />
        <SummaryCard tone="green" label="REPORTER AKTIF" value={totalReporters} icon={<Video size={24} />} />
      </section>

      <section className="users-directory-panel">
        <div className="users-tabs" role="tablist" aria-label="Filter user">
          {USER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="users-directory-body">
          <label className="users-search-field">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari nama, air name, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          {loading ? (
            <div className="users-loading-state">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="ui-skeleton-row" key={index}>
                  <span className="ui-skeleton avatar" />
                  <span className="ui-skeleton-copy">
                    <span className="ui-skeleton line medium" />
                    <span className="ui-skeleton line short" />
                  </span>
                </div>
              ))}
              <p>Memuat daftar SDM...</p>
            </div>
          ) : (
            <>
              <div className="users-mobile-list" aria-label="Daftar user mobile">
                {filteredUsers.map((user) => renderMobileUserCard(user))}
              </div>

              <div className="users-desktop-table">
                <table>
                  <thead>
                    <tr>
                      <th>STAF</th>
                      <th>AIR NAME</th>
                      <th>ROLE</th>
                      <th>STATUS</th>
                      <th>DETAIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="users-table-person">
                            <img src={user.photoUrl || "/iconSBL.svg"} alt="" />
                            <div>
                              <strong>
                                {user.displayName}
                                {getProfileAlert(user) && <span title="Profil belum lengkap (Smart Alert)"></span>}
                              </strong>
                              <small>{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td className="users-air-name">{user.airName || "-"}</td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                            disabled={updatingId === user.id}
                            aria-label={`Ubah role ${user.displayName}`}
                          >
                            {AVAILABLE_ROLES.map((role) => (
                              <option key={role} value={role}>{getRoleLabel(role)}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`users-status ${user.active ? "active" : "inactive"}`}>
                            {user.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {user.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="users-detail-button" onClick={() => openUserDetail(user)} title="Lihat Detail Panel">
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="users-empty-state">
                    <Users size={48} />
                    <p>Tidak ada staf yang cocok dengan pencarian / tab ini.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {selectedUser && selectedMetrics && (
        <div className="users-detail-overlay">
          <aside className="users-detail-drawer" aria-label={`Detail ${selectedUser.displayName}`}>
            <div className="users-detail-hero">
              <button type="button" onClick={closeUserDetail} aria-label="Tutup detail user">
                <X size={18} />
              </button>
              <div className="users-detail-profile">
                <img src={selectedUser.photoUrl || "/iconSBL.svg"} alt="" />
                <div>
                  <h2>{selectedUser.displayName}</h2>
                  <p>{selectedUser.airName || "Tidak ada Air Name"}</p>
                  <span>{getRoleLabel(selectedUser.role)}</span>
                </div>
              </div>
            </div>

            <div className="users-detail-body">
              <h3 className="users-section-title">
                <Activity size={18} /> Performa & Kehadiran
              </h3>

              {getProfileAlert(selectedUser) && (
                <div className="users-detail-alert">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Smart Alert:</strong> Profil belum lengkap.
                    {!selectedUser.whatsapp && " Nomor WhatsApp belum diisi."}
                    {!selectedUser.airName && selectedUser.role === "announcer" && " Penyiar wajib memiliki Air Name."}
                  </div>
                </div>
              )}

              <div className="users-performance-grid">
                <article>
                  <span>KEHADIRAN & PERFORMA</span>
                  <strong>
                    {selectedMetrics.presentCount} <small>Hadir</small> / {selectedMetrics.leaveCount} <small>Izin</small>
                  </strong>
                  {selectedMetrics.totalDays > 0 && (
                    <em className={selectedMetrics.performanceScore >= 80 ? "good" : "bad"}>
                      {selectedMetrics.performanceScore}% Disiplin
                    </em>
                  )}
                </article>
                <article>
                  <span>LAST CHECK-IN</span>
                  <strong className={selectedMetrics.isOnline ? "online" : ""}>
                    {selectedMetrics.lastCheckIn
                      ? `${selectedMetrics.lastCheckIn.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ${selectedMetrics.lastCheckIn.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                      : "Belum Absen"}
                  </strong>
                  {selectedMetrics.isOnline && <em className="good">Sedang Aktif Shift</em>}
                </article>
              </div>

              <h3 className="users-section-title">
                <Shield size={18} /> Profil & Keamanan
              </h3>

              <form onSubmit={handleSaveUserProfile} className="users-edit-form">
                <label>
                  <span>Nama Lengkap</span>
                  <input type="text" value={editUserForm.displayName ?? ""} onChange={(e) => handleEditFormChange("displayName", e.target.value)} />
                </label>
                <label>
                  <span>Air Name / Nama Siaran</span>
                  <input type="text" value={editUserForm.airName ?? ""} onChange={(e) => handleEditFormChange("airName", e.target.value)} />
                </label>
                <label>
                  <span>Nomor WhatsApp</span>
                  <input type="text" value={editUserForm.whatsapp ?? ""} onChange={(e) => handleEditFormChange("whatsapp", e.target.value)} />
                </label>
                <label>
                  <span>Email Kontak</span>
                  <input type="email" value={editUserForm.email ?? ""} onChange={(e) => handleEditFormChange("email", e.target.value)} />
                </label>

                <div className="users-inline-actions">
                  <button type="button" onClick={requestResetPassword} disabled={resettingPwd}>
                    <KeyRound size={16} /> {resettingPwd ? "Mengirim..." : "Kirim Link Reset Sandi"}
                  </button>
                  <button
                    type="button"
                    className={selectedUser.active ? "danger" : "success"}
                    onClick={() => toggleStatus(selectedUser)}
                    disabled={updatingId === selectedUser.id}
                  >
                    {selectedUser.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {selectedUser.active ? "Suspend Akun" : "Aktifkan Akun"}
                  </button>
                </div>

                {editError && <div className="users-form-error">{editError}</div>}

                <div className="users-form-actions">
                  <button type="button" onClick={closeUserDetail}>Tutup</button>
                  <button type="submit" disabled={editSaving}>{editSaving ? "Menyimpan..." : "Simpan Profil"}</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {pendingConfirmationCopy && (
        <div className="users-confirm-overlay">
          <div className="users-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="users-confirm-title">
            <AlertTriangle size={28} />
            <h2 id="users-confirm-title">{pendingConfirmationCopy.title}</h2>
            <p>{pendingConfirmationCopy.description}</p>
            <div>
              <button type="button" onClick={() => setPendingConfirmation(null)}>Batal</button>
              <button type="button" onClick={confirmPendingAction}>{pendingConfirmationCopy.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderMobileUserCard(user: AppUser) {
    const summary = getUserAttendanceSummary(user);
    const profileAlert = getProfileAlert(user);

    return (
      <article key={user.id} className="users-mobile-card">
        <div className="users-mobile-head">
          <img src={user.photoUrl || "/iconSBL.svg"} alt="" />
          <div>
            <h3>{user.displayName}</h3>
            <p>{user.airName || user.email}</p>
          </div>
          <button type="button" onClick={() => openUserDetail(user)} aria-label={`Lihat detail ${user.displayName}`}>
            <Eye size={18} />
          </button>
        </div>

        {profileAlert && <div className="users-profile-alert">{profileAlert}</div>}

        <div className="users-mobile-meta">
          <span><strong>{summary.presentCount}</strong>Hadir</span>
          <span><strong>{summary.leaveCount}</strong>Izin/Sakit</span>
          <span>
            <strong>{summary.lastCheckIn ? summary.lastCheckIn.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}</strong>
            Terakhir
          </span>
        </div>

        <div className="users-mobile-actions">
          <select
            value={user.role}
            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
            disabled={updatingId === user.id}
            aria-label={`Ubah role ${user.displayName}`}
          >
            {AVAILABLE_ROLES.map((role) => (
              <option key={role} value={role}>{getRoleLabel(role)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => toggleStatus(user)}
            disabled={updatingId === user.id}
            className={user.active ? "danger" : "success"}
          >
            {user.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
            {user.active ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      </article>
    );
  }
}

function SummaryCard({
  tone,
  label,
  value,
  icon
}: {
  tone: "blue" | "amber" | "green";
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <article className={`users-summary-card ${tone}`}>
      <span>{label}</span>
      <strong>{value} {icon}</strong>
    </article>
  );
}

function getConfirmationCopy(pendingConfirmation: PendingConfirmation | null) {
  if (!pendingConfirmation) return null;
  if (pendingConfirmation.kind === "sync") {
    return {
      title: "Sinkronkan personil SBL?",
      description: "Data personil bawaan akan diselaraskan ke database. Daftar user akan dimuat ulang setelah proses selesai.",
      confirmLabel: "Sinkronkan"
    };
  }
  return {
    title: "Kirim tautan reset sandi?",
    description: `Tautan reset kata sandi akan dikirim ke ${pendingConfirmation.email}.`,
    confirmLabel: "Kirim Email"
  };
}
