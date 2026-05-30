import { useEffect, useState, useCallback, useRef } from "react";
import { analyticsService, ActiveSession } from "../services/analytics.service";

export interface ActiveSessionsHookResult {
  sessions: ActiveSession[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  isMonitoring: boolean;
}

export function useActiveSessions(
  options: {
    enabled?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number; // default: 30 detik
  } = {}
): ActiveSessionsHookResult {
  const {
    enabled = true,
    autoRefresh = true,
    refreshInterval = 30000, // 30 detik
  } = options;

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef<boolean>(false);

  // Fungsi untuk mengambil data sesi aktif
  const refresh = useCallback(async () => {
    if (!enabled || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const activeSessions: ActiveSession[] = await analyticsService.getActiveSessions();
      setSessions(activeSessions);
      setLastUpdate(new Date());
      setIsMonitoring(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengambil data sesi aktif";
      setError(errorMessage);
      setIsMonitoring(false);
      console.error("[useActiveSessions] Error:", errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [enabled]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Setup auto-refresh
  useEffect(() => {
    if (!enabled || !autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch awal
    refreshRef.current();

    // Setup interval
    intervalRef.current = setInterval(() => {
      refreshRef.current();
    }, refreshInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, autoRefresh, refreshInterval]);

  return {
    sessions,
    loading,
    error,
    lastUpdate,
    refresh,
    isMonitoring,
  };
}
