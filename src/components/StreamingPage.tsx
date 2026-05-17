import { useState, useEffect, useRef, type FormEvent } from "react";
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



  return (
    <div className="streaming-container" style={{ background: "#1665D8", minHeight: "100vh", color: "white", padding: "24px 20px 100px", display: "flex", flexDirection: "column" }}>
      <style>
        {`
          .streaming-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }
          .streaming-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }
          @media (min-width: 768px) {
            .streaming-container {
               padding: 60px 20px 100px !important;
               display: flex;
               justify-content: flex-start;
               align-items: center;
            }
            .streaming-content {
               flex-direction: column !important;
               align-items: center !important;
               justify-content: flex-start !important;
               gap: 16px !important;
               max-width: 480px !important;
               margin: 0 auto;
               background: rgba(255,255,255,0.02);
               padding: 40px;
               border-radius: 32px;
               box-shadow: 0 20px 80px rgba(0,0,0,0.2);
               border: 1px solid rgba(255,255,255,0.05);
            }
            .streaming-col {
               width: 100% !important;
            }
            .streaming-header {
               max-width: 480px !important;
               padding: 0 !important;
            }
          }
          @keyframes idlePulse {
            0% { transform: scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.2), 0 0 0 0 rgba(255,255,255, 0.1); }
            50% { transform: scale(1.02); box-shadow: 0 15px 40px rgba(0,0,0,0.3), 0 0 0 20px rgba(255,255,255, 0.05); }
            100% { transform: scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.2), 0 0 0 0 rgba(255,255,255, 0.1); }
          }
          @keyframes activePulse {
            0% { transform: scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,255,255, 0.3); }
            100% { transform: scale(1.04); box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 30px rgba(255,255,255, 0); }
          }
          @keyframes smoothWave {
            0%, 100% { transform: scaleY(0.3); opacity: 0.2; }
            50% { transform: scaleY(1); opacity: 0.9; }
          }
          @keyframes glowRequest {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); transform: scale(1); }
            50% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); transform: scale(1.02); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); transform: scale(1); }
          }
        `}
      </style>
      {/* Header Bar */}
      <div className="streaming-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1000px", width: "100%", margin: "0 auto 24px" }}>
        <button type="button" aria-label="Kembali" onClick={onExit} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ fontSize: "1rem", fontWeight: 700 }}>Sedang Mengudara <ChevronRight size={16} style={{ transform: "rotate(90deg)", display: "inline-block", verticalAlign: "middle" }}/></div>
        <button type="button" onClick={() => setRequestFormOpen((open) => !open)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }} aria-label="Buka request lagu">
          <Radio size={24} />
        </button>
      </div>

      <div className="streaming-content">
        <div className="streaming-col" style={{ position: "relative" }}>
          {/* Giant Logo with Radial Spectrum */}
          <div style={{ position: "relative", width: "190px", height: "190px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", zIndex: 1 }}>
             {/* Inner Static Rings */}
             <div style={{ position: "absolute", inset: "-10px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", pointerEvents: "none" }}></div>
             <div style={{ position: "absolute", inset: "-20px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "50%", pointerEvents: "none" }}></div>

             {/* Smooth Radial Spectrum Visualizer */}
             {playing && Array.from({ length: 120 }).map((_, i) => {
               const angle = (i / 120) * Math.PI * 2;
               // Simulated audio waveform base
               const baseHeight = 15 + Math.abs(Math.sin(angle * 4)) * 15 + Math.abs(Math.cos(angle * 7)) * 10;
               return (
                 <div key={i} style={{
                   position: "absolute",
                   top: "50%",
                   left: "50%",
                   width: "2px",
                   marginLeft: "-1px",
                   transformOrigin: "0 0",
                   transform: `rotate(${i * 3}deg)`
                 }}>
                    <div style={{
                      position: "absolute",
                      top: "125px",
                      left: 0,
                      width: "100%",
                      background: "rgba(255,255,255,0.9)",
                      borderRadius: "1px",
                      height: `${baseHeight}px`,
                      transformOrigin: "top",
                      animation: `smoothWave 1.2s infinite ease-in-out`,
                      animationDelay: `${-i * 0.04}s`
                    }} />
                 </div>
               );
             })}

             {/* Animated Logo / Cover Art Circle */}
             <div style={{ 
                 position: "relative", width: "100%", height: "100%", background: "white", borderRadius: "50%", 
                 padding: metadata.albumArtUrl ? "0" : "16px", display: "flex", alignItems: "center", justifyContent: "center", 
                 animation: playing ? "activePulse 0.5s infinite alternate ease-in-out" : "idlePulse 3s infinite alternate ease-in-out",
                 zIndex: 2,
                 overflow: "hidden"
             }}>
                <img 
                  src={metadata.albumArtUrl || "/LogoSBL.svg"} 
                  alt={metadata.albumArtUrl ? "Cover Album" : "SBL"} 
                  style={{ 
                    width: metadata.albumArtUrl ? "100%" : "80%", 
                    height: metadata.albumArtUrl ? "100%" : "80%", 
                    objectFit: metadata.albumArtUrl ? "cover" : "contain" 
                  }} 
                />
             </div>
          </div>

          <h2 ref={scrollTargetRef} style={{ fontSize: "1.8rem", margin: "0 0 8px", fontWeight: 800, textAlign: "center", zIndex: 1, position: "relative", scrollMarginTop: "24px" }}>{metadata.title || "Live Streaming"}</h2>
          <p style={{ margin: "0 0 4px", fontSize: "1rem", opacity: 0.9, textAlign: "center", zIndex: 1, position: "relative" }}>{metadata.artist || "SBL RADIO"}</p>
          <p style={{ margin: "0 0 4px", fontSize: "0.85rem", opacity: 0.8 }}>Program: {currentSlot.title}</p>
          {currentAnnouncer && (
            <p style={{ margin: "0 0 4px", fontSize: "0.85rem", opacity: 0.8 }}>
              Penyiar: {currentAnnouncer}
            </p>
          )}
          <p style={{ margin: "0 0 20px", fontSize: "0.85rem", opacity: 0.8 }}>{currentSlot.time} WITA</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "20px", width: "100%", maxWidth: "340px", marginBottom: "24px" }}>
             <div style={{ display: "flex", justifyContent: "flex-end" }}>
               <span style={{ padding: "8px 16px", minWidth: "120px", boxSizing: "border-box", borderRadius: "999px", background: "rgba(255,255,255,0.15)", fontSize: "0.8rem", fontWeight: 800, whiteSpace: "nowrap", textAlign: "center", display: "inline-block" }}>{stationFrequency}</span>
             </div>
             <button 
               onClick={togglePlayback}
               style={{ width: "80px", height: "80px", borderRadius: "50%", background: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
             >
               {playing ? <Pause size={36} color="#1665D8" /> : <Play size={36} color="#1665D8" style={{ marginLeft: "4px" }} />}
             </button>
             <div style={{ display: "flex", justifyContent: "flex-start" }}>
               <span style={{ padding: "8px 16px", minWidth: "120px", boxSizing: "border-box", borderRadius: "999px", background: metadata.isOnline ? "#FF4B4B" : "rgba(255,255,255,0.15)", fontSize: "0.8rem", fontWeight: 800, whiteSpace: "nowrap", textAlign: "center", display: "inline-block" }}>{metadata.isOnline ? "ON AIR" : "OFF AIR"}</span>
             </div>
          </div>

          <label style={{ width: "100%", maxWidth: "320px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
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
        </div>

        <div className="streaming-col">
          {/* 5 Lagu Terakhir Slideshow */}
          <div style={{ width: "100%", maxWidth: "400px", marginBottom: "16px", padding: "16px 20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "16px", position: "relative", overflow: "hidden" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <strong style={{ fontSize: "0.9rem", opacity: 0.9 }}>5 lagu terakhir</strong>
               <ChevronRight size={18} opacity={0.8} />
             </div>
             
             {/* Slideshow item */}
             <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               {metadata.history.length > 0 ? (
                 <>
                   <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                     <img 
                        src={metadata.history[historyIndex]?.albumArtUrl || "/iconSBL.svg"} 
                        alt="" 
                        style={{ width: metadata.history[historyIndex]?.albumArtUrl ? "100%" : "60%", height: metadata.history[historyIndex]?.albumArtUrl ? "100%" : "60%", objectFit: metadata.history[historyIndex]?.albumArtUrl ? "cover" : "contain" }} 
                     />
                   </div>
                   <div style={{ flex: 1, overflow: "hidden" }}>
                     <div style={{ fontSize: "1rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>
                       {metadata.history[historyIndex]?.title || "SBL RADIO"}
                     </div>
                     <div style={{ fontSize: "0.85rem", opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                       {metadata.history[historyIndex]?.artist || "Live Streaming"}
                     </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                     <img src="/iconSBL.svg" alt="" style={{ width: "60%", height: "60%", objectFit: "contain" }} />
                   </div>
                   <div style={{ flex: 1, overflow: "hidden" }}>
                     <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>SBL RADIO</div>
                     <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Live Streaming</div>
                   </div>
                 </>
               )}
             </div>
          </div>

          {/* Request Lagu Button */}
          <button
            onClick={() => {
              const nextState = !requestFormOpen;
              setRequestFormOpen(nextState);
              if (nextState) {
                setTimeout(() => {
                  scrollTargetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 150);
              }
            }}
            style={{ 
              width: "100%", maxWidth: "400px", display: "flex", justifyContent: "space-between", alignItems: "center", 
              padding: "14px 20px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", 
              border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 800, fontSize: "1.1rem", 
              cursor: "pointer", marginBottom: "24px", 
              animation: requestFormOpen ? "none" : "glowRequest 2s infinite ease-in-out" 
            }}
          >
            REQUEST
            <ChevronRight size={24} style={{ transform: requestFormOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {requestFormOpen && (
            <form onSubmit={handleSongRequestSubmit} style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Nama" style={{ padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
                <input value={requesterWhatsapp} onChange={(e) => setRequesterWhatsapp(e.target.value)} placeholder="WA opsional" style={{ padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
                <input value={requesterCity} onChange={(e) => setRequesterCity(e.target.value)} placeholder="Alamat/Kota" style={{ gridColumn: "1 / -1", padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
                <input value={songArtist} onChange={(e) => setSongArtist(e.target.value)} placeholder="Penyanyi" style={{ padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
                <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Judul lagu" required style={{ padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600 }} />
              </div>
              <textarea value={songMessage} onChange={(e) => setSongMessage(e.target.value)} placeholder="Pesan singkat opsional" rows={2} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", outline: "none", color: "var(--ink)", fontWeight: 600, resize: "vertical" }} />
              
              {songRequestError && <p style={{ background: "rgba(255,87,87,0.2)", color: "#FFD1D1", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", margin: 0 }}>{songRequestError}</p>}
              {songRequestNotice && <p style={{ background: "rgba(24,163,74,0.2)", color: "#D1FFD1", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", margin: 0 }}>{songRequestNotice}</p>}
              
              <button type="submit" style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "white", color: "#1665D8", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "1rem" }}>Kirim request</button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}
