import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  fetchRadioMetadata,
  radioMetadataFallback,
  type RadioMetadata
} from "../services/radioMetadata.service";
import { AudioContext, type PlayerStatusType } from "./audioContextState";
import { trackStreamingError } from "../features/analytics/services/streamingError.service";
import { readLocalSessions } from "../features/analytics/services/listenerAnalytics.service";
import { getDeviceInfo } from "../features/analytics/utils/deviceInfo";
import { featureFlags } from "../config/featureFlags";

export function AudioProvider({ children, streamUrl, frequency, programTitle, announcer }: { children: ReactNode, streamUrl: string, frequency: string, programTitle: string, announcer: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(0.82);
  const lastErrorLogRef = useRef<{ key: string; at: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolumeState] = useState(0.82);
  const [metadata, setMetadata] = useState<RadioMetadata>(radioMetadataFallback);
  const [isExpanded, setIsExpanded] = useState(false);
  const sweeperRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedSweeperRef = useRef(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatusType>("paused");

  function getLatestActiveSessionId(): string | undefined {
    const sessions = readLocalSessions()
      .filter((session) => session.status === "active")
      .sort((a, b) => {
        const aTime = Date.parse(String(a.lastSeenAt));
        const bTime = Date.parse(String(b.lastSeenAt));
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
    return sessions[0]?.id;
  }

  const buildAudio = useCallback(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = volumeRef.current;
    audio.src = streamUrl;
    audio.onpause = () => {
      setPlaying(false);
      setPlayerStatus("paused");
    };
    audio.onplaying = () => {
      setError("");
      setPlaying(true);
      setPlayerStatus("live");
    };
    audio.onwaiting = () => {
      setPlayerStatus("buffering");
    };
    audio.onstalled = () => {
      setPlayerStatus("reconnecting");
    };
    audio.onemptied = () => {
      setPlayerStatus("reconnecting");
    };
    audio.onerror = () => {
      if (!audio.src || audio.networkState === HTMLMediaElement.NETWORK_EMPTY) {
        return;
      }

      const code = audio.error?.code;
      const reason =
        code === 2
          ? "Koneksi stream terputus."
          : code === 3
            ? "Format audio stream tidak bisa dibaca browser."
            : code === 4
              ? "Sumber stream tidak didukung browser."
              : "Stream belum merespons.";

      setError(`${reason} Coba tekan play sekali lagi.`);
      setPlaying(false);
      setPlayerStatus("error");

      // Track streaming error hanya saat analytics pendengar diaktifkan.
      if (featureFlags.listenerAnalytics) {
        try {
          const mappedEvent =
            code === 2
              ? "network_error"
              : code === 3 || code === 4
                ? "media_error"
                : "unknown";

          const device = getDeviceInfo();

          const errorKey = `${mappedEvent}:${reason}:${device.browser}:${device.os}:${programTitle || "Siaran Live"}`;
          const now = Date.now();
          const last = lastErrorLogRef.current;
          if (!last || last.key !== errorKey || now - last.at > 30_000) {
            lastErrorLogRef.current = { key: errorKey, at: now };
            void trackStreamingError({
              sessionId: getLatestActiveSessionId(),
              event: mappedEvent,
              message: reason,
              programTitle: programTitle || "Siaran Live",
              deviceType: device.type,
              browser: device.browser,
              os: device.os
            });
          }
        } catch (err) {
          console.warn("Gagal merekam log error streaming:", err);
        }
      }
    };

    return audio;
  }, [programTitle, streamUrl]);

  useEffect(() => {
    audioRef.current = buildAudio();

    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.onerror = null;
        audio.onpause = null;
        audio.onplaying = null;
        audio.onwaiting = null;
        audio.onstalled = null;
        audio.onemptied = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        audioRef.current = null;
      }
    };
  }, [buildAudio]);

  const refreshMetadata = useCallback(async () => {
    try {
      const nextMetadata = await fetchRadioMetadata();
      setMetadata(nextMetadata);
    } catch {
      setMetadata((current) => ({
        ...current,
        isOnline: false,
        updatedAt: new Date().toISOString()
      }));
    }
  }, []);

  useEffect(() => {
    void refreshMetadata();
    const intervalId = window.setInterval(() => {
      void refreshMetadata();
    }, 12_000);

    return () => window.clearInterval(intervalId);
  }, [refreshMetadata]);

  function setVolume(nextVolume: number) {
    const normalizedVolume = Math.min(1, Math.max(0, nextVolume));
    volumeRef.current = normalizedVolume;
    setVolumeState(normalizedVolume);
    if (audioRef.current) {
      audioRef.current.volume = normalizedVolume;
    }
  }

  async function togglePlayback() {
    let audio = audioRef.current;
    if (!audio) {
      audio = buildAudio();
      audioRef.current = audio;
    }

    setError("");

    if (playing) {
      if (sweeperRef.current) {
        sweeperRef.current.pause();
        sweeperRef.current = null;
      } else {
        audio.pause();
      }
      setPlaying(false);
      return;
    }

    if (!hasPlayedSweeperRef.current) {
      hasPlayedSweeperRef.current = true;
      const sweeper = new Audio('/sweepersbl.mp3');
      sweeperRef.current = sweeper;
      try {
        await sweeper.play();
        setPlaying(true);
        setPlayerStatus("live"); // Sweeper is playing
        sweeper.onended = async () => {
          sweeperRef.current = null;
          if (audioRef.current) {
            audioRef.current.load();
            setPlayerStatus("buffering"); // Loading radio stream
            await audioRef.current.play();
          }
        };
        return;
      } catch {
        sweeperRef.current = null;
        // fallback to normal radio start if sweeper fails
      }
    }

    try {
      if (audio.error || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        audio.pause();
        audio.src = streamUrl;
      }

      setPlayerStatus("buffering");
      audio.load();
      await audio.play();
      setPlaying(true);
    } catch (currentError) {
      audio.pause();
      const retryAudio = buildAudio();
      audioRef.current = retryAudio;

      try {
        setPlayerStatus("buffering");
        retryAudio.load();
        await retryAudio.play();
        setPlaying(true);
      } catch {
        const message =
          currentError instanceof DOMException && currentError.message
            ? currentError.message
            : "Browser belum bisa membuka stream.";
        setError(`${message} Jika tetap gagal, buka ulang halaman atau cek koneksi.`);
        setPlaying(false);
        setPlayerStatus("error");
      }
    }
  }

  return (
    <AudioContext.Provider
      value={{
        playing,
        error,
        togglePlayback,
        volume,
        setVolume,
        programTitle,
        announcer,
        frequency,
        streamUrl,
        metadata,
        refreshMetadata,
        isExpanded,
        setIsExpanded,
        playerStatus,
        setPlayerStatus
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
