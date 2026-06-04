import { useState } from "react";
import type { BroadcastLog, BroadcastLogSong } from "../../../types/domain";
import { submitBroadcastLog } from "../services/broadcastLog.service";
import { Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AuthSession } from "../../../services/auth.service";

type BroadcastLogFormProps = {
  programId: string;
  programTitle: string;
  session: AuthSession | null;
  onSuccess?: () => void;
};

export function BroadcastLogForm({ programId, programTitle, session, onSuccess }: BroadcastLogFormProps) {
  const [actualStartTime, setActualStartTime] = useState("08:00");
  const [actualEndTime, setActualEndTime] = useState("10:00");
  const [topicsInput, setTopicsInput] = useState("");
  const [guestInput, setGuestInput] = useState("");
  const [technicalIssues, setTechnicalIssues] = useState("");
  const [publicFeedback, setPublicFeedback] = useState("");
  const [docLink, setDocLink] = useState("");
  
  // Lagu terputar
  const [songs, setSongs] = useState<BroadcastLogSong[]>([]);
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleAddSong = () => {
    if (!songTitle.trim()) return;
    setSongs([...songs, { title: songTitle.trim(), artist: songArtist.trim() || undefined }]);
    setSongTitle("");
    setSongArtist("");
  };

  const handleRemoveSong = (idx: number) => {
    setSongs(songs.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent, status: BroadcastLog["status"]) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const topics = topicsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const guestNames = guestInput.split(",").map((g) => g.trim()).filter(Boolean);
    const docLinks = docLink.trim() ? [docLink.trim()] : [];

    try {
      await submitBroadcastLog({
        programId,
        programTitle,
        date: new Date().toISOString().split("T")[0],
        actualStartTime,
        actualEndTime,
        hostIds: [session?.user.id || "system"],
        operatorId: session?.user.id || undefined,
        topics,
        songsPlayed: songs,
        guestNames,
        technicalIssues: technicalIssues.trim() || undefined,
        publicFeedbackSummary: publicFeedback.trim() || undefined,
        documentationLinks: docLinks,
        status,
        createdBy: session?.user.displayName || "Admin Operator"
      });

      setSuccess(true);
      if (status === "submitted") {
        // Reset form
        setTopicsInput("");
        setGuestInput("");
        setTechnicalIssues("");
        setPublicFeedback("");
        setDocLink("");
        setSongs([]);
      }
      onSuccess?.();
    } catch {
      setError("Gagal menyimpan log siaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, "submitted")} className="log-form-container">
      {success && (
        <div className="status-alert success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={16} /> Log Siaran berhasil disimpan ke database stasiun!
        </div>
      )}
      {error && (
        <div className="status-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div className="form-field" style={{ flex: 1, minWidth: "140px" }}>
          <label>Jam Mulai Aktual:</label>
          <input
            type="time"
            value={actualStartTime}
            onChange={(e) => setActualStartTime(e.target.value)}
            className="premium-input"
            required
          />
        </div>
        <div className="form-field" style={{ flex: 1, minWidth: "140px" }}>
          <label>Jam Selesai Aktual:</label>
          <input
            type="time"
            value={actualEndTime}
            onChange={(e) => setActualEndTime(e.target.value)}
            className="premium-input"
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label>Topik Bahasan (pisahkan dengan koma):</label>
        <input
          type="text"
          value={topicsInput}
          onChange={(e) => setTopicsInput(e.target.value)}
          placeholder="Contoh: Info Harga Cabai Pinrang, Hari Lahir Pancasila, Wawancara Kadispora"
          className="premium-input"
        />
      </div>

      <div className="form-field">
        <label>Bintang Tamu / Narsum (pisahkan dengan koma):</label>
        <input
          type="text"
          value={guestInput}
          onChange={(e) => setGuestInput(e.target.value)}
          placeholder="Contoh: Bpk. Andi, Ibu Rahma"
          className="premium-input"
        />
      </div>

      {/* Playlist Lagu Terputar */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "12px", background: "var(--color-bg-subtle)" }}>
        <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px", color: "var(--color-text-title)" }}>
          Lagu yang Diputar (Playlog):
        </span>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Judul Lagu"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            className="premium-input"
            style={{ flex: 1, fontSize: "0.8rem", height: "36px" }}
          />
          <input
            type="text"
            placeholder="Artis (Opsional)"
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            className="premium-input"
            style={{ flex: 1, fontSize: "0.8rem", height: "36px" }}
          />
          <button
            type="button"
            onClick={handleAddSong}
            className="save-action-badge secondary"
            style={{ border: "none", cursor: "pointer", height: "36px", padding: "0 12px" }}
          >
            <Plus size={16} />
          </button>
        </div>

        {songs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
            {songs.map((song, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-card)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", border: "1px solid var(--color-border)" }}>
                <span><strong>{song.title}</strong> {song.artist ? ` - ${song.artist}` : ""}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSong(idx)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-field">
        <label>Kendala Teknis (Opsional):</label>
        <textarea
          value={technicalIssues}
          onChange={(e) => setTechnicalIssues(e.target.value)}
          placeholder="Tulis kendala jika ada (misal: internet stasiun putus 2 menit, listrik padam, mic 3 mati)..."
          rows={2}
          className="premium-textarea"
        />
      </div>

      <div className="form-field">
        <label>Ringkasan Feedback Publik (Opsional):</label>
        <textarea
          value={publicFeedback}
          onChange={(e) => setPublicFeedback(e.target.value)}
          placeholder="Masukan/request terbanyak dari WhatsApp stasiun (misal: pendengar minta informasi seputar jalan rusak di Mattiro Bulu)..."
          rows={2}
          className="premium-textarea"
        />
      </div>

      <div className="form-field">
        <label>Tautan Dokumentasi Siaran (Opsional):</label>
        <input
          type="url"
          value={docLink}
          onChange={(e) => setDocLink(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="premium-input"
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "8px", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={loading}
          onClick={(e) => handleSubmit(e, "draft")}
          className="premium-button-primary"
          style={{ width: "auto", background: "var(--color-bg-subtle)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
        >
          Simpan Draft
        </button>
        <button type="submit" disabled={loading} className="premium-button-primary" style={{ width: "auto" }}>
          {loading ? "Menyimpan..." : "Kirim Log Siaran"}
        </button>
      </div>
    </form>
  );
}
