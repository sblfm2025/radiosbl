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

export function AudioProvider({ children, streamUrl, frequency, programTitle, announcer }: { children: ReactNode, streamUrl: string, frequency: string, programTitle: string, announcer: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(0.82);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolumeState] = useState(0.82);
  const [metadata, setMetadata] = useState<RadioMetadata>(radioMetadataFallback);
  const [isExpanded, setIsExpanded] = useState(false);
  const sweeperRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedSweeperRef = useRef(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatusType>("paused");

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
    };

    return audio;
  }, [streamUrl]);

  useEffect(() => {
    audioRef.current = buildAudio();

    return () => {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.src = "";
        audioRef.current.load();
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
