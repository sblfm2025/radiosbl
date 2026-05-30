import { useState, useEffect } from "react";
import { subscribeSongRequestsV2, updateSongRequestStatus, type SongRequestV2 } from "../services/requestSongStatus.service";
import { subscribeDedications, updateDedicationStatus, type DedicationItem } from "../services/dedication.service";
import "../styles/engagement.css";

type StudioInboxPanelProps = {
  operatorName?: string;
};

export function StudioInboxPanel({ operatorName = "Operator Studio" }: StudioInboxPanelProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "dedications">("requests");
  const [requests, setRequests] = useState<SongRequestV2[]>([]);
  const [dedications, setDedications] = useState<DedicationItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    return subscribeSongRequestsV2((allRequests) => {
      setRequests(allRequests);
    });
  }, []);

  useEffect(() => {
    return subscribeDedications((allDedications) => {
      setDedications(allDedications);
    });
  }, []);

  const handleRequestAction = async (requestId: string, status: SongRequestV2['status'], note?: string) => {
    try {
      await updateSongRequestStatus(requestId, status, note, operatorName);
    } catch (error) {
      console.error(`Gagal mengubah status request ${requestId} ke ${status}:`, error);
    }
  };

  const handleDedicationAction = async (dedicationId: string, status: DedicationItem['status'], note?: string) => {
    try {
      await updateDedicationStatus(dedicationId, status, note, operatorName);
    } catch (error) {
      console.error(`Gagal mengubah status dedikasi ${dedicationId} ke ${status}:`, error);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (showArchived) {
      return r.status === 'archived' || r.status === 'rejected' || r.status === 'played';
    } else {
      return r.status !== 'archived' && r.status !== 'rejected' && r.status !== 'played';
    }
  });

  const filteredDedications = dedications.filter(d => {
    if (showArchived) {
      return d.status === 'archived' || d.status === 'rejected';
    } else {
      return d.status !== 'archived' && d.status !== 'rejected';
    }
  });

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="studio-inbox-panel" data-testid="studio-inbox-panel">
      <div className="studio-inbox-tabs" style={{ marginBottom: "16px" }}>
        <button
          className={`studio-inbox-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
          data-testid="tab-requests"
        >
          Request Lagu ({requests.filter(r => r.status === 'submitted' || r.status === 'read' || r.status === 'queued').length})
        </button>
        <button
          className={`studio-inbox-tab ${activeTab === "dedications" ? "active" : ""}`}
          onClick={() => setActiveTab("dedications")}
          data-testid="tab-dedications"
        >
          Salam Udara ({dedications.filter(d => d.status === 'submitted' || d.status === 'approved').length})
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            data-testid="toggle-archived"
          />
          Tampilkan Arsip / Selesai
        </label>
      </div>

      {activeTab === "requests" ? (
        <div className="studio-inbox-grid" data-testid="requests-grid">
          {filteredRequests.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", textAlign: "center", gridColumn: "1 / -1", padding: "20px" }}>
              Tidak ada request lagu dalam antrean.
            </p>
          ) : (
            filteredRequests.map((req) => (
              <div key={req.requestId} className="inbox-item-card" data-testid={`request-card-${req.requestId}`}>
                <div className="inbox-item-header">
                  <span className="inbox-item-sender">
                    {req.senderName || "Pendengar SBL"}
                  </span>
                  <span className="inbox-item-time">
                    {formatTime(req.createdAt)}
                  </span>
                </div>
                
                <div className="inbox-item-song">
                  <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <strong>{req.songTitle}</strong> {req.artistName ? ` - ${req.artistName}` : ""}
                </div>

                {req.message && <p className="inbox-item-body">"{req.message}"</p>}
                
                {req.targetProgramTitle && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    Program: {req.targetProgramTitle}
                  </span>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                  <span className={`req-v2-status-badge badge-${req.status}`}>
                    {req.status}
                  </span>
                  {req.statusNote && (
                    <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>
                      ({req.statusNote})
                    </span>
                  )}
                </div>

                <div className="inbox-item-actions">
                  {req.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleRequestAction(req.requestId, 'read')}
                        className="action-btn"
                        data-testid={`btn-read-${req.requestId}`}
                      >
                        Tandai Dibaca
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.requestId, 'queued')}
                        className="action-btn primary"
                        data-testid={`btn-queue-${req.requestId}`}
                      >
                        Masukkan Antrean
                      </button>
                    </>
                  )}
                  {req.status === 'read' && (
                    <button
                      onClick={() => handleRequestAction(req.requestId, 'queued')}
                      className="action-btn primary"
                    >
                      Masukkan Antrean
                    </button>
                  )}
                  {req.status === 'queued' && (
                    <button
                      onClick={() => handleRequestAction(req.requestId, 'played')}
                      className="action-btn primary"
                      data-testid={`btn-play-${req.requestId}`}
                    >
                      Putar Lagu
                    </button>
                  )}
                  {req.status !== 'played' && req.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        const note = prompt("Alasan penolakan (opsional):") || undefined;
                        handleRequestAction(req.requestId, 'rejected', note);
                      }}
                      className="action-btn danger"
                      data-testid={`btn-reject-${req.requestId}`}
                    >
                      Tolak
                    </button>
                  )}
                  {(req.status === 'played' || req.status === 'rejected') && (
                    <button
                      onClick={() => handleRequestAction(req.requestId, 'archived')}
                      className="action-btn"
                    >
                      Arsipkan
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="studio-inbox-grid" data-testid="dedications-grid">
          {filteredDedications.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", textAlign: "center", gridColumn: "1 / -1", padding: "20px" }}>
              Tidak ada salam udara dalam antrean.
            </p>
          ) : (
            filteredDedications.map((ded) => (
              <div key={ded.dedicationId} className="inbox-item-card" data-testid={`dedication-card-${ded.dedicationId}`}>
                <div className="inbox-item-header">
                  <span className="inbox-item-sender" style={{ color: "#10b981" }}>
                    {ded.isAnonymous ? "Anonim" : (ded.senderName || "Pendengar SBL")}
                    {ded.recipientName ? ` ➔ ${ded.recipientName}` : ""}
                  </span>
                  <span className="inbox-item-time">
                    {formatTime(ded.createdAt)}
                  </span>
                </div>
                
                <p className="inbox-item-body" style={{ fontStyle: "italic", fontSize: "0.9rem" }}>
                  "{ded.message}"
                </p>

                {ded.targetProgramTitle && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    Program: {ded.targetProgramTitle}
                  </span>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                  <span className={`req-v2-status-badge badge-${ded.status === 'readOnAir' ? 'read' : ded.status === 'approved' ? 'played' : 'submitted'}`}>
                    {ded.status === 'readOnAir' ? 'Dibaca di Udara' : ded.status === 'approved' ? 'Disetujui' : ded.status}
                  </span>
                  {ded.statusNote && (
                    <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>
                      ({ded.statusNote})
                    </span>
                  )}
                </div>

                <div className="inbox-item-actions">
                  {ded.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleDedicationAction(ded.dedicationId, 'approved')}
                        className="action-btn primary"
                        data-testid={`btn-approve-ded-${ded.dedicationId}`}
                      >
                        Setujui (Publikasi)
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt("Alasan penolakan (opsional):") || undefined;
                          handleDedicationAction(ded.dedicationId, 'rejected', note);
                        }}
                        className="action-btn danger"
                        data-testid={`btn-reject-ded-${ded.dedicationId}`}
                      >
                        Tolak
                      </button>
                    </>
                  )}
                  {ded.status === 'approved' && (
                    <>
                      <button
                        onClick={() => handleDedicationAction(ded.dedicationId, 'readOnAir')}
                        className="action-btn primary"
                        data-testid={`btn-read-ded-${ded.dedicationId}`}
                      >
                        Tandai Dibaca di Udara
                      </button>
                      <button
                        onClick={() => handleDedicationAction(ded.dedicationId, 'archived')}
                        className="action-btn"
                      >
                        Arsipkan
                      </button>
                    </>
                  )}
                  {ded.status === 'readOnAir' && (
                    <button
                      onClick={() => handleDedicationAction(ded.dedicationId, 'archived')}
                      className="action-btn"
                    >
                      Arsipkan
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
