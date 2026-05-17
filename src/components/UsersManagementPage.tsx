import { useState, useEffect, type FormEvent } from "react";
import { Users, Shield, CheckCircle, XCircle, Search, Save, RefreshCcw, KeyRound, Mic, RadioTower, Video, ChevronRight, Activity, CalendarClock, Eye } from "lucide-react";
import { listUserProfiles, upsertUserProfile, syncSblStaff } from "../services/userProfile.service";
import { subscribeAttendanceRecords } from "../services/attendance.service";
import { getRoleLabel } from "../utils/rbac";
import type { AppUser, UserRole, AttendanceRecord } from "../types/domain";
import { getFirebaseAuth } from "../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const AVAILABLE_ROLES: UserRole[] = [
  "super_admin", "admin", "leader", "announcer", "reporter", "operator", "employee", "public"
];

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
  const [message, setMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);

  useEffect(() => { 
    loadUsers();
    
    // Subscribe ke data absensi secara realtime
    const unsubscribeAttendances = subscribeAttendanceRecords((records) => {
      setAttendances(records);
    });
    
    return () => {
      unsubscribeAttendances();
    };
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const usersData = await listUserProfiles();
      setUsers(usersData);
    } catch (err) { console.error("Gagal memuat data:", err); }
    finally { setLoading(false); }
  }

  async function handleUpdateRole(uid: string, newRole: UserRole) {
    setUpdatingId(uid);
    try {
      await upsertUserProfile(uid, { role: newRole });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
      if (selectedUser?.id === uid) setSelectedUser(prev => prev ? {...prev, role: newRole} : null);
      setMessage("Role berhasil diperbarui.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { alert("Gagal memperbarui role."); }
    finally { setUpdatingId(null); }
  }

  async function toggleStatus(user: AppUser) {
    setUpdatingId(user.id);
    const newStatus = !user.active;
    try {
      await upsertUserProfile(user.id, { active: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? {...prev, active: newStatus} : null);
      setMessage(`Status user ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { alert("Gagal memperbarui status."); }
    finally { setUpdatingId(null); }
  }

  function openUserDetail(user: AppUser) {
    setSelectedUser(user);
    setEditError("");
    setEditUserForm({
      displayName: user.displayName, email: user.email, photoUrl: user.photoUrl,
      airName: user.airName, whatsapp: user.whatsapp
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

  async function handleSendResetPassword() {
    if (!selectedUser || !selectedUser.email) return;
    if (!confirm(`Kirim tautan reset kata sandi ke ${selectedUser.email}?`)) return;
    setResettingPwd(true);
    setEditError("");
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, selectedUser.email);
      setMessage(`Tautan reset sandi terkirim ke email: ${selectedUser.email}`);
      setTimeout(() => setMessage(""), 5000);
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
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, ...payload } : user
        )
      );
      setSelectedUser(prev => prev ? {...prev, ...payload} : null);
      setMessage("Profil user berhasil diperbarui.");
      setTimeout(() => setMessage(""), 3000);
      closeUserDetail();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleSyncStaff() {
    if (!confirm("Sinkronkan daftar personil SBL ke database?")) return;
    setSyncing(true);
    try {
      const result = await syncSblStaff();
      if (result.success) {
        setMessage(`Berhasil mensinkronkan ${result.count} personil SBL ke Firestore!`);
        loadUsers();
      } else {
        alert("Gagal mensinkronkan beberapa data.");
        loadUsers();
      }
    } catch (err) { alert("Terjadi kesalahan sistem saat sinkronisasi."); }
    finally { setSyncing(false); }
  }

  function handleExportCsv() {
    setExporting(true);
    try {
      const headers = ["Nama Lengkap", "Air Name", "Email", "WhatsApp", "Role", "Status Aktif", "Hadir Bulan Ini", "Izin/Sakit"];
      const rows = users.map(u => {
        const uAttendances = attendances.filter(a => a.userId === u.id);
        const presentCount = uAttendances.filter(a => a.status === "present" || a.status === "outside_radius").length;
        const sickLeaveCount = uAttendances.filter(a => a.status === "sick" || a.status === "leave").length;
        
        return [
          `"${u.displayName || ""}"`,
          `"${u.airName || ""}"`,
          `"${u.email || ""}"`,
          `"${u.whatsapp || ""}"`,
          `"${getRoleLabel(u.role)}"`,
          u.active ? '"Aktif"' : '"Nonaktif"',
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
      
      setMessage("Data Staf berhasil diekspor ke CSV.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Gagal mengekspor data.");
    } finally {
      setExporting(false);
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          (u.airName && u.airName.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (activeTab === "all") return true;
    if (activeTab === "management") return ["super_admin", "admin", "leader"].includes(u.role);
    if (activeTab === "announcer") return u.role === "announcer";
    if (activeTab === "reporter") return u.role === "reporter";
    if (activeTab === "operator") return u.role === "operator";
    if (activeTab === "public") return u.role === "public";
    return true;
  });

  // Analytics
  const totalActive = users.filter(u => u.active && u.role !== "public").length;
  const totalAnnouncers = users.filter(u => u.active && u.role === "announcer").length;
  const totalReporters = users.filter(u => u.active && u.role === "reporter").length;

  return (
    <div className="users-management-page" style={{ padding: "20px", background: "#f8f9fc", minHeight: "100vh" }}>
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Users size={28} color="var(--blue)" />
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Smart User Management</h1>
            </div>
            <p style={{ color: "var(--muted)", margin: 0 }}>Pusat komando SDM & Operasional Radio SBL.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={handleExportCsv} 
              disabled={exporting}
              style={{ padding: "10px 16px", borderRadius: "12px", background: "white", border: "1px solid rgba(0, 0, 0, 0.1)", color: "var(--ink)", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
            >
              <Save size={18} />
              {exporting ? "Mengekspor..." : "Export CSV"}
            </button>
            <button 
              onClick={handleSyncStaff} 
              disabled={syncing}
              style={{ padding: "10px 16px", borderRadius: "12px", background: "white", border: "1px solid rgba(22, 119, 237, 0.2)", color: "var(--blue)", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
            >
              <RefreshCcw size={18} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Menyinkronkan..." : "Sinkronkan"}
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div style={{ background: "#11a36a", color: "white", padding: "12px 20px", borderRadius: "12px", marginBottom: "20px", fontWeight: "bold", animation: "fadeSlideUp 0.3s ease" }}>
          {message}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", borderLeft: "4px solid var(--blue)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>TOTAL STAF AKTIF</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--ink)", display: "flex", alignItems: "center", gap: "10px" }}>
            {totalActive} <Users size={24} color="var(--blue)" opacity={0.5} />
          </div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", borderLeft: "4px solid #f59e0b", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>PENYIAR AKTIF</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--ink)", display: "flex", alignItems: "center", gap: "10px" }}>
            {totalAnnouncers} <Mic size={24} color="#f59e0b" opacity={0.5} />
          </div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", borderLeft: "4px solid #10b981", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>REPORTER AKTIF</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--ink)", display: "flex", alignItems: "center", gap: "10px" }}>
            {totalReporters} <Video size={24} color="#10b981" opacity={0.5} />
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        
        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f3f5", overflowX: "auto" }}>
           {[
             { id: "all", label: "Semua User" },
             { id: "management", label: "Manajemen" },
             { id: "announcer", label: "Penyiar" },
             { id: "reporter", label: "Reporter" },
             { id: "operator", label: "Operator" },
             { id: "public", label: "Tamu/Pendengar" }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               style={{
                 padding: "16px 24px", background: "transparent", border: "none", cursor: "pointer",
                 borderBottom: activeTab === tab.id ? "3px solid var(--blue)" : "3px solid transparent",
                 color: activeTab === tab.id ? "var(--blue)" : "var(--muted)",
                 fontWeight: activeTab === tab.id ? 800 : 600,
                 fontSize: "0.95rem", whiteSpace: "nowrap", transition: "all 0.2s"
               }}
             >
               {tab.label}
             </button>
           ))}
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} size={18} />
            <input 
              type="text" 
              placeholder="Cari nama, air name, atau email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "14px 14px 14px 48px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem" }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner-small" style={{ margin: "0 auto 12px" }}></div>
              <p>Memuat daftar SDM...</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f3f5", textAlign: "left" }}>
                    <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 700, fontSize: "0.85rem" }}>STAF</th>
                    <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 700, fontSize: "0.85rem" }}>AIR NAME</th>
                    <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 700, fontSize: "0.85rem" }}>ROLE</th>
                    <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 700, fontSize: "0.85rem" }}>STATUS</th>
                    <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 700, fontSize: "0.85rem", textAlign: "center" }}>DETAIL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #f1f3f5", transition: "background 0.2s" }} onMouseOver={e=>e.currentTarget.style.background="#f8f9fc"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding: "16px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img 
                            src={user.photoUrl || "/iconSBL.svg"} 
                            alt="" 
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", background: "#f1f3f5" }} 
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                              {user.displayName}
                              {(!user.whatsapp || (!user.airName && user.role === "announcer")) && (
                                <span style={{ width: "8px", height: "8px", background: "#FF3B3B", borderRadius: "50%", display: "inline-block" }} title="Profil belum lengkap (Smart Alert)"></span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--blue)" }}>
                        {user.airName || "-"}
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                          disabled={updatingId === user.id}
                          style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}
                        >
                          {AVAILABLE_ROLES.map(role => (
                            <option key={role} value={role}>{getRoleLabel(role)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: user.active ? "#11a36a" : "#FF3B3B", fontWeight: 800 }}>
                          {user.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {user.active ? "Aktif" : "Nonaktif"}
                        </div>
                      </td>
                      <td style={{ padding: "16px 12px", textAlign: "center" }}>
                        <button
                          onClick={() => openUserDetail(user)}
                          style={{ background: "rgba(22, 119, 237, 0.1)", border: "none", color: "var(--blue)", width: "36px", height: "36px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.1s" }}
                          title="Lihat Detail Panel"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
                  <Users size={48} opacity={0.2} style={{ marginBottom: "12px" }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada staf yang cocok dengan pencarian / tab ini.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SIDE PANEL DETAIL / MODAL */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "480px", height: "100%", overflowY: "auto", boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", animation: "slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <style>
              {`
                @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              `}
            </style>
            
            {/* Header Panel */}
            <div style={{ background: "var(--blue)", color: "white", padding: "32px 24px", position: "relative" }}>
              <button onClick={closeUserDetail} style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
              
              <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "10px" }}>
                <img 
                  src={selectedUser.photoUrl || "/iconSBL.svg"} 
                  alt="" 
                  style={{ width: "80px", height: "80px", borderRadius: "24px", objectFit: "cover", background: "white", border: "4px solid rgba(255,255,255,0.2)" }} 
                />
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800 }}>{selectedUser.displayName}</h2>
                  <p style={{ margin: "0 0 8px", fontSize: "0.95rem", opacity: 0.9 }}>{selectedUser.airName || "Tidak ada Air Name"}</p>
                  <span style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 800 }}>
                    {getRoleLabel(selectedUser.role)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px", flex: 1 }}>
              
              {/* Absensi / Performa Summary */}
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 16px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} color="var(--blue)" /> Performa & Kehadiran
              </h3>
              {(() => {
                // Perbaiki logika pencocokan UID atau Nama Udara karena kadang UID Auth lokal & remote berbeda
                const userAttendances = attendances.filter(a => 
                  a.userId === selectedUser.id || 
                  (a.displayName && a.displayName === selectedUser.displayName) ||
                  (a.airName && a.airName === selectedUser.airName)
                );
                
                // Urutkan dari yang terbaru
                userAttendances.sort((a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime());
                
                const presentCount = userAttendances.filter(a => a.status === "present" || a.status === "outside_radius").length;
                const sickLeaveCount = userAttendances.filter(a => a.status === "sick" || a.status === "leave").length;
                const totalDays = presentCount + sickLeaveCount;
                const performanceScore = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
                
                // Ambil data pertama (terbaru)
                const lastCheckIn = userAttendances.length > 0 ? new Date(userAttendances[0].checkInAt) : null;
                const isOnline = lastCheckIn && (Date.now() - lastCheckIn.getTime() < 12 * 60 * 60 * 1000); // 12 jam terakhir dianggap aktif hari ini
                
                return (
                  <>
                    {(!selectedUser.whatsapp || (!selectedUser.airName && selectedUser.role === "announcer")) && (
                      <div style={{ background: "#fff4f4", border: "1px solid #ffd1d1", color: "#d92d20", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                        <div>
                          <strong>Smart Alert:</strong> Profil belum lengkap. 
                          {!selectedUser.whatsapp && " Nomor WhatsApp belum diisi."}
                          {(!selectedUser.airName && selectedUser.role === "announcer") && " Penyiar wajib memiliki Air Name."}
                        </div>
                      </div>
                    )}
                  
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
                      <div style={{ background: "#f8f9fc", padding: "16px", borderRadius: "16px", position: "relative", overflow: "hidden" }}>
                        <div style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>KEHADIRAN & PERFORMA</div>
                        <div style={{ color: "var(--ink)", fontWeight: 800, fontSize: "1.1rem", marginBottom: "4px" }}>
                          {presentCount} <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Hadir</span> • {sickLeaveCount} <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Izin</span>
                        </div>
                        {totalDays > 0 && (
                          <div style={{ display: "inline-block", background: performanceScore >= 80 ? "#e7f5ef" : "#fff0f0", color: performanceScore >= 80 ? "#11a36a" : "#FF3B3B", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                            {performanceScore}% Disiplin
                          </div>
                        )}
                      </div>
                      <div style={{ background: "#f8f9fc", padding: "16px", borderRadius: "16px" }}>
                        <div style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>LAST CHECK-IN</div>
                        <div style={{ color: isOnline ? "#11a36a" : "var(--ink)", fontWeight: 800, fontSize: "0.95rem" }}>
                          {lastCheckIn ? lastCheckIn.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + " " + lastCheckIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "Belum Absen"}
                        </div>
                        {isOnline && <div style={{ fontSize: "0.75rem", color: "#11a36a", fontWeight: 700, marginTop: "4px" }}>Sedang Aktif Shift</div>}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Form Edit */}
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 16px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} color="var(--blue)" /> Profil & Keamanan
              </h3>
              
              <form onSubmit={handleSaveUserProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>Nama Lengkap</label>
                  <input type="text" value={editUserForm.displayName ?? ""} onChange={(e) => handleEditFormChange("displayName", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", fontSize: "0.95rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>Air Name / Nama Siaran</label>
                  <input type="text" value={editUserForm.airName ?? ""} onChange={(e) => handleEditFormChange("airName", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", fontSize: "0.95rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>Nomor WhatsApp</label>
                  <input type="text" value={editUserForm.whatsapp ?? ""} onChange={(e) => handleEditFormChange("whatsapp", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", fontSize: "0.95rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>Email Kontak</label>
                  <input type="email" value={editUserForm.email ?? ""} onChange={(e) => handleEditFormChange("email", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", fontSize: "0.95rem" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <button type="button" onClick={handleSendResetPassword} disabled={resettingPwd} style={{ background: "transparent", border: "none", color: "var(--coral)", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <KeyRound size={16} /> {resettingPwd ? "Mengirim..." : "Kirim Link Reset Sandi"}
                  </button>
                  <button type="button" onClick={() => toggleStatus(selectedUser)} disabled={updatingId === selectedUser.id} style={{ background: "transparent", border: "none", color: selectedUser.active ? "#FF3B3B" : "#11a36a", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    {selectedUser.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {selectedUser.active ? "Suspend Akun" : "Aktifkan Akun"}
                  </button>
                </div>

                {editError && <div style={{ color: "#d92d20", fontSize: "0.85rem", fontWeight: 600 }}>{editError}</div>}
                
                <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #f1f3f5", display: "flex", gap: "12px" }}>
                  <button type="button" onClick={closeUserDetail} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "white", fontWeight: 800, color: "var(--ink)", cursor: "pointer" }}>Tutup</button>
                  <button type="submit" disabled={editSaving} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "var(--blue)", fontWeight: 800, color: "white", cursor: "pointer" }}>{editSaving ? "Menyimpan..." : "Simpan Profil"}</button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
