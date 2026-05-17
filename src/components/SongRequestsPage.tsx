import { useState, useEffect } from "react";
import { Radio, Clock, PlayCircle, XCircle, RefreshCw, MessageCircle } from "lucide-react";
import type { SongRequest } from "../types/domain";
import {
  listSongRequests,
  subscribeSongRequests,
  updateSongRequestStatus
} from "../services/songRequest.service";

export function SongRequestsPage() {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadRequests() {
    setLoading(true);
    const nextRequests = await listSongRequests();
    setRequests(nextRequests);
    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = subscribeSongRequests((nextRequests) => {
      setRequests(nextRequests);
      setLoading(false);
    });

    void loadRequests();

    return () => unsubscribe();
  }, []);

  async function handleStatus(request: SongRequest, status: SongRequest["status"]) {
    const updated = await updateSongRequestStatus(request, status);
    setRequests((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
    setNotice(`Request "${updated.title}" diperbarui menjadi ${status}.`);
    
    // Clear notice after 3 seconds
    setTimeout(() => setNotice(""), 3000);
  }

  const groupedRequests = {
    new: requests.filter((request) => ["new", "notified"].includes(request.status)),
    queued: requests.filter((request) => request.status === "queued"),
    done: requests.filter((request) => ["played", "rejected"].includes(request.status))
  };

  return (
    <div style={{ background: "#f8f9fc", minHeight: "100vh", paddingBottom: "100px" }}>
      <div className="schedule-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div className="schedule-title-lockup">
            <img src="/LogoSBL.svg" alt="Radio SBL" />
            <div>
              <p className="eyebrow">Interaksi Pendengar</p>
              <h1>Request Lagu</h1>
            </div>
          </div>
          <button 
            type="button" 
            onClick={loadRequests}
            style={{ background: "rgba(22, 119, 237, 0.1)", border: "none", color: "var(--blue)", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            aria-label="Muat Ulang Request"
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {notice && <p style={{ background: "rgba(17,163,106,0.1)", color: "#11a36a", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px" }}>{notice}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Incoming Requests */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ background: "#FF3B3B", width: "8px", height: "8px", borderRadius: "50%" }}></div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)" }}>Masuk Sekarang</h3>
              <span style={{ background: "rgba(255,59,59,0.1)", color: "#FF3B3B", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>{groupedRequests.new.length}</span>
            </div>
            
            {groupedRequests.new.length === 0 ? (
              <div style={{ background: "white", borderRadius: "16px", padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>Belum ada request baru.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {groupedRequests.new.map((request) => (
                  <div key={request.id} style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Radio size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "var(--ink)" }}>
                          {request.artist ? `${request.artist} - ` : ""}{request.title}
                        </h4>
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "4px", lineHeight: "1.4" }}>
                          Dari: <strong style={{ color: "var(--ink)" }}>{request.requesterName}</strong>
                          {request.announcerName && <span> untuk {request.announcerName}</span>}
                        </div>
                        {request.requesterWhatsapp && (
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <MessageCircle size={14} color="#25D366" /> {request.requesterWhatsapp}
                          </div>
                        )}
                        {request.message && (
                          <div style={{ fontSize: "0.85rem", color: "var(--ink)", background: "#f8f9fc", padding: "10px 14px", borderRadius: "8px", fontStyle: "italic", borderLeft: "3px solid var(--blue)", marginTop: "8px" }}>"{request.message}"</div>
                        )}
                        
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                          <button 
                            type="button" 
                            onClick={() => handleStatus(request, "queued")}
                            style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "var(--blue)", color: "white", border: "none", fontWeight: "bold", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                          >
                            <Clock size={16} /> Antrekan
                          </button>
                          {request.whatsappUrl && (
                            <a 
                              href={request.whatsappUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ padding: "10px", borderRadius: "10px", background: "#25D366", color: "white", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "42px" }}
                              aria-label="Balas WA"
                            >
                              <MessageCircle size={18} />
                            </a>
                          )}
                          <button 
                            type="button" 
                            onClick={() => handleStatus(request, "rejected")}
                            style={{ padding: "10px", borderRadius: "10px", background: "rgba(255, 59, 59, 0.1)", color: "#FF3B3B", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            aria-label="Tolak"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Queued Requests */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ background: "var(--blue)", width: "8px", height: "8px", borderRadius: "50%" }}></div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)" }}>Siap Diputar</h3>
              <span style={{ background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>{groupedRequests.queued.length}</span>
            </div>
            
            {groupedRequests.queued.length === 0 ? (
              <div style={{ background: "white", borderRadius: "16px", padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>Antrean putar kosong.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {groupedRequests.queued.map((request) => (
                  <div key={request.id} style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1, paddingRight: "12px" }}>
                        <h4 style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "var(--ink)" }}>
                          {request.artist ? `${request.artist} - ` : ""}{request.title}
                        </h4>
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          Dari: <strong style={{ color: "var(--ink)" }}>{request.requesterName}</strong>
                        </div>
                        {request.message && (
                          <div style={{ fontSize: "0.85rem", color: "var(--ink)", background: "#f8f9fc", padding: "8px 12px", borderRadius: "8px", fontStyle: "italic", borderLeft: "3px solid var(--blue)", marginTop: "8px" }}>"{request.message}"</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          type="button" 
                          onClick={() => handleStatus(request, "played")}
                          style={{ background: "rgba(17,163,106,0.1)", color: "#11a36a", border: "none", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <PlayCircle size={24} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleStatus(request, "rejected")}
                          style={{ background: "rgba(255, 59, 59, 0.1)", color: "#FF3B3B", border: "none", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History / Done */}
          {groupedRequests.done.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ background: "var(--muted)", width: "8px", height: "8px", borderRadius: "50%" }}></div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)" }}>Riwayat (5 Terakhir)</h3>
              </div>
              
              <div style={{ background: "white", borderRadius: "16px", padding: "8px 16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                {groupedRequests.done.slice(0, 5).map((request, idx) => (
                  <div key={request.id} style={{ padding: "12px 0", borderBottom: idx < Math.min(4, groupedRequests.done.length - 1) ? "1px solid rgba(0,0,0,0.05)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: "0.9rem", color: "var(--ink)", fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{request.title}</div>
                    </div>
                    <span style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", background: request.status === "played" ? "rgba(17,163,106,0.1)" : "rgba(255, 59, 59, 0.1)", color: request.status === "played" ? "#11a36a" : "#FF3B3B", fontWeight: "bold" }}>
                      {request.status === "played" ? "Diputar" : "Ditolak"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
