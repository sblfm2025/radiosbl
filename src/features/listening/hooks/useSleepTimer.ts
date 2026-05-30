import { useState, useEffect, useRef, useCallback } from "react";
import { useGlobalAudio } from "../../../contexts/useGlobalAudio";

export function useSleepTimer() {
  const { playing, togglePlayback, setPlayerStatus } = useGlobalAudio();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(0); // 0 = Off
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSelectedMinutes(0);
    setRemainingSeconds(0);
  }, []);

  const startTimer = useCallback((minutes: number) => {
    cancelTimer();
    if (minutes <= 0) return;

    setSelectedMinutes(minutes);
    const totalSeconds = minutes * 60;
    setRemainingSeconds(totalSeconds);

    const startTime = Date.now();
    const endTime = startTime + totalSeconds * 1000;

    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.round((endTime - now) / 1000));
      setRemainingSeconds(timeLeft);

      if (timeLeft <= 0) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);

    timerRef.current = window.setTimeout(() => {
      if (playing) {
        void togglePlayback();
      }
      if (setPlayerStatus) {
        setPlayerStatus("timer-ended");
      }
      cancelTimer();
    }, totalSeconds * 1000);
  }, [playing, togglePlayback, setPlayerStatus, cancelTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const isActive = selectedMinutes > 0 && remainingSeconds > 0;

  return {
    selectedMinutes,
    remainingSeconds,
    isActive,
    startTimer,
    cancelTimer,
  };
}
