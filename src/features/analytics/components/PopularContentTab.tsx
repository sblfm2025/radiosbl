/**
 * PopularContentTab.tsx
 * Peringkat program berdasarkan durasi dengar dan aktivitas putar.
 */

import { useMemo } from "react";
import type { ListenerAnalyticsSession } from "../../../types/domain";
import { formatDurationLong } from "../utils/analyticsHelpers";
import { Award, Clock, Headphones, Play, ShieldAlert } from "lucide-react";

type PopularContentTabProps = {
  sessions: ListenerAnalyticsSession[];
};

type ProgramExtendedStats = {
  title: string;
  uniqueListeners: Set<string>;
  totalPlayCount: number;
  totalDurationSeconds: number;
};

export function PopularContentTab({ sessions }: PopularContentTabProps) {
  const programRanking = useMemo(() => {
    const map = new Map<string, ProgramExtendedStats>();

    for (const s of sessions) {
      const title = s.program?.title || "Siaran Live Streaming";
      const deviceId = s.anonymousId || "unknown_device";
      const existing = map.get(title) || {
        title,
        uniqueListeners: new Set<string>(),
        totalPlayCount: 0,
        totalDurationSeconds: 0
      };

      existing.uniqueListeners.add(deviceId);
      existing.totalPlayCount += s.playback?.playCount || 1;
      existing.totalDurationSeconds += s.playback?.playDurationSeconds || 0;
      map.set(title, existing);
    }

    return Array.from(map.values())
      .map((item) => ({
        title: item.title,
        listenersCount: item.uniqueListeners.size,
        totalPlays: item.totalPlayCount,
        totalSeconds: item.totalDurationSeconds,
        avgMinutes:
          item.uniqueListeners.size > 0
            ? Math.round(item.totalDurationSeconds / item.uniqueListeners.size / 60)
            : 0
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [sessions]);

  const maxSeconds = useMemo(() => {
    if (programRanking.length === 0) return 1;
    return Math.max(...programRanking.map((p) => p.totalSeconds), 1);
  }, [programRanking]);

  return (
    <div className="analytics-tab-stack">
      <div className="analytics-card analytics-list-card">
        <div className="analytics-card-header analytics-card-header-bordered">
          <div className="analytics-title-stack">
            <span>
              <Award size={18} />
              Daftar Program Terpopuler
            </span>
            <small>Peringkat program berdasarkan akumulasi durasi dengar dari seluruh sesi pendengar.</small>
          </div>
        </div>

        <div className="analytics-list-body">
          {programRanking.length === 0 ? (
            <div className="analytics-empty-state compact">
              <ShieldAlert size={36} />
              <p>Belum Ada Data Program</p>
              <span>Data akan muncul setelah pendengar memutar program melalui aplikasi.</span>
            </div>
          ) : (
            <div className="analytics-ranking-list">
              {programRanking.map((program, idx) => {
                const percentage = Math.round((program.totalSeconds / maxSeconds) * 100);

                return (
                  <article key={program.title} className="analytics-ranking-item">
                    <div className="analytics-ranking-row">
                      <div className="analytics-ranking-copy">
                        <span className={`analytics-rank-badge rank-${Math.min(idx + 1, 3)}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <strong>{program.title}</strong>
                          <div className="analytics-ranking-meta">
                            <span>
                              <Headphones size={11} />
                              {program.listenersCount} pendengar unik
                            </span>
                            <span>
                              <Play size={11} />
                              {program.totalPlays} putar
                            </span>
                            <span>
                              <Clock size={11} />
                              Rata-rata {program.avgMinutes} menit / sesi
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="analytics-ranking-value">
                        <strong>{formatDurationLong(program.totalSeconds)}</strong>
                        <span>Durasi Total</span>
                      </div>
                    </div>

                    <div className="analytics-progress-track">
                      <div
                        className={idx === 0 ? "analytics-progress-fill gold" : "analytics-progress-fill"}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
