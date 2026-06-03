import type { SongRequest } from "../../types/domain";
import { SongRequestCard } from "./SongRequestCard";

type SongRequestQueueProps = {
  requests: SongRequest[];
  busy: boolean;
  onMatch: (request: SongRequest) => void;
  onSend: (request: SongRequest) => void;
  onPlayed: (request: SongRequest) => void;
  onReject: (request: SongRequest) => void;
  onManualFile: (request: SongRequest, trackId: string, filePath: string) => void;
};

export function SongRequestQueue(props: SongRequestQueueProps) {
  if (props.requests.length === 0) {
    return (
      <div className="radioboss-empty-state">
        <strong>Belum ada request untuk diinspeksi</strong>
        <p>Request baru, matched, needs_review, atau sudah dikirim ke RadioBOSS akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div className="song-review-queue">
      {props.requests.map((request) => (
        <SongRequestCard key={request.id} request={request} {...props} />
      ))}
    </div>
  );
}
