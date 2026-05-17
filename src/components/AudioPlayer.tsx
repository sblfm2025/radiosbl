import { Pause, Play, Radio, Volume2 } from "lucide-react";
import { Waveform } from "./Waveform";
import { useGlobalAudio } from "../contexts/useGlobalAudio";

type AudioPlayerProps = {
  streamUrl: string;
  frequency: string;
  programTitle: string;
  announcer: string;
};

export function AudioPlayer({
  frequency,
  programTitle,
  announcer
}: AudioPlayerProps) {
  const { playing, togglePlayback, error } = useGlobalAudio();

  return (
    <section className={`audio-player${playing ? " playing" : ""}`} aria-label="Pemutar radio">
      <div>
        <p className="eyebrow">ON AIR {frequency}</p>
        <h3>{programTitle}</h3>
        <p className="muted">{announcer}</p>
      </div>
      <Waveform playing={playing} />
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
