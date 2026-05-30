import { useState, useEffect, type FormEvent } from "react";
import { submitDedication, subscribeApprovedDedications, type DedicationItem } from "../services/dedication.service";
import "../styles/engagement.css";

type DedicationFormProps = {
  activeProgramTitle?: string;
  activeProgramId?: string;
};

export function DedicationForm({ activeProgramTitle, activeProgramId }: DedicationFormProps) {
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [approvedDedications, setApprovedDedications] = useState<DedicationItem[]>([]);

  useEffect(() => {
    return subscribeApprovedDedications((items) => {
      setApprovedDedications(items);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!message.trim()) {
      setError("Pesan salam tidak boleh kosong.");
      return;
    }

    setSubmitting(true);

    try {
      await submitDedication({
        senderName: isAnonymous ? "" : (senderName.trim() || "Pendengar SBL"),
        recipientName: recipientName.trim(),
        message: message.trim(),
        isAnonymous,
        targetProgramId: activeProgramId,
        targetProgramTitle: activeProgramTitle
      });

      setMessage("");
      setRecipientName("");
      setNotice("Salam udara berhasil dikirim dan sedang menunggu moderasi.");
    } catch (err: any) {
      setError(err?.message || "Gagal mengirim salam udara.");
    } finally {
      setSubmitting(false);
    }
  };

  const remainingChars = 300 - message.length;

  return (
    <div className="dedication-container" data-testid="dedication-form">
      <h3>Kirim Salam Udara</h3>
      <form onSubmit={handleSubmit} className="streaming-request-form">
        <div className="streaming-request-grid">
          <input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Nama Anda"
            maxLength={60}
            disabled={isAnonymous}
          />
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Untuk (Nama Penerima)"
            maxLength={60}
          />
        </div>

        <div className="dedication-anonymous-row" onClick={() => setIsAnonymous(!isAnonymous)}>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            id="anonymous-checkbox"
          />
          <label htmlFor="anonymous-checkbox" style={{ cursor: "pointer" }}>Kirim sebagai Anonim</label>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis pesan salam Anda di sini..."
          maxLength={300}
          rows={3}
          required
        />
        <div className={`dedication-char-count ${remainingChars < 30 ? "warning" : ""}`}>
          <span>{isAnonymous ? "Mengirim secara anonim" : ""}</span>
          <span>{remainingChars} karakter tersisa</span>
        </div>

        {error && <p className="streaming-request-alert error">{error}</p>}
        {notice && <p className="streaming-request-alert success">{notice}</p>}

        <button type="submit" disabled={submitting} className="streaming-request-submit">
          {submitting ? "Mengirim..." : "Kirim Salam Udara"}
        </button>
      </form>

      {approvedDedications.length > 0 && (
        <div className="dedication-list">
          <h4 style={{ fontSize: "0.85rem", fontWeight: "600", margin: "10px 0 5px 0", color: "rgba(255,255,255,0.7)" }}>
            Salam Udara Terbaru:
          </h4>
          {approvedDedications.map((item) => (
            <div key={item.dedicationId} className="dedication-card" data-testid={`dedication-card-${item.dedicationId}`}>
              <div className="dedication-card-header">
                <span className="dedication-card-names">
                  {item.isAnonymous ? "Anonim" : (item.senderName || "Pendengar SBL")}
                  {item.recipientName ? ` ➔ ${item.recipientName}` : ""}
                </span>
                <span className="dedication-card-time">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="dedication-card-message">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
