import { SearchCheck } from "lucide-react";
import type { SongRequest } from "../../types/domain";

type SongRequestMatchPanelProps = {
  request: SongRequest;
};

export function SongRequestMatchPanel({ request }: SongRequestMatchPanelProps) {
  return (
    <div className="song-review-match-panel">
      <SearchCheck size={16} />
      <span>
        <strong>{request.matchStatus || "unmatched"}</strong>
        <small>
          Confidence {request.confidence ?? 0}%{request.matchedFilePath ? ` - ${request.matchedFilePath}` : ""}
        </small>
      </span>
    </div>
  );
}
