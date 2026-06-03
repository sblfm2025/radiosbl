import { useCallback } from "react";

export type PlaybackProgress = {
  episodeId: string;
  currentTime: number;
  duration: number;
  updatedAt: string;
};

const PROGRESS_PREFIX = "radiosbl_episode_progress_";

export function useEpisodeProgress() {
  const getProgress = useCallback((episodeId: string): PlaybackProgress | null => {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(`${PROGRESS_PREFIX}${episodeId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  const saveProgress = useCallback((episodeId: string, currentTime: number, duration: number) => {
    if (typeof window === "undefined" || !episodeId || duration <= 0) return;
    
    // Jika progres > 95%, anggap episode selesai dan hapus progresnya
    if (currentTime / duration > 0.95) {
      clearProgress(episodeId);
      return;
    }

    try {
      const progress: PlaybackProgress = {
        episodeId,
        currentTime,
        duration,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`${PROGRESS_PREFIX}${episodeId}`, JSON.stringify(progress));
    } catch (err) {
      console.warn("Gagal menyimpan progres pemutaran:", err);
    }
  }, []);

  const clearProgress = useCallback((episodeId: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`${PROGRESS_PREFIX}${episodeId}`);
    } catch (err) {
      console.warn("Gagal menghapus progres pemutaran:", err);
    }
  }, []);

  return {
    getProgress,
    saveProgress,
    clearProgress
  };
}
