import { useEffect, useState, useCallback, useRef } from "react";
import { analyticsService, RealTimeListenerData } from "../services/analytics.service";

export interface RealTimeListenersHookResult {
  currentListeners: number;
  peakListeners: number;
  trend: "up" | "down" | "stable";
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  isConnected: boolean;
}

export function useRealTimeListeners(
  options: {
    enabled?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number; // default: 30 detik
  } = {}
): RealTimeListenersHookResult {
  const {
    enabled = true,
    autoRefresh = true,
    refreshInterval = 30000, // 30 detik
  } = options;

  const [currentListeners, setCurrentListeners] = useState<number>(0);
  const [peakListeners, setPeakListeners] = useState<number>(0);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousCountRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  // Fungsi untuk mengambil data real-time listeners
  const refresh = useCallback(async () => {
    if (!enabled || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data: RealTimeListenerData = await analyticsService.getRealTimeListeners();
      
      // Hitung trend
      const previousCount = previousCountRef.current;
      let newTrend: "up" | "down" | "stable" = "stable";
      
      if (data.currentListeners > previousCount + 5) {
        newTrend = "up";
      } else if (data.currentListeners < previousCount - 5) {
        newTrend = "down";
      }
      
      setCurrentListeners(data.currentListeners);
      setPeakListeners((prevPeak) => Math.max(prevPeak, data.currentListeners));
      setTrend(newTrend);
      setLastUpdate(new Date());
      setIsConnected(true);
      
      // Update previous count untuk trend berikutnya
      previousCountRef.current = data.currentListeners;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengambil data real-time listeners";
      setError(errorMessage);
      setIsConnected(false);
      console.error("[useRealTimeListeners] Error:", errorMessage);
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
    currentListeners,
    peakListeners,
    trend,
    loading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  };
}
