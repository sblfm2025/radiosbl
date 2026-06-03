import { useState, useEffect } from "react";
import { StudioInboxPanel } from "../components/StudioInboxPanel";
import { createPoll, closePoll, subscribeActivePolls, subscribePollVotes, type PollItem, type VoteItem } from "../services/poll.service";
import type { AuthSession } from "../../../services/auth.service";
import { featureFlags } from "../../../config/featureFlags";
import { ContentHubAdminPanel } from "../../contentHub/components/ContentHubAdminPanel";
import "../styles/engagement.css";

type StudioInboxPageProps = {
  session?: AuthSession | null;
};

export default function StudioInboxPage({ session }: StudioInboxPageProps) {
  const operatorName = session?.user?.displayName || session?.user?.email || "Operator Studio";
  const [activeMainTab, setActiveMainTab] = useState<"moderation" | "contentHub">("moderation");
  
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
    } catch (err: unknown) {
      setPollError(err instanceof Error ? err.message : "Gagal membuat polling.");
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
          <p className="studio-inbox-subtitle">
            Kelola interaksi pendengar secara real-time. Operator: <strong>{operatorName}</strong>
          </p>
        </div>
      </div>

      <div className="studio-source-strip" aria-label="Sumber data Studio Inbox">
        <span>Request: <strong>songRequestsV2</strong></span>
        <span>Salam: <strong>dedications</strong></span>
        <span>Polling: <strong>broadcastPolls</strong></span>
        <span>Vote: <strong>broadcastPolls/votes</strong></span>
      </div>

      {featureFlags.contentHub && (
        <div className="studio-inbox-tabs studio-inbox-main-tabs">
          <button
            className={`studio-inbox-tab ${activeMainTab === "moderation" ? "active" : ""}`}
            onClick={() => setActiveMainTab("moderation")}
            data-testid="tab-main-moderation"
          >
            Moderasi & Polling
          </button>
          <button
            className={`studio-inbox-tab ${activeMainTab === "contentHub" ? "active" : ""}`}
            onClick={() => setActiveMainTab("contentHub")}
            data-testid="tab-main-contenthub"
          >
            Arsip Podcast
          </button>
        </div>
      )}

      {activeMainTab === "moderation" ? (
        <div className="studio-inbox-sections">
          <div>
            <StudioInboxPanel operatorName={operatorName} />
          </div>

          <div className="studio-inbox-side-column">
            <div className="create-poll-card" data-testid="create-poll-card">
              <h3>Buat Polling Siaran</h3>
              <form onSubmit={handleCreatePoll} className="create-poll-form">
                <input
                  className="create-poll-input"
                  placeholder="Tanyakan sesuatu ke pendengar..."
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  required
                  data-testid="input-poll-title"
                />
                
                <div className="create-poll-options">
                  <span className="create-poll-label">Opsi Pilihan:</span>
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
                          className="create-poll-remove"
                          title="Hapus Opsi"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="create-poll-actions">
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="action-btn"
                    data-testid="btn-add-option"
                  >
                    + Tambah Opsi
                  </button>
                  <button
                    type="submit"
                    disabled={creatingPoll}
                    className="action-btn primary"
                    data-testid="btn-submit-poll"
                  >
                    {creatingPoll ? "Mempublikasikan..." : "Publikasikan Polling"}
                  </button>
                </div>

                {pollError && <p className="streaming-request-alert error create-poll-alert">{pollError}</p>}
                {pollSuccess && <p className="streaming-request-alert success create-poll-alert">{pollSuccess}</p>}
              </form>
            </div>

            <div className="create-poll-card">
              <h3>Daftar Polling Aktif & Selesai</h3>
              {polls.length === 0 ? (
                <p className="poll-empty-state">
                  Belum ada polling yang dibuat.
                </p>
              ) : (
                <div className="admin-poll-list">
                  {polls.map((poll) => {
                    const isClosed = poll.status === 'closed';
                    const results = getPollOptionResults(poll);
                    const totalVotes = (pollVotesMap[poll.pollId] || []).length;

                    return (
                      <div
                        key={poll.pollId}
                        className="admin-poll-card"
                        data-testid={`admin-poll-card-${poll.pollId}`}
                      >
                        <div className="admin-poll-meta">
                          <span className={isClosed ? "is-closed" : "is-active"}>
                            {isClosed ? "Selesai" : "Sedang Berjalan"}
                          </span>
                          <span>
                            {totalVotes} suara
                          </span>
                        </div>
                        
                        <strong className="admin-poll-title">
                          {poll.title}
                        </strong>

                        <div className="admin-poll-results">
                          {results.map((opt) => (
                            <div key={opt.id} className="admin-poll-result">
                              <div className="admin-poll-result-row">
                                <span>{opt.label}</span>
                                <strong>{opt.pct}% ({opt.count})</strong>
                              </div>
                              <div className="admin-poll-track">
                                <div
                                  className={`admin-poll-fill${isClosed ? " is-closed" : ""}`}
                                  style={{ width: `${opt.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {!isClosed && (
                          <button
                            onClick={() => handleClosePoll(poll.pollId)}
                            className="action-btn danger"
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
      ) : (
        <ContentHubAdminPanel />
      )}
    </div>
  );
}
