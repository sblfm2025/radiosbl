import { useEffect, useState, useCallback, useRef } from "react";
import { analyticsService, TopContent, TopContentTimeRange } from "../services/analytics.service";

export interface TopContentHookResult {
  topContent: TopContent[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  isMonitoring: boolean;
}

export function useTopContent(
  timeRange: TopContentTimeRange = TopContentTimeRange.WEEK,
  options: {
    enabled?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number; // default: 5 menit
    limit?: number; // default: 10
  } = {}
): TopContentHookResult {
  const {
    enabled = true,
    autoRefresh = true,
    refreshInterval = 300000, // 5 menit
    limit = 10,
  } = options;

  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRangeRef = useRef<TopContentTimeRange>(timeRange);
  const limitRef = useRef<number>(limit);
  const loadingRef = useRef<boolean>(false);

  // Update refs jika berubah
  useEffect(() => {
    timeRangeRef.current = timeRange;
    limitRef.current = limit;
  }, [timeRange, limit]);

  // Fungsi untuk mengambil data top content
  const refresh = useCallback(async () => {
    if (!enabled || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const contentData: TopContent[] = await analyticsService.getTopContent(timeRangeRef.current, limitRef.current);
      setTopContent(contentData);
      setLastUpdate(new Date());
      setIsMonitoring(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengambil data top content";
      setError(errorMessage);
      setIsMonitoring(false);
      console.error("[useTopContent] Error:", errorMessage);
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
    topContent,
    loading,
    error,
    lastUpdate,
    refresh,
    isMonitoring,
  };
}
