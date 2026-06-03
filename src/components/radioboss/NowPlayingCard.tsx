import { Music2 } from "lucide-react";
import {
  formatRelativeTime,
  type RadioBossNowPlaying
} from "../../services/radioboss/radiobossStatus.service";

type NowPlayingCardProps = {
  nowPlaying: RadioBossNowPlaying | null;
};

function formatTrack(nowPlaying: RadioBossNowPlaying | null): string {
  const title = nowPlaying?.title?.trim();
  const artist = nowPlaying?.artist?.trim();

  if (title && artist) return `${title} - ${artist}`;
  if (nowPlaying?.rawTitle?.trim()) return nowPlaying.rawTitle.trim();
  if (title) return title;
  return "Belum ada metadata lagu";
}

export function NowPlayingCard({ nowPlaying }: NowPlayingCardProps) {
  const progress = Math.max(0, Math.min(100, nowPlaying?.progressPercent ?? 0));
  const nextTrack = [nowPlaying?.nextTitle, nowPlaying?.nextArtist].filter(Boolean).join(" - ");

  return (
    <article className="radioboss-now-playing">
      <span className="radioboss-now-icon" aria-hidden="true">
        <Music2 size={18} />
      </span>
      <div className="radioboss-now-copy">
        <span>Now Playing</span>
        <strong>{formatTrack(nowPlaying)}</strong>
        <small>Update {formatRelativeTime(nowPlaying?.updatedAt)}</small>
        {nextTrack && <small>Berikutnya: {nextTrack}</small>}
      </div>
      <div className="radioboss-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}
