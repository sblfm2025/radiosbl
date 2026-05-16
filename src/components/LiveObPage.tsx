import { useState, useEffect, type FormEvent } from "react";
import { CheckCircle2, Video, Send, Settings2, Plus, ExternalLink, CalendarDays, MapPin } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { LiveEvent } from "../types/domain";
import {
  subscribeLiveEvents,
  listLiveEvents,
  createLiveEventFromDraft
} from "../services/liveOb.service";
import { LiveBroadcastCard } from "./LiveBroadcastCard";

export function LiveObPage({ data }: { data: DashboardSnapshot }) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [title, setTitle] = useState("Dialog Publik Pinrang Bersatu");
  const [location, setLocation] = useState("Studio Utama");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [discordRoomUrl, setDiscordRoomUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeLiveEvents(setEvents);
    void listLiveEvents().then(setEvents);
    return () => unsubscribe();
  }, []);

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
    setError("");
    setNotice(`Notifikasi kru untuk ${activeEvent.title} disiapkan. Hubungkan WhatsApp proxy produksi untuk pengiriman otomatis.`);
  }

  return (
    <div style={{ background: "#f8f9fc", minHeight: "100vh", paddingBottom: "100px" }}>
      <div style={{ background: "white", padding: "16px 20px 24px", borderBottom: "1px solid rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: "1.4rem", margin: 0, color: "var(--ink)", fontWeight: 700 }}>Live / OB</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>Event, kru, checklist alat, rundown, dan OBS workflow.</p>
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <LiveBroadcastCard />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          
          {/* Checklist Alat */}
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Settings2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--ink)" }}>Checklist Alat</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.liveChecklist.map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "16px", background: item.done ? "rgba(17,163,106,0.05)" : "rgba(0,0,0,0.02)", border: item.done ? "1px solid rgba(17,163,106,0.1)" : "1px solid transparent", transition: "0.2s" }}>
                  <div style={{ color: item.done ? "#11a36a" : "var(--muted)" }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <strong style={{ fontSize: "0.95rem", color: item.done ? "var(--ink)" : "var(--muted)", fontWeight: item.done ? 700 : 500 }}>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Form YouTube & Discord */}
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "rgba(255, 59, 59, 0.1)", color: "#FF3B3B", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Video size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--ink)" }}>Jadwalkan Live</h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Embed YouTube & Discord Rundown</p>
              </div>
            </div>

            {notice && <p style={{ background: "rgba(17,163,106,0.1)", color: "#11a36a", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "16px" }}>{notice}</p>}
            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul event" required style={{ width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem" }} />
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lokasi (Studio / Lapangan)" required style={{ width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem" }} />
              <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required style={{ width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem" }} />
              <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="Link YouTube Live (Opsional)" style={{ width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem" }} />
              <input value={discordRoomUrl} onChange={(event) => setDiscordRoomUrl(event.target.value)} placeholder="Link Discord Room (Opsional)" style={{ width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem" }} />
              
              <button type="submit" style={{ padding: "16px", borderRadius: "99px", background: "var(--blue)", color: "white", border: "none", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px", cursor: "pointer", fontSize: "0.95rem" }}>
                <Plus size={18} /> Buat Event Live
              </button>
            </form>
            <button type="button" onClick={handleCrewNotification} style={{ width: "100%", padding: "16px", borderRadius: "99px", background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", border: "none", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px", cursor: "pointer", fontSize: "0.95rem" }}>
              <Send size={18} /> Beri Tahu Kru (WA)
            </button>
          </div>
        </div>

        {events.length > 0 && (
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(17,163,106,0.1)", color: "#11a36a", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--ink)" }}>Rundown Event Aktif</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {events.map((event) => (
                <div key={event.id} style={{ padding: "16px", borderRadius: "16px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", color: "var(--ink)" }}>{event.title}</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--muted)", marginBottom: "4px" }}>
                        <MapPin size={14} /> {event.location}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--blue)", fontWeight: 700 }}>Status: {event.status}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    {event.discordRoomUrl && (
                      <a href={event.discordRoomUrl} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "#5865F2", color: "white", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <ExternalLink size={14} /> Discord
                      </a>
                    )}
                    {event.youtubeUrl && (
                      <a href={event.youtubeUrl} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "#FF0000", color: "white", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <ExternalLink size={14} /> YouTube
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
