import { useState, useEffect, useRef } from "react";
import type { ProgramEpisode } from "../services/episode.service";
import { useEpisodeProgress } from "../hooks/useEpisodeProgress";
import { useGlobalAudio } from "../../../contexts/useGlobalAudio";
import { Play, Pause, X } from "lucide-react";
import "../styles/contentHub.css";

type EpisodePlayerProps = {
  episode: ProgramEpisode;
  onClose: () => void;
};

export function EpisodePlayer({ episode, onClose }: EpisodePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const { getProgress, saveProgress, clearProgress } = useEpisodeProgress();
  const { playing: livePlaying, togglePlayback: toggleLivePlayback } = useGlobalAudio();
  
  const [showResumeOffer, setShowResumeOffer] = useState(false);
  const [savedOffset, setSavedOffset] = useState(0);
  const lastSavedTimeRef = useRef(0);

  useEffect(() => {
    if (livePlaying) {
      toggleLivePlayback();
    }

    const audio = new Audio(episode.audioUrl);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play().catch(err => console.warn("Autoplay podcast diblokir:", err));

    const saved = getProgress(episode.episodeId);
    if (saved && saved.currentTime > 5) {
      setSavedOffset(saved.currentTime);
      setShowResumeOffer(true);
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      const now = Date.now();
      if (now - lastSavedTimeRef.current > 15000) {
        saveProgress(episode.episodeId, audio.currentTime, audio.duration || episode.durationSeconds || 0);
        lastSavedTimeRef.current = now;
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      clearProgress(episode.episodeId);
      onClose();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      if (audioRef.current) {
        saveProgress(episode.episodeId, audioRef.current.currentTime, audioRef.current.duration || 0);
      }
      audio.pause();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [episode, livePlaying, toggleLivePlayback, getProgress, saveProgress, clearProgress, onClose]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (livePlaying) toggleLivePlayback();
      audioRef.current.play().catch(err => console.error(err));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const value = Number(e.target.value);
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleResumePlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = savedOffset;
    setCurrentTime(savedOffset);
    setShowResumeOffer(false);
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return "00:00";
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="episode-player-bar" data-testid="episode-player-bar">
      {showResumeOffer && (
        <div className="resume-playback-badge" data-testid="resume-playback-badge">
          <span>
            Progres terakhir terdeteksi di <strong>{formatTime(savedOffset)}</strong>.
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleResumePlayback} data-testid="btn-resume-playback">
              Lanjutkan
            </button>
            <button
              onClick={() => setShowResumeOffer(false)}
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              Mulai Baru
            </button>
          </div>
        </div>
      )}

      <div className="episode-player-layout">
        <div className="episode-player-info">
          <img src={episode.coverImageUrl || "/LogoSBL.svg"} alt="" />
          <div className="episode-player-text">
            <strong>{episode.title}</strong>
            <span>{episode.programTitle}</span>
          </div>
        </div>

        <div className="episode-player-controls">
          <button
            onClick={handlePlayPause}
            className="episode-player-play-btn"
            aria-label={isPlaying ? "Jeda" : "Putar"}
            data-testid="btn-play-pause-podcast"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: "2px" }} />}
          </button>
          
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}
            aria-label="Tutup Player"
            data-testid="btn-close-podcast"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="episode-player-timeline">
        <span className="episode-player-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || episode.durationSeconds || 100}
          value={currentTime}
          onChange={handleSliderChange}
          className="episode-player-slider"
          aria-label="Progres waktu"
        />
        <span className="episode-player-time">{formatTime(duration || episode.durationSeconds || 0)}</span>
      </div>
    </div>
  );
}
