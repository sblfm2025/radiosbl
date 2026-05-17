import { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import { ChevronRight, Radio, Play, Pause, Volume2, ChevronLeft } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { SongRequest } from "../types/domain";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";
import { useGlobalAudio } from "../contexts/useGlobalAudio";
import { findAnnouncerProfile } from "../utils/announcerResolver";
import { subscribeSongRequests, submitSongRequest } from "../services/songRequest.service";

export function StreamingPage({
  data,
  onAirAnnouncer,
  onAirAnnouncers,
  onExit
}: {
  data: DashboardSnapshot;
  onAirAnnouncer: string;
  onAirAnnouncers?: string[];
  onExit: () => void;
}) {
  const currentSlot = useCurrentBroadcastSlot();
  const [activeAnnouncerIndex, setActiveAnnouncerIndex] = useState(0);
  const presentAnnouncers = useMemo(() => {
    const names = onAirAnnouncers && onAirAnnouncers.length > 0
      ? onAirAnnouncers
      : onAirAnnouncer.split(/\s+\/\s+/).filter(Boolean);
    return names;
  }, [onAirAnnouncer, onAirAnnouncers]);
  const presentAnnouncerKey = presentAnnouncers.join("|");
  const currentAnnouncer = presentAnnouncers[activeAnnouncerIndex % Math.max(presentAnnouncers.length, 1)] ?? "";
  const activeAnnouncerAirName = currentAnnouncer.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const firstScheduledAnnouncer = currentSlot.type === "main"
    ? currentSlot.announcer.split(/\s*(?:\/|&|,)\s*/)[0]
    : "";
  const activeAnnouncerProfile = currentAnnouncer
    ? findAnnouncerProfile(activeAnnouncerAirName) ?? findAnnouncerProfile(firstScheduledAnnouncer)
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
  const [requesterCity, setRequesterCity] = useState("");
  const [requesterWhatsapp, setRequesterWhatsapp] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songMessage, setSongMessage] = useState("");
  const [songRequestError, setSongRequestError] = useState("");
  const [songRequestNotice, setSongRequestNotice] = useState("");
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const scrollTargetRef = useRef<HTMLHeadingElement>(null);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setActiveAnnouncerIndex(0);

    if (presentAnnouncers.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveAnnouncerIndex((current) => (current + 1) % presentAnnouncers.length);
    }, 4_000);

    return () => window.clearInterval(intervalId);
  }, [presentAnnouncerKey, presentAnnouncers.length]);

  // Auto-slide history
  useEffect(() => {
    if (!metadata.history || metadata.history.length <= 1) return;
    const interval = setInterval(() => {
      setHistoryIndex((prev) => (prev + 1) % Math.min(metadata.history.length, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [metadata.history]);

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
        requesterName: requesterCity.trim() ? `${requesterName} (di ${requesterCity})` : requesterName,
        requesterWhatsapp,
        artist: songArtist,
        title: songTitle,
        message: songMessage,
        announcer: activeAnnouncerProfile,
        programTitle: currentSlot.title
      });

      setSongRequests([request, ...songRequests].slice(0, 25));
      setRequesterCity("");
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

  const currentHistory = metadata.history[historyIndex];
  const historyHasCover = Boolean(currentHistory?.albumArtUrl);
  const mainHasCover = Boolean(metadata.albumArtUrl);

  return (
    <div className="streaming-container">
      <div className="streaming-header">
        <button type="button" aria-label="Kembali" onClick={onExit}>
          <ChevronLeft size={28} />
        </button>
        <div className="streaming-header-title">
          Sedang Mengudara <ChevronRight size={16} />
        </div>
        <button type="button" onClick={() => setRequestFormOpen((open) => !open)} aria-label="Buka request lagu">
          <Radio size={24} />
        </button>
      </div>

      <section className="streaming-now-summary" aria-label="Ringkasan siaran">
        <article>
          <span>Status</span>
          <strong>{metadata.isOnline ? "ON AIR" : "OFF AIR"}</strong>
        </article>
        <article>
          <span>Program</span>
          <strong>{currentSlot.title}</strong>
        </article>
        <article>
          <span>Penyiar</span>
          <strong>{currentAnnouncer || "Radio SBL"}</strong>
        </article>
      </section>

      <div className="streaming-content">
        <div className="streaming-col streaming-main-col">
          <div className={`streaming-visual ${playing ? "playing" : ""}`}>
            <div className="streaming-ring inner"></div>
            <div className="streaming-ring outer"></div>
            {playing && (
              <div className="streaming-spectrum" aria-hidden="true">
                {Array.from({ length: 24 }).map((_, index) => (
                  <span key={index}></span>
                ))}
              </div>
            )}

            <div className={`streaming-art ${playing ? "playing" : ""} ${mainHasCover ? "has-cover" : ""}`}>
              <img
                src={metadata.albumArtUrl || "/LogoSBL.svg"}
                alt={metadata.albumArtUrl ? "Cover Album" : "SBL"}
              />
            </div>
          </div>

          <h2 ref={scrollTargetRef} className="streaming-track-title">{metadata.title || "Live Streaming"}</h2>
          <p className="streaming-track-artist">{metadata.artist || "SBL RADIO"}</p>
          <p className="streaming-track-meta">Program: {currentSlot.title}</p>
          {currentAnnouncer && (
            <p className="streaming-track-meta" title={presentAnnouncers.join(" / ")}>
              Penyiar: {currentAnnouncer}
            </p>
          )}
          <p className="streaming-track-time">{currentSlot.time} WITA</p>

          <div className="streaming-play-row">
            <div><span>{stationFrequency}</span></div>
            <button type="button" onClick={togglePlayback} className="streaming-play-button" aria-label={playing ? "Pause streaming" : "Putar streaming"}>
              {playing ? <Pause size={32} /> : <Play size={32} className="streaming-play-icon" />}
            </button>
            <div><span className={metadata.isOnline ? "on-air" : ""}>{metadata.isOnline ? "ON AIR" : "OFF AIR"}</span></div>
          </div>

          <label className="streaming-volume">
            <Volume2 size={20} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="streaming-col">
          <div className="streaming-history-card">
            <div className="streaming-history-head">
              <strong>5 lagu terakhir</strong>
              <ChevronRight size={18} />
            </div>
            <div className="streaming-history-item">
              <div className={`streaming-history-cover ${historyHasCover ? "has-cover" : ""}`}>
                <img src={currentHistory?.albumArtUrl || "/iconSBL.svg"} alt="" />
              </div>
              <div className="streaming-history-copy">
                <strong>{currentHistory?.title || "SBL RADIO"}</strong>
                <span>{currentHistory?.artist || "Live Streaming"}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`streaming-request-toggle ${requestFormOpen ? "open" : ""}`}
            onClick={() => {
              const nextState = !requestFormOpen;
              setRequestFormOpen(nextState);
              if (nextState) {
                setTimeout(() => {
                  scrollTargetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 150);
              }
            }}
          >
            REQUEST
            <ChevronRight size={24} />
          </button>

          {requestFormOpen && (
            <form onSubmit={handleSongRequestSubmit} className="streaming-request-form">
              <div className="streaming-request-grid">
                <input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Nama" />
                <input value={requesterWhatsapp} onChange={(e) => setRequesterWhatsapp(e.target.value)} placeholder="WA opsional" />
                <input className="wide" value={requesterCity} onChange={(e) => setRequesterCity(e.target.value)} placeholder="Alamat/Kota" />
                <input value={songArtist} onChange={(e) => setSongArtist(e.target.value)} placeholder="Penyanyi" />
                <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Judul lagu" required />
              </div>
              <textarea value={songMessage} onChange={(e) => setSongMessage(e.target.value)} placeholder="Pesan singkat opsional" rows={2} />
              
              {songRequestError && <p className="streaming-request-alert error">{songRequestError}</p>}
              {songRequestNotice && <p className="streaming-request-alert success">{songRequestNotice}</p>}
              
              <button type="submit" className="streaming-request-submit">Kirim request</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
