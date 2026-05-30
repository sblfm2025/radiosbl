import { useState } from "react";
import { useSleepTimer } from "../hooks/useSleepTimer";
import { Clock } from "lucide-react";
import "../styles/listening.css";

export function SleepTimerControl() {
  const { selectedMinutes, remainingSeconds, isActive, startTimer, cancelTimer } = useSleepTimer();
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customInput, 10);
    if (!isNaN(mins) && mins > 0) {
      startTimer(mins);
      setCustomInput("");
      setShowCustom(false);
    }
  };

  const presets = [15, 30, 45, 60];

  return (
    <div className="sleep-timer-container" data-testid="sleep-timer-control">
      <div className="sleep-timer-title">
        <Clock size={16} style={{ verticalAlign: "middle", marginRight: "6px", display: "inline-block" }} />
        <span>Sleep Timer</span>
      </div>

      <div className="sleep-timer-buttons">
        <button
          type="button"
          className={`sleep-timer-btn ${!isActive && !showCustom ? "active" : ""}`}
          onClick={() => {
            cancelTimer();
            setShowCustom(false);
          }}
        >
          Mati
        </button>

        {presets.map((mins) => (
          <button
            key={mins}
            type="button"
            className={`sleep-timer-btn ${isActive && selectedMinutes === mins ? "active" : ""}`}
            onClick={() => {
              startTimer(mins);
              setShowCustom(false);
            }}
          >
            {mins}m
          </button>
        ))}

        <button
          type="button"
          className={`sleep-timer-btn ${showCustom ? "active" : ""}`}
          onClick={() => setShowCustom(true)}
        >
          Kustom
        </button>
      </div>

      {showCustom && (
        <form onSubmit={handleCustomSubmit} className="sleep-timer-custom">
          <div className="sleep-timer-input-wrapper">
            <input
              type="number"
              min="1"
              max="1440"
              placeholder="Menit"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="sleep-timer-input"
              aria-label="Kustom menit"
              required
            />
            <span>menit</span>
          </div>
          <button type="submit" className="sleep-timer-btn active">
            Set
          </button>
        </form>
      )}

      {isActive && (
        <div className="sleep-timer-status" data-testid="sleep-timer-status">
          <span className="player-status-dot" style={{ backgroundColor: "#10b981" }} />
          <span>
            Berhenti dalam: <strong>{formatRemainingTime(remainingSeconds)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
