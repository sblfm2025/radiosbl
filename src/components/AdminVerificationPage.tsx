import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, ArrowLeftRight, ShieldCheck, AlertCircle } from "lucide-react";
import { getPendingSwapsForAdmin, updateSwapStatus } from "../services/scheduleSwap.service";
import { listUserProfiles } from "../services/userProfile.service";
import type { ScheduleSwapRequest, AppUser } from "../types/domain";

export function AdminVerificationPage() {
  const [swaps, setSwaps] = useState<ScheduleSwapRequest[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [swapData, userData] = await Promise.all([
        getPendingSwapsForAdmin(),
        listUserProfiles()
      ]);
      setSwaps(swapData);
      setUsers(userData);
    } catch (err) {
      console.error("Gagal memuat data verifikasi:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(swapId: string, approve: boolean) {
    setProcessingId(swapId);
    try {
      await updateSwapStatus(swapId, approve ? "approved" : "rejected");
      setSwaps(prev => prev.filter(s => s.id !== swapId));
      setMessage(approve ? "Pertukaran jadwal telah DISAHKAN." : "Pertukaran jadwal DITOLAK.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Gagal memproses verifikasi.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="admin-verification-page" style={{ padding: "20px", background: "#f8f9fc", minHeight: "100vh" }}>
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{ background: "var(--blue)", padding: "10px", borderRadius: "12px", color: "white" }}>
            <ShieldCheck size={24} />
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Verifikasi Admin</h1>
        </div>
        <p style={{ color: "var(--muted)", margin: 0 }}>Validasi permintaan pertukaran jadwal yang telah disetujui antar penyiar.</p>
      </header>

      {message && (
        <div style={{ background: "#11a36a", color: "white", padding: "14px 20px", borderRadius: "16px", marginBottom: "24px", fontWeight: "bold", animation: "fadeSlideUp 0.3s ease" }}>
          {message}
        </div>
      )}

      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}><div className="spinner-small" style={{ margin: "auto" }}></div></div>
        ) : swaps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
            <CheckCircle size={48} style={{ marginBottom: "16px", opacity: 0.2, color: "#11a36a" }} />
            <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>Semua permintaan sudah diproses. Kerja bagus!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {swaps.map((swap) => {
              const requester = users.find(u => u.id === swap.requesterId);
              const target = users.find(u => u.id === swap.targetAnnouncerId);
              
              return (
                <div key={swap.id} style={{ padding: "20px", borderRadius: "20px", border: "1px solid #f1f3f5", background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--blue)", fontWeight: "bold" }}>
                      <Clock size={18} />
                      <span>Menunggu Pengesahan Admin</span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>ID: {swap.id.slice(0,8)}</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ flex: 1, minWidth: "200px", padding: "16px", background: "#f8f9fc", borderRadius: "16px" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>Jadwal Asli</div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--ink)" }}>{swap.scheduleId.split("|").join(" • ")}</div>
                      <div style={{ marginTop: "4px", fontSize: "0.9rem", color: "var(--blue)" }}>Penyiar: {requester?.displayName}</div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ArrowLeftRight size={24} color="var(--muted)" />
                    </div>

                    <div style={{ flex: 1, minWidth: "200px", padding: "16px", background: "rgba(17, 163, 106, 0.05)", borderRadius: "16px", border: "1px solid rgba(17, 163, 106, 0.1)" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>Penyiar Pengganti</div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "#11a36a" }}>{target?.airName || target?.displayName}</div>
                      <div style={{ marginTop: "4px", fontSize: "0.9rem", color: "var(--muted)" }}>Status: Bersedia Menggantikan</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Alasan Pertukaran:</div>
                    <p style={{ margin: 0, padding: "12px", background: "#fff9f0", borderLeft: "4px solid #f59e0b", color: "#92400e", borderRadius: "4px 12px 12px 4px", fontSize: "0.9rem" }}>
                      "{swap.reason}"
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button 
                      onClick={() => handleAction(swap.id, true)}
                      disabled={processingId === swap.id}
                      style={{ flex: 2, padding: "14px", borderRadius: "12px", border: "none", background: "var(--blue)", color: "white", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      {processingId === swap.id ? "Memproses..." : <><CheckCircle size={18} /> Sahkan Pertukaran</>}
                    </button>
                    <button 
                      onClick={() => handleAction(swap.id, false)}
                      disabled={processingId === swap.id}
                      style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid #FF3B3B", background: "white", color: "#FF3B3B", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <XCircle size={18} /> Tolak
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
