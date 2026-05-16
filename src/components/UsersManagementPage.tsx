import { useState, useEffect } from "react";
import { Users, Shield, CheckCircle, XCircle, Search, Save, RefreshCcw } from "lucide-react";
import { listUserProfiles, upsertUserProfile, syncSblStaff } from "../services/userProfile.service";
import { getRoleLabel } from "../utils/rbac";
import type { AppUser, UserRole } from "../types/domain";

const AVAILABLE_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "leader",
  "announcer",
  "reporter",
  "operator",
  "employee",
  "public"
];

export function UsersManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await listUserProfiles();
      setUsers(data);
    } catch (err) {
      console.error("Gagal memuat user:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(uid: string, newRole: UserRole) {
    setUpdatingId(uid);
    try {
      await upsertUserProfile(uid, { role: newRole });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
      setMessage("Role berhasil diperbarui.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Gagal memperbarui role.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleStatus(user: AppUser) {
    setUpdatingId(user.id);
    const newStatus = !user.active;
    try {
      await upsertUserProfile(user.id, { active: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
      setMessage(`Status user ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Gagal memperbarui status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSyncStaff() {
    if (!confirm("Sinkronkan daftar 15 personil SBL ke database?")) return;
    setSyncing(true);
    try {
      const result = await syncSblStaff();
      if (result.success) {
        setMessage(`Berhasil mensinkronkan ${result.count} personil SBL ke Firestore!`);
        loadUsers();
      } else {
        const errorMsg = result.failed && result.failed.length > 0 
          ? `Gagal mensinkronkan: ${result.failed.join(", ")}`
          : "Gagal mensinkronkan beberapa data.";
        alert(errorMsg);
        loadUsers(); // Refresh tetap untuk melihat yang berhasil
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat sinkronisasi.");
    } finally {
      setSyncing(false);
    }
  }

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="users-management-page" style={{ padding: "20px", background: "#f8f9fc", minHeight: "100vh" }}>
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Users size={28} color="var(--blue)" />
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Manajemen User</h1>
            </div>
            <p style={{ color: "var(--muted)", margin: 0 }}>Kelola hak akses dan status aktivasi personel Radio SBL.</p>
          </div>
          <button 
            onClick={handleSyncStaff} 
            disabled={syncing}
            style={{ padding: "10px 18px", borderRadius: "12px", background: "white", border: "1px solid rgba(22, 119, 237, 0.2)", color: "var(--blue)", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
          >
            <RefreshCcw size={18} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Menyinkronkan..." : "Sinkronkan Data SBL"}
          </button>
        </div>
      </header>

      {message && (
        <div style={{ background: "#11a36a", color: "white", padding: "12px 20px", borderRadius: "12px", marginBottom: "20px", fontWeight: "bold", animation: "fadeSlideUp 0.3s ease" }}>
          {message}
        </div>
      )}

      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} size={18} />
          <input 
            type="text" 
            placeholder="Cari nama atau email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "14px 14px 14px 48px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "1rem" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner-small" style={{ margin: "0 auto 12px" }}></div>
            <p>Memuat daftar user...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f3f5", textAlign: "left" }}>
                  <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 600 }}>User</th>
                  <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 600 }}>Role / Hak Akses</th>
                  <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px", color: "var(--muted)", fontWeight: 600 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img 
                          src={user.photoUrl || "/iconSBL.svg"} 
                          alt="" 
                          style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", background: "#f1f3f5" }} 
                        />
                        <div>
                          <div style={{ fontWeight: "bold", color: "var(--ink)" }}>{user.displayName}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                        disabled={updatingId === user.id}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", fontSize: "0.9rem", cursor: "pointer" }}
                      >
                        {AVAILABLE_ROLES.map(role => (
                          <option key={role} value={role}>{getRoleLabel(role)}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: user.active ? "#11a36a" : "#FF3B3B", fontWeight: "bold" }}>
                        {user.active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {user.active ? "Aktif" : "Nonaktif"}
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <button 
                        onClick={() => toggleStatus(user)}
                        disabled={updatingId === user.id}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: user.active ? "#fff0f0" : "#e7f5ef", color: user.active ? "#FF3B3B" : "#11a36a", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}
                      >
                        {user.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                User tidak ditemukan.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
