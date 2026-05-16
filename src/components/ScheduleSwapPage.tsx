import { useState, useEffect, useMemo } from "react";
import { ArrowLeftRight, Clock, User, CheckCircle2, XCircle, Send, AlertCircle, Calendar } from "lucide-react";
import { createSwapRequest, getMySwapRequests, updateSwapStatus } from "../services/scheduleSwap.service";
import { listUserProfiles } from "../services/userProfile.service";
import type { AuthSession } from "../services/auth.service";
import type { ScheduleSwapRequest, AppUser, BroadcastProgramSlot } from "../types/domain";
import { weeklyBroadcastSchedule } from "../data/radioData";

export function ScheduleSwapPage({ session }: { session: AuthSession | null }) {
  const [swaps, setSwaps] = useState<ScheduleSwapRequest[]>([]);
  const [announcers, setAnnouncers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Form State
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [targetAnnouncerId, setTargetAnnouncerId] = useState("");
  const [reason, setReason] = useState("");

  // Filter jadwal milik penyiar yang sedang login
  const mySlots = useMemo(() => {
    if (!session) return [];
    // Dalam simulasi ini kita cari berdasarkan nama udara atau manual. 
    // Di produksi kita filter berdasarkan userId.
    return weeklyBroadcastSchedule.filter(slot => 
      slot.announcer.toLowerCase().includes(session.user.displayName.toLowerCase()) ||
      (session.user.airName && slot.announcer.includes(session.user.airName))
    );
  }, [session]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    setLoading(true);
    try {
      const [swapData, userData] = await Promise.all([
        getMySwapRequests(session!.user.id),
        listUserProfiles()
      ]);
      setSwaps(swapData);
      setAnnouncers(userData.filter(u => u.id !== session!.user.id && (u.role === "announcer" || u.role === "admin")));
    } catch (err) {
      console.error("Gagal memuat data swap:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlotKey || !targetAnnouncerId || !reason) return;

    setSubmitting(true);
    try {
      const [day, time, program] = selectedSlotKey.split("|");
      await createSwapRequest({
        scheduleId: selectedSlotKey, // Menggunakan key sebagai ID sementara
        requesterId: session!.user.id,
        targetAnnouncerId,
        reason
      });
      setMessage("Permintaan tukar jadwal berhasil dikirim!");
      setSelectedSlotKey("");
      setTargetAnnouncerId("");
      setReason("");
      loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Gagal mengirim permintaan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResponse(swapId: string, approve: boolean) {
    try {
      await updateSwapStatus(swapId, approve ? "pending_admin" : "rejected");
      loadData();
      setMessage(approve ? "Anda menyetujui pertukaran. Menunggu verifikasi admin." : "Pertukaran ditolak.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Gagal menanggapi permintaan.");
    }
  }

  return (
    <div className="schedule-swap-page" style={{ padding: "20px", background: "#f8f9fc", minHeight: "100vh", paddingBottom: "100px" }}>
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{ background: "var(--blue)", padding: "10px", borderRadius: "12px", color: "white" }}>
            <ArrowLeftRight size={24} />
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Tukar Jadwal</h1>
        </div>
        <p style={{ color: "var(--muted)", margin: 0 }}>Ajukan atau tanggapi permintaan pertukaran jam siaran.</p>
      </header>

      {message && (
        <div style={{ background: "#11a36a", color: "white", padding: "14px 20px", borderRadius: "16px", marginBottom: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={20} /> {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        
        {/* Form Pengajuan */}
        <section style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Send size={18} color="var(--blue)" /> Ajukan Pertukaran
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Pilih Jadwal Anda</label>
              <select 
                value={selectedSlotKey} 
                onChange={(e) => setSelectedSlotKey(e.target.value)}
                required
                style={{ padding: "14px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", outline: "none" }}
              >
                <option value="">-- Pilih Jam Siaran --</option>
                {mySlots.map((slot, i) => (
                  <option key={i} value={`${slot.day}|${slot.time}|${slot.program}`}>
                    {slot.day} • {slot.time} • {slot.program}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Pilih Penyiar Pengganti</label>
              <select 
                value={targetAnnouncerId} 
                onChange={(e) => setTargetAnnouncerId(e.target.value)}
                required
                style={{ padding: "14px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", outline: "none" }}
              >
                <option value="">-- Pilih Rekan Penyiar --</option>
                {announcers.map(ann => (
                  <option key={ann.id} value={ann.id}>{ann.airName || ann.displayName}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Alasan Pertukaran</label>
              <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Berikan alasan mengapa Anda butuh pertukaran..."
                required
                rows={3}
                style={{ padding: "14px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", outline: "none", resize: "none" }}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting || mySlots.length === 0}
              style={{ padding: "16px", borderRadius: "99px", background: "var(--blue)", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 8px 16px rgba(22, 119, 237, 0.2)" }}
            >
              {submitting ? "Mengirim..." : "Kirim Permintaan Tukar"}
            </button>
            {mySlots.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "#FF3B3B", textAlign: "center", margin: 0 }}>Anda belum terdaftar di jadwal siaran tetap.</p>
            )}
          </form>
        </section>

        {/* Daftar Permintaan */}
        <section style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} color="var(--blue)" /> Riwayat & Permintaan Masuk
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "32px" }}><div className="spinner-small" style={{ margin: "auto" }}></div></div>
          ) : swaps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              <AlertCircle size={32} style={{ marginBottom: "12px", opacity: 0.3 }} />
              <p>Belum ada aktivitas pertukaran jadwal.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {swaps.map((swap) => {
                const isIncoming = swap.targetAnnouncerId === session?.user.id;
                const targetAnnouncer = announcers.find(a => a.id === swap.targetAnnouncerId);
                const requester = announcers.find(a => a.id === swap.requesterId);

                return (
                  <article key={swap.id} style={{ padding: "16px", borderRadius: "16px", border: "1px solid #f1f3f5", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "bold", background: isIncoming ? "#e7f5ef" : "#f1f3f5", color: isIncoming ? "#11a36a" : "var(--muted)", padding: "4px 10px", borderRadius: "99px" }}>
                        {isIncoming ? "PERMINTAAN MASUK" : "PENGAJUAN SAYA"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{swap.status.replace("_", " ").toUpperCase()}</span>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                      <Calendar size={18} color="var(--blue)" />
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{swap.scheduleId.split("|").join(" • ")}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{isIncoming ? `Dari: ${requester?.displayName || "Penyiar"}` : `Target: ${targetAnnouncer?.airName || "Penyiar"}`}</div>
                      </div>
                    </div>

                    <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "var(--ink)", background: "#f8f9fc", padding: "10px", borderRadius: "8px", fontStyle: "italic" }}>
                      "{swap.reason}"
                    </p>

                    {isIncoming && swap.status === "pending_target" && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button 
                          onClick={() => handleResponse(swap.id, true)}
                          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "#11a36a", color: "white", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Setujui
                        </button>
                        <button 
                          onClick={() => handleResponse(swap.id, false)}
                          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #FF3B3B", background: "white", color: "#FF3B3B", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
