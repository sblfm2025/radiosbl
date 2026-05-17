import { useState, useEffect, useMemo, type FormEvent } from "react";
import {
  CheckCircle2,
  Video,
  Settings2,
  Plus,
  CalendarDays,
  MapPin,
  Radio,
  Send,
  ShieldCheck
} from "lucide-react";
import { PageHeader } from "./PageHeader";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { LiveEvent } from "../types/domain";
import {
  subscribeLiveEvents,
  listLiveEvents,
  createLiveEventFromDraft
} from "../services/liveOb.service";
import { LiveBroadcastCard } from "./LiveBroadcastCard";

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 0C5.385 0 .003 5.378.003 12.02c0 2.126.554 4.195 1.605 6.012L0 24l6.113-1.6c1.764.965 3.754 1.472 5.918 1.472 6.643 0 12.025-5.378 12.025-12.02C24.056 5.38 18.675 0 12.031 0zm0 21.84c-1.8 0-3.564-.482-5.111-1.396l-.367-.216-3.8.995 1.014-3.7-.238-.378a9.92 9.92 0 01-1.52-5.281c0-5.495 4.473-9.967 9.97-9.967 5.498 0 9.97 4.472 9.97 9.967s-4.472 9.964-9.92 9.964l-.008.012zM17.51 14.36c-.3-.15-1.776-.877-2.05-.977-.276-.1-.476-.15-.677.15-.2.3-.776.977-.951 1.177-.176.2-.352.226-.653.076-.3-.15-1.267-.468-2.414-1.493-.89-.797-1.491-1.782-1.667-2.083-.176-.3-.02-.462.13-.612.136-.135.3-.35.45-.526.15-.175.2-.3.3-.5.1-.2.05-.375-.026-.525-.075-.15-.676-1.626-.926-2.226-.24-.582-.486-.503-.677-.512-.176-.008-.377-.008-.578-.008-.2 0-.527.075-.802.375-.276.3-1.053 1.026-1.053 2.502s1.078 2.898 1.228 3.098c.15.2 2.11 3.22 5.11 4.516.714.307 1.272.49 1.706.627.716.226 1.368.194 1.884.118.577-.085 1.776-.726 2.026-1.426.25-.7.25-1.3.176-1.426-.076-.126-.277-.2-.577-.35z"/>
  </svg>
);

export function LiveObPage({ data }: { data: DashboardSnapshot }) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [checklist, setChecklist] = useState(() => data.liveChecklist.map(item => ({ ...item })));
  const [title, setTitle] = useState("Dialog Publik Pinrang Bersatu");
  const [location, setLocation] = useState("Studio Utama");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [discordRoomUrl, setDiscordRoomUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const checklistDone = checklist.filter((item) => item.done).length;
  const latestEvent = events[0];
  const checklistPercent = checklist.length > 0
    ? Math.round((checklistDone / checklist.length) * 100)
    : 0;
  const linkReadiness = [
    youtubeUrl.trim() ? "YouTube" : "",
    discordRoomUrl.trim() ? "Discord" : ""
  ].filter(Boolean);
  const nextEvent = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )[0],
    [events]
  );
  const nextEventText = nextEvent
    ? `${nextEvent.title} - ${new Date(nextEvent.startsAt).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })}`
    : "Belum ada event aktif";

  useEffect(() => {
    const unsubscribe = subscribeLiveEvents(setEvents);
    void listLiveEvents().then(setEvents);
    return () => unsubscribe();
  }, []);

  const toggleChecklist = (index: number) => {
    const updated = [...checklist];
    updated[index].done = !updated[index].done;
    setChecklist(updated);
  };

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    try {
      const liveEvent = await createLiveEventFromDraft({
        title,
        location,
        startsAt: new Date(startsAt).toISOString(),
        youtubeUrl,
        discordRoomUrl
      });
      setEvents((items) => [liveEvent, ...items].slice(0, 30));
      setNotice("Event Live/OB siap. Link Discord/YouTube sudah masuk rundown.");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "Event Live/OB gagal dibuat."
      );
    }
  }

  function handleCrewNotification() {
    if (events.length === 0) {
      setError("Buat event Live/OB terlebih dahulu sebelum mengirim notifikasi kru.");
      setNotice("");
      return;
    }

    const activeEvent = events[0];
    const text = `🚨 *NOTIFIKASI LIVE/OB RADIO SBL* 🚨\n\nAcara: *${activeEvent.title}*\nLokasi: *${activeEvent.location}*\nWaktu: *${new Date(activeEvent.startsAt).toLocaleString("id-ID")}*\n\nMohon seluruh kru merapat dan memantau siaran.${activeEvent.youtubeUrl ? `\n\n🔴 YouTube: ${activeEvent.youtubeUrl}` : ""}${activeEvent.discordRoomUrl ? `\n🎧 Discord: ${activeEvent.discordRoomUrl}` : ""}`;
    const encodedText = encodeURIComponent(text);
    
    // Buka WhatsApp API
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
    
    setError("");
    setNotice("Membuka WhatsApp untuk mengirim notifikasi...");
  }

  return (
    <>
      <PageHeader
        eyebrow="On-Air"
        title="Live / OB"
        description="Manajemen event luar studio, rundown, dan notifikasi kru."
      />

      <section className="two-column">
        <div className="panel live-ob-broadcast-panel">
          <LiveBroadcastCard />
        </div>

        <section className="live-ob-summary" aria-label="Ringkasan Live OB">
          <article>
            <span>Checklist</span>
            <strong>{checklistDone}/{checklist.length}</strong>
          </article>
          <article>
            <span>Event</span>
            <strong>{events.length}</strong>
          </article>
          <article>
            <span>Aktif</span>
            <strong>{latestEvent ? latestEvent.status : "Belum"}</strong>
          </article>
        </section>

        <section className="live-ob-readiness" aria-label="Kesiapan operasional Live OB">
          <article className="is-primary">
            <div>
              <ShieldCheck size={18} />
              <span>Kesiapan alat</span>
            </div>
            <strong>{checklistPercent}%</strong>
            <progress value={checklistPercent} max={100} aria-label={`Kesiapan alat ${checklistPercent}%`} />
            <p>{checklistDone} dari {checklist.length} checklist sudah aman.</p>
          </article>
          <article>
            <div>
              <Radio size={18} />
              <span>Link siaran</span>
            </div>
            <strong>{linkReadiness.length > 0 ? linkReadiness.join(" + ") : "Belum ada link"}</strong>
            <p>{linkReadiness.length > 0 ? "Link siap masuk notifikasi kru." : "Tambahkan YouTube atau Discord bila tersedia."}</p>
          </article>
          <article>
            <div>
              <Send size={18} />
              <span>Event berikutnya</span>
            </div>
            <strong>{nextEvent ? nextEvent.status : "Draft dulu"}</strong>
            <p>{nextEventText}</p>
          </article>
        </section>

        <div className="panel">
          <div className="panel-title live-ob-panel-title">
            <div>
              <div className="live-ob-title-icon primary">
                <Settings2 size={20} />
              </div>
              <div>
                <h3>Checklist Alat</h3>
                <p>Pastikan semua alat siap untuk siaran Live/OB.</p>
              </div>
            </div>
          </div>

          <div className="live-ob-checklist">
            {checklist.map((item, index) => (
              <button 
                type="button"
                key={item.label} 
                onClick={() => toggleChecklist(index)}
                className={item.done ? "done" : ""}
              >
                <div>
                  <CheckCircle2 size={20} />
                </div>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title live-ob-panel-title">
            <div>
              <div className="live-ob-title-icon danger">
                <Video size={20} />
              </div>
              <div>
                <h3>Jadwalkan Live</h3>
                <p>Buat event Live/OB dengan link streaming dan notifikasi kru.</p>
              </div>
            </div>
          </div>

          {notice && <p className="success-note">{notice}</p>}
          {error && <p className="form-error">{error}</p>}

          <form onSubmit={handleCreateEvent} className="live-ob-form">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul event"
              required
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Lokasi (Studio / Lapangan)"
              required
            />
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
            <input
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="Link YouTube Live (Opsional)"
            />
            <input
              value={discordRoomUrl}
              onChange={(event) => setDiscordRoomUrl(event.target.value)}
              placeholder="Link Discord Room (Opsional)"
            />

            <div className="live-ob-actions">
              <button type="submit" className="primary-action">
                <Plus size={18} /> Buat Event Live
              </button>
              <button type="button" className="secondary-action whatsapp-action" onClick={handleCrewNotification}>
                <WhatsAppIcon /> Kirim ke Grup WA
              </button>
            </div>
          </form>
        </div>

        {events.length > 0 && (
          <div className="panel live-ob-broadcast-panel">
            <div className="panel-title live-ob-panel-title">
              <div>
                <div className="live-ob-title-icon success">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3>Rundown Event Aktif</h3>
                  <p>Lihat status event dan akses cepat ke link kru.</p>
                </div>
              </div>
            </div>

            <div className="live-ob-event-list">
              {events.map((event) => (
                <article key={event.id} className="live-ob-event-card">
                  <div>
                    <div>
                      <h4>{event.title}</h4>
                      <div className="live-ob-location">
                        <MapPin size={14} /> {event.location}
                      </div>
                      <div className="live-ob-status">Status: {event.status}</div>
                    </div>
                    <div className="live-ob-links">
                      {event.discordRoomUrl && (
                        <a href={event.discordRoomUrl} target="_blank" rel="noreferrer" className="discord">
                          <DiscordIcon /> Discord Room
                        </a>
                      )}
                      {event.youtubeUrl && (
                        <a href={event.youtubeUrl} target="_blank" rel="noreferrer" className="youtube">
                          <YoutubeIcon /> YouTube Live
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
