import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, Clock, Send } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { InlineHelp } from "./InlineHelp";
import {
  getScheduleSwapAliasesForUser,
  isIncomingScheduleSwap,
  subscribeMySwapRequests,
  submitSwapRequest,
  updateSwapStatus
} from "../services/scheduleSwap.service";
import { listUserProfiles } from "../services/userProfile.service";
import type { AuthSession } from "../services/auth.service";
import type { AppUser, ScheduleSwapRequest } from "../types/domain";
import { announcers as localAnnouncers, weeklyBroadcastSchedule } from "../data/radioData";
import { findAnnouncerProfile } from "../utils/announcerResolver";
import { formatScheduleDate, getScheduleDayName } from "../services/scheduleSlot.service";

export function ScheduleSwapPage({ session }: { session: AuthSession | null }) {
  const [swaps, setSwaps] = useState<ScheduleSwapRequest[]>([]);
  const [announcers, setAnnouncers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [targetDate, setTargetDate] = useState(formatScheduleDate(new Date()));
  const [targetAnnouncerId, setTargetAnnouncerId] = useState("");
  const [reason, setReason] = useState("");

  const extractWaNumber = (value: string | undefined) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");

    if (!digits) return null;
    return digits.replace(/^0+/, "");
  };

  const mySlots = useMemo(() => {
    if (!session) return [];

    const profile = findAnnouncerProfile(session.user.airName || session.user.displayName || "");
    const candidateNames = new Set<string>();

    if (profile?.airName) candidateNames.add(profile.airName.toLowerCase());
    if (profile?.fullName) candidateNames.add(profile.fullName.toLowerCase());
    if (profile?.scheduleNames) profile.scheduleNames.forEach((name) => candidateNames.add(name.toLowerCase()));
    if (session.user.displayName) candidateNames.add(session.user.displayName.toLowerCase());
    if (session.user.airName) candidateNames.add(session.user.airName.toLowerCase());

    const fromWhatsapp = extractWaNumber(session.user.whatsapp);
    if (fromWhatsapp) {
      const local = localAnnouncers.find((announcer) => announcer.id.endsWith(fromWhatsapp));
      if (local?.airName) candidateNames.add(local.airName.toLowerCase());
      if (local?.scheduleNames) local.scheduleNames.forEach((name) => candidateNames.add(name.toLowerCase()));
    }

    if (session.user.displayName) {
      const parts = session.user.displayName.toLowerCase().split(/\s+/);
      parts.forEach((part) => {
        if (part.length > 2) candidateNames.add(part);
      });
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

      if (filtered.length > 0) {
        setAnnouncers(filtered);
      } else {
        setAnnouncers(
          localAnnouncers
            .filter((announcer) => announcer.id !== session.user.id && announcer.active)
            .map((announcer) => ({
              id: `wa-${announcer.id}`,
              email: `${announcer.id}@radiosbl.com`,
              displayName: announcer.fullName,
              role: "announcer" as const,
              airName: announcer.airName,
              announcerNames: announcer.scheduleNames,
              photoUrl: announcer.photoUrl,
              whatsapp: announcer.id,
              active: announcer.active,
              employeeId: undefined
            }))
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

  const swapSummary = useMemo(() => {
    return swaps.reduce(
      (summary, swap) => {
        const incoming = session ? isIncomingScheduleSwap(swap, session.user) : false;

        if (swap.status === "pending_target" && incoming) {
          summary.incoming += 1;
        } else if (swap.status === "pending_target") {
          summary.outgoing += 1;
        } else {
          summary.completed += 1;
        }

        return summary;
      },
      { incoming: 0, outgoing: 0, completed: 0 }
    );
  }, [session, swaps]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !selectedSlotKey || !targetAnnouncerId || !reason) return;

    setSubmitting(true);
    setWhatsappLink(null);
    setErrorMessage("");
    try {
      const targetAnnouncer = announcers.find((announcer) => announcer.id === targetAnnouncerId);
      const result = await submitSwapRequest({
        scheduleId: selectedSlotKey,
        targetDate,
        requesterId: session.user.id,
        requesterAliases: getScheduleSwapAliasesForUser(session.user),
        targetAnnouncerId,
        targetAnnouncerAliases: getScheduleSwapAliasesForUser(targetAnnouncer ?? targetAnnouncerId),
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
      setErrorMessage("Gagal mengirim permintaan. Coba periksa koneksi lalu kirim ulang.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResponse(swapId: string, approve: boolean) {
    if (!session) return;

    try {
      setErrorMessage("");
      await updateSwapStatus(swapId, approve ? "approved" : "rejected", session.user);
      setMessage(approve ? "Pertukaran disetujui. Jadwal otomatis diperbarui." : "Pertukaran ditolak.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setErrorMessage("Gagal menanggapi permintaan. Coba ulangi dari kartu permintaan ini.");
    }
  }

  function getStatusLabel(swap: ScheduleSwapRequest, incoming: boolean) {
    if (swap.status === "pending_target") {
      return incoming ? "Menunggu keputusan Anda" : "Menunggu rekan penyiar";
    }

    if (swap.status === "approved") {
      return "Disetujui, jadwal diperbarui";
    }

    return "Ditolak";
  }

  function getStatusClass(swap: ScheduleSwapRequest, incoming: boolean) {
    if (swap.status === "approved") return "approved";
    if (swap.status === "rejected") return "rejected";
    if (incoming) return "incoming";
    return "pending";
  }

  return (
    <div className="schedule-swap-page">
      <div className="schedule-swap-content">
        <PageHeader
          eyebrow="Tukar Jadwal"
          title="Pengajuan Jadwal Siaran"
          description="Ajukan permintaan pengganti slot siaran dan tanggapi permintaan masuk dari rekan penyiar."
        />

        {message && (
          <div className="schedule-swap-alert success">
            <CheckCircle2 size={20} />
            <span>{message}</span>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                Kirim WA
              </a>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="schedule-swap-alert danger">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="schedule-swap-summary">
          <article className="schedule-swap-summary-card incoming">
            <small>Permintaan masuk</small>
            <strong>{swapSummary.incoming}</strong>
            <span>Perlu ditanggapi</span>
          </article>
          <article className="schedule-swap-summary-card pending">
            <small>Menunggu rekan</small>
            <strong>{swapSummary.outgoing}</strong>
            <span>Pengajuan saya</span>
          </article>
          <article className="schedule-swap-summary-card done">
            <small>Selesai</small>
            <strong>{swapSummary.completed}</strong>
            <span>Disetujui atau ditolak</span>
          </article>
        </div>

        <div className="schedule-swap-grid">
          <section className="schedule-swap-panel">
            <h2 className="schedule-swap-section-title" style={{ display: "flex", alignItems: "center" }}>
              <Send size={18} /> Ajukan Pertukaran
              <InlineHelp 
                title="Sistem Tukar Jadwal" 
                content="Pilih jadwal siaran Anda dan rekan pengganti. Rekan Anda akan mendapat konfirmasi lewat WhatsApp."
              />
            </h2>

            <form className="schedule-swap-form" onSubmit={handleSubmit}>
              <div className="schedule-swap-field">
                <label htmlFor="swap-target-date">Tanggal Tukar</label>
                <input
                  id="swap-target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value || formatScheduleDate(new Date()));
                    setSelectedSlotKey("");
                  }}
                  required
                />
              </div>

              <div className="schedule-swap-field">
                <label htmlFor="swap-source-slot">Pilih Jadwal Anda</label>
                <select
                  id="swap-source-slot"
                  value={selectedSlotKey}
                  onChange={(e) => setSelectedSlotKey(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Jam Siaran --</option>
                  {mySlots.map((slot, index) => (
                    <option key={index} value={`${slot.day}|${slot.time}|${slot.program}`}>
                      {targetDate} - {slot.time} - {slot.program}
                    </option>
                  ))}
                </select>
                <p>Hanya jadwal Anda pada hari {getScheduleDayName(targetDate)} yang ditampilkan.</p>
              </div>

              <div className="schedule-swap-field">
                <label htmlFor="swap-target-announcer">Pilih Penyiar Pengganti</label>
                <select
                  id="swap-target-announcer"
                  value={targetAnnouncerId}
                  onChange={(e) => setTargetAnnouncerId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Rekan Penyiar --</option>
                  {announcers.map((announcer) => (
                    <option key={announcer.id} value={announcer.id}>{announcer.airName || announcer.displayName}</option>
                  ))}
                </select>
                {announcers.length === 0 && (
                  <p>Daftar penyiar pengganti belum tersedia. Periksa kembali data profil atau hubungi admin.</p>
                )}
              </div>

              <div className="schedule-swap-field">
                <label htmlFor="swap-reason">Alasan Pertukaran</label>
                <textarea
                  id="swap-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Berikan alasan mengapa Anda butuh pertukaran..."
                  required
                  rows={3}
                />
              </div>

              <button type="submit" disabled={submitting || mySlots.length === 0} className="schedule-swap-submit">
                {submitting ? "Mengirim..." : "Kirim Permintaan Tukar"}
              </button>

              {mySlots.length === 0 && (
                <div className="schedule-swap-warning">
                  <strong>Anda tidak memiliki jadwal siaran pada hari tersebut.</strong>
                  <span>Silakan ubah Tanggal Tukar ke hari di mana Anda dijadwalkan bersiaran.</span>
                </div>
              )}
            </form>
          </section>

          <section className="schedule-swap-panel">
            <h2 className="schedule-swap-section-title">
              <Clock size={18} /> Riwayat & Permintaan Masuk
            </h2>

            {loading ? (
              <div className="schedule-swap-loading">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="ui-skeleton-card" key={index}>
                    <span className="ui-skeleton line short" />
                    <span className="ui-skeleton line" />
                    <span className="ui-skeleton line medium" />
                  </div>
                ))}
              </div>
            ) : swaps.length === 0 ? (
              <div className="schedule-swap-empty">
                <AlertCircle size={32} />
                <p>Belum ada aktivitas pertukaran jadwal.</p>
              </div>
            ) : (
              <div className="schedule-swap-list">
                {swaps.map((swap) => {
                  const incoming = session ? isIncomingScheduleSwap(swap, session.user) : false;
                  const targetAnnouncer = announcers.find((announcer) => announcer.id === swap.targetAnnouncerId);
                  const requester = announcers.find((announcer) => announcer.id === swap.requesterId);

                  return (
                    <article key={swap.id} className="schedule-swap-card">
                      <div className="schedule-swap-card-head">
                        <span className={`schedule-swap-kind ${incoming ? "incoming" : "outgoing"}`}>
                          {incoming ? "PERMINTAAN MASUK" : "PENGAJUAN SAYA"}
                        </span>
                        <span className={`schedule-swap-status ${getStatusClass(swap, incoming)}`}>
                          {getStatusLabel(swap, incoming)}
                        </span>
                      </div>

                      <div className="schedule-swap-card-main">
                        <div className="schedule-swap-card-icon"><Calendar size={18} /></div>
                        <div>
                          <h3>{swap.scheduleId.split("|").join(" - ")}</h3>
                          <p>
                            {swap.targetDate ? `${swap.targetDate} - ` : ""}
                            {incoming
                              ? `Dari: ${requester?.airName || requester?.displayName || swap.requesterId}`
                              : `Target: ${targetAnnouncer?.airName || targetAnnouncer?.displayName || swap.targetAnnouncerId}`}
                          </p>
                        </div>
                      </div>

                      <p className="schedule-swap-reason">"{swap.reason}"</p>

                      {incoming && swap.status === "pending_target" && (
                        <div className="schedule-swap-response-actions">
                          <button type="button" onClick={() => handleResponse(swap.id, true)} className="approve">
                            Setujui
                          </button>
                          <button type="button" onClick={() => handleResponse(swap.id, false)} className="reject">
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
    </div>
  );
}
