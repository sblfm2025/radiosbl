import { useState, useEffect, useMemo, useCallback } from "react";
import { Clock, CheckCircle2, Send, AlertCircle, Calendar } from "lucide-react";
import { PageHeader } from "./PageHeader";
import {
  getScheduleSwapAliasesForUser,
  isIncomingScheduleSwap,
  subscribeMySwapRequests,
  submitSwapRequest,
  updateSwapStatus
} from "../services/scheduleSwap.service";
import { listUserProfiles } from "../services/userProfile.service";
import type { AuthSession } from "../services/auth.service";
import type { ScheduleSwapRequest, AppUser } from "../types/domain";
import { announcers as localAnnouncers, weeklyBroadcastSchedule } from "../data/radioData";
import { findAnnouncerProfile } from "../utils/announcerResolver";
import { formatScheduleDate, getScheduleDayName } from "../services/scheduleSlot.service";

export function ScheduleSwapPage({ session }: { session: AuthSession | null }) {
  const [swaps, setSwaps] = useState<ScheduleSwapRequest[]>([]);
  const [announcers, setAnnouncers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  // Form State
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [targetDate, setTargetDate] = useState(formatScheduleDate(new Date()));
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
    if (profile?.scheduleNames) profile.scheduleNames.forEach(n => candidateNames.add(n.toLowerCase()));
    if (session.user.displayName) candidateNames.add(session.user.displayName.toLowerCase());
    if (session.user.airName) candidateNames.add(session.user.airName.toLowerCase());

    const fromWhatsapp = extractWaNumber(session.user.whatsapp);
    if (fromWhatsapp) {
      // extractWaNumber membuang '0' di depan. Namun id di localAnnouncers formatnya '08...'. 
      // Jadi gunakan endsWith agar cocok.
      const local = localAnnouncers.find((a) => a.id.endsWith(fromWhatsapp));
      if (local?.airName) candidateNames.add(local.airName.toLowerCase());
      if (local?.scheduleNames) local.scheduleNames.forEach(n => candidateNames.add(n.toLowerCase()));
    }

    // Ekstraksi kata-kata dari nama Google Account untuk menebak (fuzzy search)
    if (session.user.displayName) {
      const parts = session.user.displayName.toLowerCase().split(/\s+/);
      parts.forEach(p => { if (p.length > 2) candidateNames.add(p); });
    }

    const targetDay = getScheduleDayName(targetDate);

    return weeklyBroadcastSchedule.filter((slot) => {
      const slotText = slot.announcer.toLowerCase();
      return slot.day === targetDay && Array.from(candidateNames).some((needle) => needle && slotText.includes(needle));
    });
  }, [session, targetDate]);

  const loadProfiles = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const userData = await listUserProfiles().catch((err) => {
        console.error("Gagal memuat profil user (fallback ke announcers lokal):", err);
        return [] as AppUser[];
      });

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
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (!session) {
      setSwaps([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeMySwapRequests(
      session.user,
      (nextSwaps) => {
        setSwaps(nextSwaps);
        setLoading(false);
      },
      (err) => {
        console.error("Gagal memuat realtime tukar jadwal:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !selectedSlotKey || !targetAnnouncerId || !reason) return;

    setSubmitting(true);
    setWhatsappLink(null);
    try {
      const targetAnnouncer = announcers.find((announcer) => announcer.id === targetAnnouncerId);
      const result = await submitSwapRequest({
        scheduleId: selectedSlotKey, // Menggunakan key sebagai ID sementara
        targetDate,
        requesterId: session.user.id,
        requesterAliases: getScheduleSwapAliasesForUser(session.user),
        targetAnnouncerId,
        targetAnnouncerAliases: getScheduleSwapAliasesForUser(
          targetAnnouncer ?? targetAnnouncerId
        ),
        reason
      }, {
        requester: session.user,
        targetAnnouncer
      });
      if (result.whatsappDelivered) {
        setMessage("Permintaan dikirim dan notifikasi WhatsApp terkirim ke penyiar pengganti.");
      } else if (result.whatsappUrl) {
        setMessage("Permintaan dikirim. Draft WhatsApp konfirmasi sudah disiapkan untuk penyiar pengganti.");
        setWhatsappLink(result.whatsappUrl);
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        setMessage(`Permintaan dikirim. WhatsApp belum terkirim: ${result.whatsappFallbackReason || "nomor tujuan belum tersedia."}`);
      }
      setSelectedSlotKey("");
      setTargetDate(formatScheduleDate(new Date()));
      setTargetAnnouncerId("");
      setReason("");
    } catch {
      alert("Gagal mengirim permintaan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResponse(swapId: string, approve: boolean) {
    if (!session) return;

    try {
      await updateSwapStatus(swapId, approve ? "approved" : "rejected", session.user);
      setMessage(approve ? "Pertukaran disetujui. Jadwal otomatis diperbarui." : "Pertukaran ditolak.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      alert("Gagal menanggapi permintaan.");
    }
  }

  function getStatusLabel(swap: ScheduleSwapRequest, isIncoming: boolean) {
    if (swap.status === "pending_target") {
      return isIncoming ? "Menunggu keputusan Anda" : "Menunggu rekan penyiar";
    }

    if (swap.status === "approved") {
      return "Disetujui, jadwal diperbarui";
    }

    return "Ditolak";
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
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              style={{ color: "white", marginLeft: "auto", textDecoration: "underline" }}
            >
              Kirim WA
            </a>
          )}
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
              <label htmlFor="swap-target-date" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Tanggal Tukar</label>
              <input
                id="swap-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value || formatScheduleDate(new Date()));
                  setSelectedSlotKey("");
                }}
                required
                style={{ padding: "14px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="swap-source-slot" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Pilih Jadwal Anda</label>
              <select 
                id="swap-source-slot"
                value={selectedSlotKey} 
                onChange={(e) => setSelectedSlotKey(e.target.value)}
                required
                style={{ padding: "14px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "#f8f9fc", outline: "none" }}
              >
                <option value="">-- Pilih Jam Siaran --</option>
                {mySlots.map((slot, i) => (
                  <option key={i} value={`${slot.day}|${slot.time}|${slot.program}`}>
                    {targetDate} • {slot.time} • {slot.program}
                  </option>
                ))}
              </select>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>
                Hanya jadwal Anda pada hari {getScheduleDayName(targetDate)} yang ditampilkan.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="swap-target-announcer" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Pilih Penyiar Pengganti</label>
              <select 
                id="swap-target-announcer"
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
              <label htmlFor="swap-reason" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Alasan Pertukaran</label>
              <textarea 
                id="swap-reason"
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
              <div style={{ marginTop: "12px", padding: "12px", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca" }}>
                <p style={{ fontSize: "0.85rem", color: "#b91c1c", textAlign: "center", margin: 0, fontWeight: 700 }}>Anda tidak memiliki jadwal siaran pada hari tersebut.</p>
                <p style={{ fontSize: "0.75rem", color: "#dc2626", textAlign: "center", margin: "4px 0 0 0" }}>Silakan ubah Tanggal Tukar ke hari di mana Anda dijadwalkan bersiaran.</p>
              </div>
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
                const isIncoming = session ? isIncomingScheduleSwap(swap, session.user) : false;
                const targetAnnouncer = announcers.find(a => a.id === swap.targetAnnouncerId);
                const requester = announcers.find(a => a.id === swap.requesterId);

                return (
                  <article key={swap.id} style={{ padding: "16px", borderRadius: "16px", border: "1px solid #f1f3f5", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "bold", background: isIncoming ? "#e7f5ef" : "#f1f3f5", color: isIncoming ? "#11a36a" : "var(--muted)", padding: "4px 10px", borderRadius: "99px" }}>
                        {isIncoming ? "PERMINTAAN MASUK" : "PENGAJUAN SAYA"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {getStatusLabel(swap, isIncoming)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                      <Calendar size={18} color="var(--blue)" />
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{swap.scheduleId.split("|").join(" • ")}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          {swap.targetDate ? `${swap.targetDate} • ` : ""}
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
