import { useEffect, useState } from "react";
import type { PreBroadcastChecklist, PreBroadcastChecklistItem } from "../../../types/domain";
import { getPreBroadcastChecklist, savePreBroadcastChecklist, subscribePreBroadcastChecklist } from "../services/rundown.service";
import { Check, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AuthSession } from "../../../services/auth.service";

const DEFAULT_CHECKLIST_ITEMS = [
  "Mic ready (Penyiar & Tamu)",
  "Mixer & Fader ready",
  "Stream encoder (OBS/Butt) ready",
  "Playlist lagu & Iklan/Adlibs ready",
  "Rundown siaran ready",
  "Naskah/Script AI ready",
  "WhatsApp Studio & Monitor chat ready",
  "Recorder backup ready",
  "Operator standby",
  "Penyiar standby"
];

type PreBroadcastChecklistProps = {
  programId: string;
  programTitle: string;
  date: string;
  session: AuthSession | null;
};

export function PreBroadcastChecklistComponent({
  programId,
  programTitle,
  date,
  session
}: PreBroadcastChecklistProps) {
  const [checklist, setChecklist] = useState<PreBroadcastChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [issueNotes, setIssueNotes] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribePreBroadcastChecklist(programId, date, (data) => {
      setChecklist(data);
      if (data) {
        setIssueNotes(data.issueNotes || "");
        setShowIssueForm(data.status === "issue_found");
      }
      setLoading(false);
    });

    return () => unsub();
  }, [programId, date]);

  const initChecklist = async () => {
    const items: PreBroadcastChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((label, idx) => ({
      id: `item-${idx}`,
      label,
      checked: false
    }));

    await savePreBroadcastChecklist({
      programId,
      programTitle,
      date,
      items,
      status: "draft"
    });
  };

  const handleToggleItem = async (itemId: string) => {
    if (!checklist) return;

    const updatedItems = checklist.items.map((item) => {
      if (item.id === itemId) {
        const nextChecked = !item.checked;
        return {
          ...item,
          checked: nextChecked,
          checkedBy: nextChecked ? session?.user.displayName || "Operator" : undefined,
          checkedAt: nextChecked ? new Date().toISOString() : undefined
        };
      }
      return item;
    });

    const allChecked = updatedItems.every((item) => item.checked);
    const nextStatus = allChecked ? "ready" : showIssueForm && issueNotes.trim() ? "issue_found" : "draft";

    await savePreBroadcastChecklist({
      id: checklist.id,
      programId: checklist.programId,
      programTitle: checklist.programTitle,
      date: checklist.date,
      items: updatedItems,
      status: nextStatus,
      issueNotes: checklist.issueNotes
    });
  };

  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklist) return;

    const nextStatus = issueNotes.trim() ? "issue_found" : checklist.items.every((item) => item.checked) ? "ready" : "draft";

    await savePreBroadcastChecklist({
      id: checklist.id,
      programId: checklist.programId,
      programTitle: checklist.programTitle,
      date: checklist.date,
      items: checklist.items,
      status: nextStatus,
      issueNotes: issueNotes.trim()
    });
  };

  if (loading) {
    return <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Memuat checklist kesiapan...</div>;
  }

  if (!checklist) {
    return (
      <div style={{ textAlign: "center", padding: "16px" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "12px" }}>
          Checklist pra-siaran belum dibuat untuk program ini hari ini.
        </p>
        <button
          type="button"
          onClick={initChecklist}
          className="premium-button-primary"
          style={{ width: "auto", padding: "8px 16px", fontSize: "0.85rem" }}
        >
          Siapkan Checklist Kesiapan
        </button>
      </div>
    );
  }

  const checkedCount = checklist.items.filter((i) => i.checked).length;
  const totalCount = checklist.items.length;
  const isAllReady = checkedCount === totalCount;

  return (
    <div className="checklist-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-title)" }}>
          Progress Kesiapan Studio:
        </span>
        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isAllReady ? "#10b981" : "var(--color-primary)" }}>
          {checkedCount} / {totalCount} Selesai
        </span>
      </div>

      <div style={{ width: "100%", height: "6px", background: "var(--color-border)", borderRadius: "3px", overflow: "hidden", marginBottom: "16px" }}>
        <div
          style={{
            width: `${(checkedCount / totalCount) * 100}%`,
            height: "100%",
            background: isAllReady ? "#10b981" : "var(--color-primary)",
            transition: "width 0.3s ease"
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {checklist.items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggleItem(item.id)}
            className={`checklist-item ${item.checked ? "checked" : ""}`}
          >
            <div className="checklist-checkbox">
              {item.checked && <Check size={12} strokeWidth={3} />}
            </div>
            <div className="checklist-label">{item.label}</div>
            {item.checkedBy && (
              <div className="checklist-meta" title={item.checkedAt ? new Date(item.checkedAt).toLocaleTimeString() : ""}>
                {item.checkedBy.split(" ")[0]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => {
              setShowIssueForm(!showIssueForm);
              if (!showIssueForm) setIssueNotes(checklist.issueNotes || "");
            }}
            className="save-action-badge warning"
            style={{ display: "flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer", padding: "6px 12px" }}
          >
            <AlertTriangle size={14} />
            {checklist.status === "issue_found" ? "Ada Kendala Teknis" : "Laporkan Kendala"}
          </button>

          {isAllReady && checklist.status !== "issue_found" && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "0.8rem", fontWeight: "600", marginLeft: "auto" }}>
              <CheckCircle2 size={16} /> Studio Siap Siaran!
            </div>
          )}
        </div>

        {showIssueForm && (
          <form onSubmit={handleSaveIssue} style={{ marginTop: "12px" }}>
            <textarea
              value={issueNotes}
              onChange={(e) => setIssueNotes(e.target.value)}
              placeholder="Jelaskan detail kendala teknis (misal: kabel mic 2 kresek-kresek, fader 4 mati)..."
              rows={2}
              className="premium-textarea"
              style={{ fontSize: "0.8rem", marginBottom: "8px" }}
              required
            />
            <button
              type="submit"
              className="premium-button-primary"
              style={{ width: "auto", padding: "6px 12px", fontSize: "0.8rem", background: "#f59e0b" }}
            >
              Simpan Laporan Kendala
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
