import type { ListenerAnalyticsSession } from "../../../types/domain";
import { Award, Clock } from "lucide-react";

type ProgramPerformanceCardProps = {
  sessions: ListenerAnalyticsSession[];
};

type ProgramStats = {
  title: string;
  playCount: number;
  totalDurationSeconds: number;
};

export function ProgramPerformanceCard({ sessions }: ProgramPerformanceCardProps) {
  // Kelompokkan sesi berdasarkan nama program
  const statsMap = sessions.reduce((acc, s) => {
    const title = s.program?.title || "Siaran Live Umum";
    const current = acc.get(title) || { title, playCount: 0, totalDurationSeconds: 0 };
    
    acc.set(title, {
      title,
      playCount: current.playCount + (s.playback?.playCount || 1),
      totalDurationSeconds: current.totalDurationSeconds + (s.playback?.playDurationSeconds || 0)
    });
    return acc;
  }, new Map<string, ProgramStats>());

  const sortedStats = Array.from(statsMap.values()).sort(
    (a, b) => b.playCount - a.playCount || b.totalDurationSeconds - a.totalDurationSeconds
  );

  const formatDurationText = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}j ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="workflow-card">
      <div className="workflow-card-header">
        <span className="workflow-card-title">
          <Award size={18} />
          Performa Program
        </span>
      </div>
      <div className="workflow-card-body">
        <div className="performance-list">
          {sortedStats.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              Belum ada data pemutaran program.
            </div>
          ) : (
            sortedStats.slice(0, 5).map((item, idx) => (
              <div key={item.title} className="performance-item-row">
                <div>
                  <div className="performance-title">
                    {idx + 1}. {item.title}
                  </div>
                  <div className="performance-stats-meta">
                    <span>Total Putar: {item.playCount}x</span>
                  </div>
                </div>
                <div className="performance-metric">
                  <span className="performance-count-badge">
                    {formatDurationText(item.totalDurationSeconds)}
                  </span>
                  <span className="performance-dur">Estimasi Dengar</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
