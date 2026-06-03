import { useState } from "react";
import type { BroadcastRundown, BroadcastRundownSegment } from "../../../types/domain";
import { submitRundown, updateRundown } from "../services/rundown.service";
import { Plus, Trash2, ArrowUp, ArrowDown, Radio, Save, AlertCircle } from "lucide-react";
import type { AuthSession } from "../../../services/auth.service";

type RundownEditorProps = {
  rundown: BroadcastRundown;
  onSave?: () => void;
  session: AuthSession | null;
};

const SEGMENT_TYPES: Array<{ value: BroadcastRundownSegment["type"]; label: string }> = [
  { value: "opening", label: "Opening" },
  { value: "talk", label: "Talkshow / Obrolan" },
  { value: "music", label: "Pemutaran Musik" },
  { value: "news", label: "Berita / News" },
  { value: "ads", label: "Iklan / Ad-libs" },
  { value: "psa", label: "Iklan Layanan Masyarakat" },
  { value: "interview", label: "Wawancara" },
  { value: "closing", label: "Closing" },
  { value: "other", label: "Lain-lain" }
];

export function RundownEditor({ rundown, onSave, session }: RundownEditorProps) {
  const [segments, setSegments] = useState<BroadcastRundownSegment[]>(() =>
    [...rundown.segments].sort((a, b) => a.order - b.order)
  );
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddSegment = () => {
    const nextOrder = segments.length + 1;
    const newSeg: BroadcastRundownSegment = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      order: nextOrder,
      title: `Segmen Baru ${nextOrder}`,
      type: "talk",
      plannedDurationMinutes: 10,
      notes: ""
    };
    setSegments([...segments, newSeg]);
  };

  const handleRemoveSegment = (id: string) => {
    const filtered = segments.filter((s) => s.id !== id);
    const reordered = filtered.map((s, idx) => ({
      ...s,
      order: idx + 1
    }));
    setSegments(reordered);
  };

  const handleUpdateSegmentField = (id: string, field: keyof BroadcastRundownSegment, value: any) => {
    setSegments(
      segments.map((s) => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const moveSegment = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= segments.length) return;

    const copy = [...segments];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Perbarui urutan (order)
    const reordered = copy.map((s, idx) => ({
      ...s,
      order: idx + 1
    }));

    setSegments(reordered);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await updateRundown(rundown.id, {
        segments,
        status: rundown.status === "draft" ? "ready" : rundown.status
      });
      setSuccessMsg("Rundown berhasil disimpan ke server stasiun!");
      onSave?.();
    } catch {
      setErrorMsg("Gagal menyimpan rundown.");
    } finally {
      setSaving(false);
    }
  };

  const totalDuration = segments.reduce((sum, s) => sum + (s.plannedDurationMinutes || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {successMsg && <div className="status-alert success">{successMsg}</div>}
      {errorMsg && <div className="status-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}><AlertCircle size={16} /> {errorMsg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Total Durasi Terencana:</span>
          <strong style={{ fontSize: "1rem", color: "var(--color-primary)", marginLeft: "6px" }}>{totalDuration} Menit</strong>
        </div>

        <div className="rundown-editor-controls">
          <button
            type="button"
            onClick={handleAddSegment}
            className="save-action-badge secondary"
            style={{ display: "flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer", padding: "6px 12px" }}
          >
            <Plus size={14} /> Tambah Segmen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="save-action-badge"
            style={{ display: "flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer", padding: "6px 12px" }}
          >
            <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Rundown"}
          </button>
        </div>
      </div>

      <div className="rundown-segment-list">
        {segments.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: "8px", color: "var(--color-text-muted)" }}>
            Belum ada segmen rundown. Klik tombol "Tambah Segmen" untuk memulai.
          </div>
        ) : (
          segments.map((seg, idx) => (
            <div key={seg.id} className="rundown-segment-card">
              <div className="segment-header">
                <div className="segment-title-group">
                  <span className="segment-order-badge">{seg.order}</span>
                  <input
                    type="text"
                    value={seg.title}
                    onChange={(e) => handleUpdateSegmentField(seg.id, "title", e.target.value)}
                    className="segment-title-input"
                    placeholder="Nama Segmen"
                  />
                </div>

                <div className="segment-actions">
                  <button
                    type="button"
                    onClick={() => moveSegment(idx, "up")}
                    disabled={idx === 0}
                    className="segment-action-btn"
                    title="Naikkan urutan"
                    style={{ opacity: idx === 0 ? 0.3 : 1 }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSegment(idx, "down")}
                    disabled={idx === segments.length - 1}
                    className="segment-action-btn"
                    title="Turunkan urutan"
                    style={{ opacity: idx === segments.length - 1 ? 0.3 : 1 }}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSegment(seg.id)}
                    className="segment-action-btn delete"
                    title="Hapus Segmen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="segment-details-row">
                <div className="segment-detail-field">
                  <label>Jenis:</label>
                  <select
                    value={seg.type}
                    onChange={(e) => handleUpdateSegmentField(seg.id, "type", e.target.value)}
                  >
                    {SEGMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="segment-detail-field">
                  <label>Durasi (Menit):</label>
                  <input
                    type="number"
                    min={1}
                    value={seg.plannedDurationMinutes || ""}
                    onChange={(e) => handleUpdateSegmentField(seg.id, "plannedDurationMinutes", Number(e.target.value))}
                    style={{ width: "60px" }}
                  />
                </div>
              </div>

              <input
                type="text"
                value={seg.notes || ""}
                onChange={(e) => handleUpdateSegmentField(seg.id, "notes", e.target.value)}
                className="segment-notes-input"
                placeholder="Catatan segmen (misal: Mainkan lagu penyejuk, bacakan WhatsApp pendengar)..."
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
