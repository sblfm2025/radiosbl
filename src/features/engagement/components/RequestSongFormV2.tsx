import { useState, useEffect, type FormEvent } from "react";
import { submitSongRequestV2, subscribeSongRequestsV2, type SongRequestV2 } from "../services/requestSongStatus.service";
import "../styles/engagement.css";

type RequestSongFormV2Props = {
  activeProgramTitle?: string;
  activeProgramId?: string;
};

export function RequestSongFormV2({ activeProgramTitle, activeProgramId }: RequestSongFormV2Props) {
  const [senderName, setSenderName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  
  const [myRequestIds, setMyRequestIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("my_song_requests_ids");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [myRequests, setMyRequests] = useState<SongRequestV2[]>([]);

  useEffect(() => {
    localStorage.setItem("my_song_requests_ids", JSON.stringify(myRequestIds));
  }, [myRequestIds]);

  useEffect(() => {
    if (myRequestIds.length === 0) return;
    
    return subscribeSongRequestsV2((allRequests) => {
      const filtered = allRequests.filter(r => myRequestIds.includes(r.requestId));
      setMyRequests(filtered);
    });
  }, [myRequestIds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      const req = await submitSongRequestV2({
        senderName: senderName.trim() || "Pendengar SBL",
        songTitle: songTitle.trim(),
        artistName: artistName.trim(),
        message: message.trim(),
        targetProgramId: activeProgramId,
        targetProgramTitle: activeProgramTitle
      });

      setMyRequestIds(prev => [req.requestId, ...prev]);
      setSongTitle("");
      setArtistName("");
      setMessage("");
      setNotice("Request lagu berhasil dikirim. Melacak status...");
    } catch (err: any) {
      setError(err?.message || "Gagal mengirim request lagu.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status: SongRequestV2['status']) => {
    switch (status) {
      case 'submitted': return "Terkirim";
      case 'read': return "Dibaca";
      case 'queued': return "Antrean";
      case 'played': return "Diputar";
      case 'rejected': return "Ditolak";
      case 'archived': return "Arsip";
      default: return status;
    }
  };

  return (
    <div className="req-v2-container" data-testid="request-song-form-v2">
      <form onSubmit={handleSubmit} className="streaming-request-form">
        <div className="streaming-request-grid">
          <input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Nama Anda"
            maxLength={60}
          />
          <input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Penyanyi / Band"
            maxLength={100}
          />
          <input
            className="wide"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Judul Lagu"
            maxLength={150}
            required
          />
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Pesan tambahan opsional (maksimal 200 karakter)"
          maxLength={200}
          rows={2}
        />

        {error && <p className="streaming-request-alert error">{error}</p>}
        {notice && <p className="streaming-request-alert success">{notice}</p>}

        <button type="submit" disabled={submitting} className="streaming-request-submit">
          {submitting ? "Mengirim..." : "Kirim Request Lagu"}
        </button>
      </form>

      {myRequests.length > 0 && (
        <div className="req-v2-status-list">
          <h4 style={{ fontSize: "0.85rem", fontWeight: "600", margin: "6px 0", color: "rgba(255,255,255,0.7)" }}>
            Pelacakan Status Request Anda:
          </h4>
          {myRequests.map((req) => (
            <div key={req.requestId} className="req-v2-status-item">
              <div className="req-v2-status-copy">
                <strong>{req.songTitle} {req.artistName ? ` - ${req.artistName}` : ""}</strong>
                {req.statusNote && <span style={{ display: "block", marginTop: "2px" }}>Catatan: {req.statusNote}</span>}
              </div>
              <span className={`req-v2-status-badge badge-${req.status}`}>
                {getStatusLabel(req.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
