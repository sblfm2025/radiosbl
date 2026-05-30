import { useState, useEffect } from "react";
import { StudioInboxPanel } from "../components/StudioInboxPanel";
import { createPoll, closePoll, subscribeActivePolls, subscribePollVotes, type PollItem, type VoteItem } from "../services/poll.service";
import type { AuthSession } from "../../../services/auth.service";
import "../styles/engagement.css";

type StudioInboxPageProps = {
  session?: AuthSession | null;
};

export default function StudioInboxPage({ session }: StudioInboxPageProps) {
  const operatorName = session?.user?.displayName || session?.user?.email || "Operator Studio";
  
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [pollError, setPollError] = useState("");
  const [pollSuccess, setPollSuccess] = useState("");

  const [polls, setPolls] = useState<PollItem[]>([]);
  const [pollVotesMap, setPollVotesMap] = useState<{ [pollId: string]: VoteItem[] }>({});

  useEffect(() => {
    return subscribeActivePolls((activePolls) => {
      setPolls(activePolls);
    });
  }, []);

  useEffect(() => {
    const unsubscribes = polls.map((poll) => {
      return subscribePollVotes(poll.pollId, (votes) => {
        setPollVotesMap(prev => ({ ...prev, [poll.pollId]: votes }));
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [polls]);

  const handleAddOption = () => {
    setPollOptions(prev => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setPollOptions(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setPollError("");
    setPollSuccess("");

    if (!pollTitle.trim()) {
      setPollError("Pertanyaan polling tidak boleh kosong.");
      return;
    }

    const validOptions = pollOptions.map(opt => opt.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setPollError("Harap masukkan minimal 2 opsi pilihan.");
      return;
    }

    setCreatingPoll(true);
    try {
      await createPoll(pollTitle.trim(), validOptions, operatorName);
      setPollTitle("");
      setPollOptions(["", ""]);
      setPollSuccess("Polling berhasil dipublikasikan ke pendengar!");
    } catch (err: any) {
      setPollError(err?.message || "Gagal membuat polling.");
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    if (!confirm("Apakah Anda yakin ingin menutup polling ini? Pendengar tidak akan bisa memberikan suara lagi.")) return;
    try {
      await closePoll(pollId);
    } catch (err) {
      console.error("Gagal menutup polling:", err);
    }
  };

  const getPollOptionResults = (poll: PollItem) => {
    const votes = pollVotesMap[poll.pollId] || [];
    const total = votes.length;
    return poll.options.map(opt => {
      const count = votes.filter(v => v.optionId === opt.id).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...opt, count, pct };
    });
  };

  return (
    <div className="studio-inbox-page" data-testid="studio-inbox-page">
      <div className="studio-inbox-header">
        <div>
          <h1>Studio Inbox & Moderasi</h1>
          <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem", marginTop: "4px" }}>
            Kelola interaksi pendengar secara real-time. Operator: <strong>{operatorName}</strong>
          </p>
        </div>
      </div>

      <div className="studio-inbox-sections">
        <div>
          <StudioInboxPanel operatorName={operatorName} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="create-poll-card" data-testid="create-poll-card">
            <h3>Buat Polling Siaran</h3>
            <form onSubmit={handleCreatePoll} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                className="create-poll-input"
                placeholder="Tanyakan sesuatu ke pendengar..."
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                required
                data-testid="input-poll-title"
              />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.7)" }}>Opsi Pilihan:</span>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="create-poll-option-row">
                    <input
                      className="create-poll-input"
                      placeholder={`Opsi ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                      data-testid={`input-poll-option-${idx}`}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}
                        title="Hapus Opsi"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="action-btn"
                  style={{ fontSize: "0.75rem" }}
                  data-testid="btn-add-option"
                >
                  + Tambah Opsi
                </button>
                <button
                  type="submit"
                  disabled={creatingPoll}
                  className="action-btn primary"
                  style={{ fontSize: "0.75rem" }}
                  data-testid="btn-submit-poll"
                >
                  {creatingPoll ? "Mempublikasikan..." : "Publikasikan Polling"}
                </button>
              </div>

              {pollError && <p className="streaming-request-alert error" style={{ margin: "5px 0 0 0" }}>{pollError}</p>}
              {pollSuccess && <p className="streaming-request-alert success" style={{ margin: "5px 0 0 0" }}>{pollSuccess}</p>}
            </form>
          </div>

          <div className="create-poll-card">
            <h3>Daftar Polling Aktif & Selesai</h3>
            {polls.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textAlign: "center", margin: "10px 0" }}>
                Belum ada polling yang dibuat.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                {polls.map((poll) => {
                  const isClosed = poll.status === 'closed';
                  const results = getPollOptionResults(poll);
                  const totalVotes = (pollVotesMap[poll.pollId] || []).length;

                  return (
                    <div
                      key={poll.pollId}
                      style={{
                        padding: "12px",
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "8px"
                      }}
                      data-testid={`admin-poll-card-${poll.pollId}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "700", color: isClosed ? "#ef4444" : "#10b981", textTransform: "uppercase" }}>
                          {isClosed ? "Selesai" : "Sedang Berjalan"}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                          {totalVotes} suara
                        </span>
                      </div>
                      
                      <strong style={{ fontSize: "0.85rem", color: "#fff", display: "block", marginBottom: "8px" }}>
                        {poll.title}
                      </strong>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {results.map((opt) => (
                          <div key={opt.id} style={{ fontSize: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px", color: "rgba(255,255,255,0.8)" }}>
                              <span>{opt.label}</span>
                              <strong>{opt.pct}% ({opt.count})</strong>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.03)", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ background: isClosed ? "rgba(255, 255, 255, 0.2)" : "#10b981", width: `${opt.pct}%`, height: "100%" }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {!isClosed && (
                        <button
                          onClick={() => handleClosePoll(poll.pollId)}
                          className="action-btn danger"
                          style={{ width: "100%", marginTop: "10px", padding: "4px", fontSize: "0.7rem" }}
                          data-testid={`btn-close-poll-${poll.pollId}`}
                        >
                          Tutup Polling
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
