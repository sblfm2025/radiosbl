import { CheckCircle2, ListMusic, Radio, Search, XCircle } from "lucide-react";
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

function getRequestMessage(request: SongRequest): string {
  return request.rawMessage || request.message || request.dedication || "";
}

function isWhatsAppRequest(request: SongRequest): boolean {
  return request.channel === "whatsapp" || request.source === "whatsapp";
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
    ["matched", "needs_review"].includes(request.status)
  );
  const whatsappRequest = isWhatsAppRequest(request);
  const readOnlyRequest = whatsappRequest || request.status === "queued" || request.status === "sent_to_radioboss";

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

      {getRequestMessage(request) && <p>{getRequestMessage(request)}</p>}
      <SongRequestMatchPanel request={request} />

      {readOnlyRequest ? (
        <div className="song-review-status-note">
          <CheckCircle2 size={16} />
          <span>Sudah masuk ke RadioBOSS. Penyiar/operator memilih atau mengganti lagu langsung di studio.</span>
        </div>
      ) : (
        <div className="song-review-actions">
        {!whatsappRequest && (
          <button type="button" disabled={busy} onClick={() => onMatch(request)}>
            <Search size={16} />
            Cocokkan ke Library
          </button>
        )}
        {!whatsappRequest && (
          <button type="button" disabled={busy || !canSend} onClick={() => onSend(request)}>
            <Radio size={16} />
            Kirim ke RadioBOSS
          </button>
        )}
        {!whatsappRequest && <SongRequestManualSearch onApply={(trackId, filePath) => onManualFile(request, trackId, filePath)} />}
        <button type="button" className="danger" disabled={busy || request.status === "rejected"} onClick={() => onReject(request)}>
          <XCircle size={16} />
          Tolak Request
        </button>
      </div>
      )}
    </article>
  );
}
