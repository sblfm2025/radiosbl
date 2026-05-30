import { useState, useEffect } from "react";
import { subscribeActivePolls, subscribePollVotes, submitVote, checkHasVoted, type PollItem, type VoteItem } from "../services/poll.service";
import "../styles/engagement.css";

type PollWidgetProps = {
  userId?: string;
};

export function PollWidget({ userId }: PollWidgetProps) {
  const [activePolls, setActivePolls] = useState<PollItem[]>([]);
  const [anonSessionId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    let saved = localStorage.getItem("poll_anon_session_id");
    if (!saved) {
      saved = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("poll_anon_session_id", saved);
    }
    return saved;
  });

  const [votedPolls, setVotedPolls] = useState<{ [key: string]: boolean }>({});
  const [pollVotes, setPollVotes] = useState<{ [key: string]: VoteItem[] }>({});

  useEffect(() => {
    return subscribeActivePolls((polls) => {
      setActivePolls(polls);
    });
  }, []);

  useEffect(() => {
    activePolls.forEach(async (poll) => {
      const hasVoted = await checkHasVoted(poll.pollId, userId, anonSessionId);
      setVotedPolls(prev => ({ ...prev, [poll.pollId]: hasVoted }));
    });
  }, [activePolls, userId, anonSessionId]);

  useEffect(() => {
    const unsubscribes = activePolls.map((poll) => {
      return subscribePollVotes(poll.pollId, (votes) => {
        setPollVotes(prev => ({ ...prev, [poll.pollId]: votes }));
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [activePolls]);

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const success = await submitVote(pollId, optionId, userId, anonSessionId);
      if (success) {
        setVotedPolls(prev => ({ ...prev, [pollId]: true }));
      }
    } catch (error) {
      console.error("Gagal melakukan vote:", error);
    }
  };

  const calculateResults = (poll: PollItem) => {
    const votes = pollVotes[poll.pollId] || [];
    const totalVotes = votes.length;
    
    return poll.options.map(opt => {
      const count = votes.filter(v => v.optionId === opt.id).length;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        ...opt,
        count,
        percentage
      };
    });
  };

  if (activePolls.length === 0) {
    return null;
  }

  return (
    <div data-testid="poll-widget-wrapper">
      {activePolls.map((poll) => {
        const isClosed = poll.status === 'closed';
        const hasVoted = votedPolls[poll.pollId] || isClosed;
        const results = calculateResults(poll);
        const totalVotes = (pollVotes[poll.pollId] || []).length;

        return (
          <div key={poll.pollId} className="poll-container" data-testid={`poll-widget-${poll.pollId}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "600", color: isClosed ? "#ef4444" : "#10b981", textTransform: "uppercase" }}>
                {isClosed ? "Polling Ditutup" : "Polling Aktif"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>
                {totalVotes} suara
              </span>
            </div>
            <h3>{poll.title}</h3>
            {poll.description && (
              <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.6)", marginTop: "-8px", marginBottom: "12px" }}>
                {poll.description}
              </p>
            )}

            <div className="poll-options">
              {results.map((opt) => {
                if (hasVoted) {
                  return (
                    <div key={opt.id} className="poll-option-row" data-testid={`poll-result-${opt.id}`}>
                      <div className="poll-result-bar-wrapper">
                        <div className="poll-result-bar-fill" style={{ width: `${opt.percentage}%` }} />
                        <div className="poll-result-text">
                          <span>{opt.label}</span>
                          <span>{opt.percentage}% ({opt.count})</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={opt.id} className="poll-option-row">
                      <button
                        onClick={() => handleVote(poll.pollId, opt.id)}
                        className="poll-option-btn"
                        data-testid={`poll-option-${opt.id}`}
                      >
                        {opt.label}
                      </button>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
