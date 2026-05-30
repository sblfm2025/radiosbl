import type { PlayerStatusType } from "../../../contexts/audioContextState";
import "../styles/listening.css";

export function PlayerStatusBadge({ status }: { status?: PlayerStatusType }) {
  if (!status || status === "paused") return null;

  let badgeClass = "";
  let label = "";

  switch (status) {
    case "live":
      badgeClass = "player-status-live";
      label = "LIVE";
      break;
    case "buffering":
      badgeClass = "player-status-buffering";
      label = "Memuat...";
      break;
    case "reconnecting":
      badgeClass = "player-status-reconnecting";
      label = "Menghubungkan...";
      break;
    case "error":
      badgeClass = "player-status-error";
      label = "Error";
      break;
    case "timer-ended":
      badgeClass = "player-status-timer-ended";
      label = "Timer Selesai";
      break;
    default:
      return null;
  }

  return (
    <span className={`player-status-badge ${badgeClass}`} data-testid="player-status-badge">
      {(status === "live" || status === "buffering" || status === "reconnecting") && (
        <span className="player-status-dot" />
      )}
      {label}
    </span>
  );
}
