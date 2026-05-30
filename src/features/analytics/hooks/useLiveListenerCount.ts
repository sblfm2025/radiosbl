import { useEffect, useState, useCallback, useRef } from "react";
import { analyticsService, SessionStats } from "../services/analytics.service";

export interface LiveListenerCountHookResult {
  listenerCount: number;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  isConnected: boolean;
}

export function useLiveListenerCount(
  options: {
    enabled?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number; // default: 30 detik
  } = {}
): LiveListenerCountHookResult {
  const {
    enabled = true,
    autoRefresh = true,
    refreshInterval = 30000, // 30 detik
  } = options;

  const [listenerCount, setListenerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef<boolean>(false);

  // Fungsi untuk mengambil data listener count
  const refresh = useCallback(async () => {
    if (!enabled || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const stats: SessionStats = await analyticsService.getSessionStats();
      setListenerCount(stats.activeSessionsCount);
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengambil data listener";
      setError(errorMessage);
      setIsConnected(false);
      console.error("[useLiveListenerCount] Error:", errorMessage);
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
    listenerCount,
    loading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  };
}
