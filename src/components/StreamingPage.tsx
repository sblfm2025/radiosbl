import { useState, useEffect, type FormEvent } from "react";
import { ChevronRight, Radio, Play, Pause, Volume2, Globe, MessageSquareText, Share2, ChevronLeft } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { SongRequest } from "../types/domain";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";
import { useGlobalAudio } from "../contexts/useGlobalAudio";
import { findAnnouncerProfile } from "../utils/announcerResolver";
import { subscribeSongRequests, submitSongRequest } from "../services/songRequest.service";

export function StreamingPage({
  data,
  onAirAnnouncer,
  onExit
}: {
  data: DashboardSnapshot;
  onAirAnnouncer: string;
  onExit: () => void;
}) {
  const currentSlot = useCurrentBroadcastSlot();
  const currentAnnouncer = onAirAnnouncer;
  const firstScheduledAnnouncer = currentSlot.type === "main"
    ? currentSlot.announcer.split(/\s*(?:\/|&|,)\s*/)[0]
    : "";
  const activeAnnouncerProfile = currentAnnouncer
    ? findAnnouncerProfile(firstScheduledAnnouncer)
    : null;

  const {
    playing,
    togglePlayback,
    volume,
    setVolume,
    metadata,
    setIsExpanded
  } = useGlobalAudio();
  const stationFrequency = data.station.frequency;
  const [requesterName, setRequesterName] = useState("");
  const [requesterWhatsapp, setRequesterWhatsapp] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songMessage, setSongMessage] = useState("");
  const [songRequestError, setSongRequestError] = useState("");
  const [songRequestNotice, setSongRequestNotice] = useState("");
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const websiteUrl = `https://${data.station.website}`;
  const whatsappNumber = data.station.phone.replace(/\D/g, "").replace(/^0/, "62");

  // On mount, make sure it is expanded
  useEffect(() => {
    setIsExpanded(true);
    return () => setIsExpanded(false);
  }, [setIsExpanded]);

  useEffect(() => {
    return subscribeSongRequests(setSongRequests);
  }, []);

  async function handleSongRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSongRequestError("");
    setSongRequestNotice("");

    try {
      const request = await submitSongRequest({
        requesterName,
        requesterWhatsapp,
        artist: songArtist,
        title: songTitle,
        message: songMessage,
        announcer: activeAnnouncerProfile,
        programTitle: currentSlot.title
      });

      setSongRequests([request, ...songRequests].slice(0, 25));
      setSongTitle("");
      setSongArtist("");
      setSongMessage("");
      setSongRequestNotice(
        request.announcerName
          ? `Request masuk dan notifikasi WA siap untuk ${request.announcerName}.`
          : "Request masuk. Karena penyiar belum terdeteksi hadir, notifikasi diarahkan ke WA Radio SBL."
      );

      if (request.whatsappUrl && !request.notificationDelivered) {
        window.open(request.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (currentError) {
      setSongRequestError(
        currentError instanceof Error
          ? currentError.message
          : "Request lagu gagal dikirim."
      );
    }
  }

  async function handleShareStream() {
    const shareUrl = data.station.publicStreamPage.startsWith("http")
      ? data.station.publicStreamPage
      : `https://${data.station.publicStreamPage}`;
    const shareText = `${data.station.name} ${stationFrequency}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareText,
          text: `Dengarkan ${shareText} secara live.`,
          url: shareUrl
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setSongRequestNotice("Link streaming disalin.");
      } else {
        setSongRequestNotice(shareUrl);
      }
    } catch (currentError) {
      if (currentError instanceof DOMException && currentError.name === "AbortError") {
        return;
      }
      setSongRequestError("Gagal membagikan link streaming.");
    }
  }

  return (
    <div style={{ background: "#1665D8", minHeight: "100vh", color: "white", padding: "40px 20px 100px", display: "flex", flexDirection: "column" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <button type="button" aria-label="Kembali" onClick={onExit} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ fontSize: "1rem", fontWeight: 700 }}>Sedang Mengudara <ChevronRight size={16} style={{ transform: "rotate(90deg)", display: "inline-block", verticalAlign: "middle" }}/></div>
        <button type="button" onClick={() => setRequestFormOpen((open) => !open)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }} aria-label="Buka request lagu">
          <Radio size={24} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Giant Logo with Ripple */}
        <div style={{ position: "relative", width: "220px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px" }}>
           <div style={{ position: "absolute", inset: "-40px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%" }}></div>
           <div style={{ position: "absolute", inset: "-80px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "50%" }}></div>
           <div style={{ position: "relative", width: "100%", height: "100%", background: "white", borderRadius: "50%", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
              <img src="/LogoSBL.svg" alt="SBL" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
           </div>
        </div>

        <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px", fontWeight: 800 }}>Live Streaming</h2>
        <p style={{ margin: "0 0 4px", fontSize: "1rem", opacity: 0.9 }}>SBL RADIO</p>
        <p style={{ margin: "0 0 4px", fontSize: "0.85rem", opacity: 0.8 }}>Program: {currentSlot.title}</p>
        {currentAnnouncer && (
          <p style={{ margin: "0 0 4px", fontSize: "0.85rem", opacity: 0.8 }}>
            Penyiar: {currentAnnouncer}
          </p>
        )}
        <p style={{ margin: "0 0 24px", fontSize: "0.85rem", opacity: 0.8 }}>{currentSlot.time} WITA - {stationFrequency}</p>

        <div style={{ background: metadata.isOnline ? "#FF4B4B" : "rgba(255,255,255,0.2)", color: "white", padding: "6px 16px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 800, marginBottom: "40px" }}>
          {metadata.isOnline ? "ON AIR" : "OFF AIR"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "40px" }}>
           <span style={{ padding: "8px 20px", borderRadius: "999px", background: "rgba(255,255,255,0.15)", fontSize: "0.8rem", fontWeight: 800 }}>LIVE</span>
           <button 
             onClick={togglePlayback}
             style={{ width: "80px", height: "80px", borderRadius: "50%", background: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
           >
             {playing ? <Pause size={36} color="#1665D8" /> : <Play size={36} color="#1665D8" style={{ marginLeft: "4px" }} />}
           </button>
           <span style={{ padding: "8px 20px", borderRadius: "999px", background: "rgba(255,255,255,0.15)", fontSize: "0.8rem", fontWeight: 800 }}>{metadata.isOnline ? "ONLINE" : "SIAGA"}</span>
        </div>

        <label style={{ width: "100%", maxWidth: "320px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <Volume2 size={20} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            style={{ flex: 1, accentColor: "white", height: "4px", background: "rgba(255,255,255,0.2)" }}
          />
        </label>

        {/* 5 Lagu Terakhir */}
        <div style={{ width: "100%", maxWidth: "400px", marginBottom: "32px" }}>
          <strong style={{ display: "block", marginBottom: "16px", fontSize: "0.95rem" }}>5 lagu terakhir</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {metadata.history.length > 0 ? metadata.history.slice(0, 5).map((item) => {
              const hasHistoryCoverArt = Boolean(item.albumArtUrl);
              return (
              <div key={`${item.artist}-${item.title}-${item.playedAt}`} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={item.albumArtUrl || "/iconSBL.svg"} alt="" style={{ width: hasHistoryCoverArt ? "100%" : "60%", height: hasHistoryCoverArt ? "100%" : "60%", objectFit: hasHistoryCoverArt ? "cover" : "contain" }} />
                </div>
                <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.artist} - {item.title}
                </span>
              </div>
            )}) : (
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src="/iconSBL.svg" alt="" style={{ width: "60%", height: "60%", objectFit: "contain" }} />
                </div>
                <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600 }}>SBL RADIO - Live Streaming</span>
              </div>
            )}
          </div>
        </div>

        {/* Request Lagu Button */}
        <button
          onClick={() => setRequestFormOpen(!requestFormOpen)}
          style={{ width: "100%", maxWidth: "400px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 800, fontSize: "1rem", cursor: "pointer", marginBottom: "24px" }}
        >
          Request lagu
          <ChevronRight size={20} style={{ transform: requestFormOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {requestFormOpen && (
          <form onSubmit={handleSongRequestSubmit} style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Nama" style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
              <input value={requesterWhatsapp} onChange={(e) => setRequesterWhatsapp(e.target.value)} placeholder="WA opsional" style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <input value={songArtist} onChange={(e) => setSongArtist(e.target.value)} placeholder="Penyanyi" style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
              <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Judul lagu" required style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
            </div>
            <textarea value={songMessage} onChange={(e) => setSongMessage(e.target.value)} placeholder="Pesan singkat opsional" rows={2} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600, resize: "vertical" }} />
            
            {songRequestError && <p style={{ background: "rgba(255,87,87,0.2)", color: "#FFD1D1", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", margin: 0 }}>{songRequestError}</p>}
            {songRequestNotice && <p style={{ background: "rgba(24,163,74,0.2)", color: "#D1FFD1", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", margin: 0 }}>{songRequestNotice}</p>}
            
            <button type="submit" style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "white", color: "#1665D8", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "1rem" }}>Kirim request</button>
          </form>
        )}

        {/* Bottom Action Row */}
        <div style={{ width: "100%", maxWidth: "400px", display: "flex", gap: "16px", marginTop: "auto" }}>
          <a href={websiteUrl} target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem" }}>
            <Globe size={24} /> Website
          </a>
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem" }}>
            <MessageSquareText size={24} /> WhatsApp
          </a>
          <button type="button" onClick={handleShareStream} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            <Share2 size={24} /> Bagikan
          </button>
        </div>

      </div>
    </div>
  );
}
