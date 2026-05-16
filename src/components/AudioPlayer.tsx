import { Pause, Play, Radio, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { Waveform } from "./Waveform";

type AudioPlayerProps = {
  streamUrl: string;
  frequency: string;
  programTitle: string;
  announcer: string;
};

export function AudioPlayer({
  streamUrl,
  frequency,
  programTitle,
  announcer
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    setError("");

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setError("Stream belum bisa diputar. Coba ulangi dari tombol play.");
      setPlaying(false);
    }
  }

  return (
    <section className="audio-player" aria-label="Pemutar radio">
      <audio
        ref={audioRef}
        preload="none"
        src={streamUrl}
        onPause={() => setPlaying(false)}
        onPlaying={() => setPlaying(true)}
        onError={() => {
          setError("Stream tidak merespons.");
          setPlaying(false);
        }}
      >
        <track kind="captions" />
      </audio>
      <div>
        <p className="eyebrow">ON AIR {frequency}</p>
        <h3>{programTitle}</h3>
        <p className="muted">{announcer}</p>
      </div>
      <Waveform />
      {error && <p className="player-error">{error}</p>}
      <div className="player-controls">
        <span className="icon-button" aria-label="Status stream">
          <Radio size={18} />
        </span>
        <button
          type="button"
          className="play-button"
          aria-label={playing ? "Jeda stream" : "Putar stream"}
          onClick={togglePlayback}
        >
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <span className="icon-button" aria-label="Volume">
          <Volume2 size={18} />
        </span>
      </div>
    </section>
  );
}
