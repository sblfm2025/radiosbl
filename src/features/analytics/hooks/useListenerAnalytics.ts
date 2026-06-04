import { useState, useCallback, useRef, useEffect } from "react";
import { getDeviceInfo } from "../utils/deviceInfo";
import {
  trackStreamPlay,
  trackStreamStop,
  updateSessionLocation
} from "../services/listenerAnalytics.service";
import { usePreciseLocationConsent } from "./usePreciseLocationConsent";
import { useStreamingHeartbeat } from "./useStreamingHeartbeat";

type UseListenerAnalyticsProps = {
  isPlaying: boolean;
  programId?: string;
  programTitle?: string;
  userId?: string;
};

export function useListenerAnalytics({
  isPlaying,
  programId,
  programTitle,
  userId
}: UseListenerAnalyticsProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const anonymousIdRef = useRef<string>("");

  const { consentStatus, requestLocation, denyLocation } = usePreciseLocationConsent();

  // Inisialisasi anonymous ID sekali per pemuatan app
  useEffect(() => {
    try {
      let stored = localStorage.getItem("radiosbl_anonymous_id");
      if (!stored) {
        stored = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("radiosbl_anonymous_id", stored);
      }
      anonymousIdRef.current = stored;
    } catch {
      anonymousIdRef.current = `anon-temp-${Date.now()}`;
    }
  }, []);

  const startSession = useCallback(async () => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    const device = getDeviceInfo();

    await trackStreamPlay({
      sessionId: newSessionId,
      userId,
      anonymousId: anonymousIdRef.current,
      deviceType: device.type,
      os: device.os,
      browser: device.browser,
      programId,
      programTitle
    });

    // Jika status persetujuan lokasi sudah granted sebelumnya, capture lokasi di latar belakang
    try {
      const storedConsent = localStorage.getItem("radiosbl_location_consent_status");
      if (storedConsent === "granted") {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            void updateSessionLocation({
              sessionId: newSessionId,
              permission: "granted",
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          () => {
            void updateSessionLocation({
              sessionId: newSessionId,
              permission: "failed"
            });
          }
        );
      }
    } catch {
      // Akses storage/lokasi bersifat opsional untuk analytics.
    }
  }, [userId, programId, programTitle]);

  const stopSession = useCallback(async () => {
    if (!sessionId) return;
    await trackStreamStop(sessionId);
    setSessionId(null);
  }, [sessionId]);

  // Pantau status pemutaran untuk start/pause/stop sesi
  useEffect(() => {
    if (isPlaying) {
      if (!sessionId) {
        void startSession();
      }
    } else {
      if (sessionId) {
        void stopSession();
      }
    }
  }, [isPlaying, sessionId, startSession, stopSession]);

  // Heartbeat tracking
  useStreamingHeartbeat({
    sessionId,
    isPlaying: isPlaying && !!sessionId
  });

  const captureLocationConsent = useCallback(async () => {
    if (!sessionId) return;

    const result = await requestLocation();
    
    await updateSessionLocation({
      sessionId,
      permission: result.permission,
      latitude: result.latitude,
      longitude: result.longitude,
      accuracy: result.accuracy
    });
  }, [sessionId, requestLocation]);

  const skipLocationConsent = useCallback(async () => {
    if (!sessionId) return;
    denyLocation();
    await updateSessionLocation({
      sessionId,
      permission: "denied"
    });
  }, [sessionId, denyLocation]);

  return {
    sessionId,
    consentStatus,
    captureLocationConsent,
    skipLocationConsent
  };
}
