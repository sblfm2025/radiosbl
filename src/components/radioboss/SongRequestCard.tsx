import { Check, ListMusic, Radio, Search, XCircle } from "lucide-react";
import type { SongRequest } from "../../types/domain";
import { SongRequestManualSearch } from "./SongRequestManualSearch";
import { SongRequestMatchPanel } from "./SongRequestMatchPanel";

type SongRequestCardProps = {
  request: SongRequest;
  busy: boolean;
  onMatch: (request: SongRequest) => void;
  onSend: (request: SongRequest) => void;
  onPlayed: (request: SongRequest) => void;
  onReject: (request: SongRequest) => void;
  onManualFile: (request: SongRequest, trackId: string, filePath: string) => void;
};

function getSongTitle(request: SongRequest): string {
  return [request.artist, request.title].filter(Boolean).join(" - ");
}

export function SongRequestCard({
  request,
  busy,
  onMatch,
  onSend,
  onPlayed,
  onReject,
  onManualFile
}: SongRequestCardProps) {
  const canSend = Boolean(
    request.matchedTrackId &&
    request.matchedFilePath &&
    ["matched", "needs_review", "sent_to_radioboss", "queued"].includes(request.status)
  );

  return (
    <article className="song-review-card">
      <div className="song-review-card-head">
        <span>
          <ListMusic size={18} />
        </span>
        <div>
          <strong>{getSongTitle(request)}</strong>
          <small>Dari {request.requesterName} - {request.status}</small>
        </div>
      </div>

      {request.message && <p>{request.message}</p>}
      <SongRequestMatchPanel request={request} />

      <div className="song-review-actions">
        <button type="button" disabled={busy} onClick={() => onMatch(request)}>
          <Search size={16} />
          Cocokkan ke Library
        </button>
        <button type="button" disabled={busy || !canSend} onClick={() => onSend(request)}>
          <Radio size={16} />
          Kirim ke RadioBOSS
        </button>
        <button type="button" disabled={busy || request.status === "played"} onClick={() => onPlayed(request)}>
          <Check size={16} />
          Tandai Diputar
        </button>
        <SongRequestManualSearch onApply={(trackId, filePath) => onManualFile(request, trackId, filePath)} />
        <button type="button" className="danger" disabled={busy || request.status === "rejected"} onClick={() => onReject(request)}>
          <XCircle size={16} />
          Tolak Request
        </button>
      </div>
    </article>
  );
}
