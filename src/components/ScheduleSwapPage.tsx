import { useState, useEffect, useMemo, useCallback } from "react";
import { Clock, CheckCircle2, Send, AlertCircle, Calendar } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { createSwapRequest, getMySwapRequests, updateSwapStatus } from "../services/scheduleSwap.service";
import { listUserProfiles } from "../services/userProfile.service";
import type { AuthSession } from "../services/auth.service";
import type { ScheduleSwapRequest, AppUser } from "../types/domain";
import { announcers as localAnnouncers, weeklyBroadcastSchedule } from "../data/radioData";
import { findAnnouncerProfile } from "../utils/announcerResolver";

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

  const extractWaNumber = (value: string | undefined) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (!digits) return null;
    // radioData.ts id announcer = nomor WA tanpa 0 depan (contoh: 085397286112)
    // kalau digits diawali 0, buang leading 0
    return digits.replace(/^0+/, "");
  };

  // Filter jadwal milik penyiar yang sedang login
  const mySlots = useMemo(() => {
    if (!session) return [];

    const profile = findAnnouncerProfile(session.user.airName || session.user.displayName || "");
    const candidateNames = new Set<string>();

    if (profile?.airName) candidateNames.add(profile.airName.toLowerCase());
    if (profile?.fullName) candidateNames.add(profile.fullName.toLowerCase());
    if (session.user.displayName) candidateNames.add(session.user.displayName.toLowerCase());
    if (session.user.airName) candidateNames.add(session.user.airName.toLowerCase());

    const fromWhatsapp = extractWaNumber(session.user.whatsapp);
    if (fromWhatsapp) {
      const local = localAnnouncers.find((a) => a.id === fromWhatsapp);
      if (local?.airName) candidateNames.add(local.airName.toLowerCase());
    }

    if (candidateNames.size === 0) return [];

    return weeklyBroadcastSchedule.filter((slot) => {
      const slotText = slot.announcer.toLowerCase();
      return Array.from(candidateNames).some((needle) => needle && slotText.includes(needle));
    });
  }, [session]);

  const loadData = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [swapData, userData] = await Promise.all([
        getMySwapRequests(session.user.id).catch((err) => {
          console.error("Gagal memuat data swap (fallback ke kosong):", err);
          return [] as ScheduleSwapRequest[];
        }),
        listUserProfiles().catch((err) => {
          console.error("Gagal memuat profil user (fallback ke announcers lokal):", err);
          return [] as AppUser[];
        })
      ]);
      setSwaps(swapData);

      const filtered = userData.filter((user) => {
        return user.role === "announcer" && user.id !== session.user.id && user.active;
      });

      // Kalau Firestore/local profile tidak menghasilkan kandidat, fallback ke announcers lokal
      if (filtered.length > 0) {
        setAnnouncers(filtered);
      } else {
        setAnnouncers(
          localAnnouncers
            .filter((a) => a.id !== session.user.id && a.active)
            .map((a) => {
              const waId = `wa-${a.id}`;
              return {
                id: waId,
                email: `${a.id}@radiosbl.com`,
                displayName: a.fullName,
                role: "announcer" as const,
                airName: a.airName,
                announcerNames: a.scheduleNames,
                photoUrl: a.photoUrl,
                whatsapp: a.id,
                active: a.active,
                employeeId: undefined
              };
            })
        );
      }
    } catch (err) {
      console.error("Gagal memuat data swap:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !selectedSlotKey || !targetAnnouncerId || !reason) return;

    setSubmitting(true);
    try {
      await createSwapRequest({
        scheduleId: selectedSlotKey, // Menggunakan key sebagai ID sementara
        requesterId: session.user.id,
        targetAnnouncerId,
        reason
      });
      setMessage("Permintaan tukar jadwal berhasil dikirim!");
      setSelectedSlotKey("");
      setTargetAnnouncerId("");
      setReason("");
      await loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch {
      alert("Gagal mengirim permintaan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResponse(swapId: string, approve: boolean) {
    try {
      await updateSwapStatus(swapId, approve ? "approved" : "rejected");
      await loadData();
      setMessage(approve ? "Penyiar setuju. Jadwal otomatis diperbarui." : "Pertukaran ditolak.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      alert("Gagal menanggapi permintaan.");
    }
  }

  return (
    <div className="schedule-swap-page" style={{ padding: "20px", background: "#f8f9fc", minHeight: "100vh", paddingBottom: "100px" }}>
      <PageHeader
        eyebrow="Tukar Jadwal"
        title="Pengajuan Jadwal Siaran"
        description="Ajukan permintaan pengganti slot siaran dan tanggapi permintaan masuk dari rekan penyiar."
      />

      {message && (
        <div style={{ background: "#11a36a", color: "white", padding: "14px 20px", borderRadius: "16px", marginBottom: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={20} /> {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
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
              {announcers.length === 0 && (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
                  Daftar penyiar pengganti belum tersedia. Periksa kembali data profil atau hubungi admin.
                </p>
              )}
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
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {swap.status === "pending_target"
                          ? "Menunggu Konfirmasi Anda"
                          : swap.status === "approved"
                          ? "Disetujui"
                          : "Ditolak"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                      <Calendar size={18} color="var(--blue)" />
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{swap.scheduleId.split("|").join(" • ")}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          {isIncoming
                            ? `Dari: ${requester?.airName || requester?.displayName || swap.requesterId}`
                            : `Target: ${targetAnnouncer?.airName || targetAnnouncer?.displayName || swap.targetAnnouncerId}`}
                        </div>
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
