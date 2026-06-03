import { useEffect, useRef } from "react";
import { trackStreamHeartbeat } from "../services/listenerAnalytics.service";

type UseStreamingHeartbeatProps = {
  sessionId: string | null;
  isPlaying: boolean;
  intervalMs?: number;
};

export function useStreamingHeartbeat({
  sessionId,
  isPlaying,
  intervalMs = 15 * 1000
}: UseStreamingHeartbeatProps) {
  const intervalRef = useRef<number | null>(null);
  const lastActiveSessionRef = useRef<string | null>(null);

  useEffect(() => {
    lastActiveSessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!isPlaying || !sessionId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    void trackStreamHeartbeat({
      sessionId,
      additionalSeconds: 0
    });

    intervalRef.current = window.setInterval(() => {
      const activeSession = lastActiveSessionRef.current;
      if (activeSession) {
        void trackStreamHeartbeat({
          sessionId: activeSession,
          additionalSeconds: intervalMs / 1000
        });
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, sessionId, intervalMs]);
}
