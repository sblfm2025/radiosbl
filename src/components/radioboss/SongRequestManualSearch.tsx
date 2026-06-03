import { FolderSearch } from "lucide-react";
import { useState } from "react";

type SongRequestManualSearchProps = {
  onApply: (trackId: string, filePath: string) => void;
};

export function SongRequestManualSearch({ onApply }: SongRequestManualSearchProps) {
  const [open, setOpen] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [filePath, setFilePath] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        <FolderSearch size={16} />
        Cari File Manual
      </button>
    );
  }

  return (
    <div className="song-review-manual-search">
      <input value={trackId} onChange={(event) => setTrackId(event.target.value)} placeholder="Track ID" />
      <input value={filePath} onChange={(event) => setFilePath(event.target.value)} placeholder="Path file di library PC studio" />
      <button
        type="button"
        onClick={() => {
          if (!trackId.trim() || !filePath.trim()) return;
          onApply(trackId.trim(), filePath.trim());
          setOpen(false);
        }}
      >
        Pakai file
      </button>
    </div>
  );
}
