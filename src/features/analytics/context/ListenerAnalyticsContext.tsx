import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import {
  generateSessionId,
  generateEventId,
  detectDeviceInfo,
  writeSession,
  endSession,
  writeEvent,
} from "../services/listenerAnalytics.service";
import {
  fetchGeoLocation,
  type GeoLocation,
} from "../services/geolocation.service";
import { type LocationInfo, type ListenerSession, type ListenerAnalyticsEvent } from "../types/listenerAnalytics.types";

export interface ListenerAnalyticsContextType {
  sessionId: string;
  trackPlay: (programId?: string, programTitle?: string) => Promise<void>;
  trackPause: () => Promise<void>;
  trackStop: () => Promise<void>;
  /** Status pengambilan geolokasi IP (otomatis, tanpa izin pengguna) */
  geoLocation: GeoLocation | null;
  geoStatus: "idle" | "loading" | "ready" | "failed";
}

const ListenerAnalyticsContext = createContext<ListenerAnalyticsContextType | undefined>(undefined);

export function ListenerAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const sessionIdRef = useRef<string>(generateSessionId());
  const deviceInfoRef = useRef<ReturnType<typeof detectDeviceInfo>>(detectDeviceInfo());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playDurationRef = useRef<number>(0);

  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const geoLocationRef = useRef<GeoLocation | null>(null);

  const [currentProgram, setCurrentProgram] = useState<{ id?: string; title?: string }>({});
  const currentProgramRef = useRef<{ id?: string; title?: string }>({});

  const setCurrentProgramWithRef = useCallback((prog: { id?: string; title?: string }) => {
    currentProgramRef.current = prog;
    setCurrentProgram(prog);
  }, []);

  /** Konversi GeoLocation ke LocationInfo untuk disimpan ke Firestore */
  function geoToLocationInfo(geo: GeoLocation): LocationInfo {
    return {
      city: geo.city,
      region: geo.region,
      country: geo.country,
      countryCode: geo.countryCode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
    };
  }

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      playDurationRef.current += 60; // 60 detik
      
      const prog = currentProgramRef.current;
      const geo = geoLocationRef.current;
      const loc = geo ? geoToLocationInfo(geo) : undefined;

      const sessionUpdate: ListenerSession = {
        id: sessionIdRef.current,
        deviceInfo: deviceInfoRef.current,
        startTime: Timestamp.now(), // fallback, will merge
        duration: playDurationRef.current,
        events: 1,
        isActive: true,
        lastActivity: Timestamp.now(),
        programId: prog.id ?? null,
        programName: prog.title ?? null,
      };

      if (loc) sessionUpdate.location = loc;
      await writeSession(sessionUpdate);

      // Kirim event heartbeat
      const heartbeatEvent: ListenerAnalyticsEvent = {
        id: generateEventId(),
        sessionId: sessionIdRef.current,
        eventType: "heartbeat",
        timestamp: Timestamp.now(),
        deviceInfo: deviceInfoRef.current,
        programId: prog.id ?? null,
        programName: prog.title ?? null,
      };
      if (loc) heartbeatEvent.location = loc;
      await writeEvent(heartbeatEvent);
    }, 60000); // 60 detik
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const trackPlay = useCallback(async (programId?: string, programTitle?: string) => {
    setCurrentProgramWithRef({ id: programId, title: programTitle });
    startHeartbeat();

    const geo = geoLocationRef.current;
    const loc = geo ? geoToLocationInfo(geo) : undefined;

    const session: ListenerSession = {
      id: sessionIdRef.current,
      deviceInfo: deviceInfoRef.current,
      startTime: Timestamp.now(),
      duration: playDurationRef.current,
      events: 1,
      isActive: true,
      lastActivity: Timestamp.now(),
      programId: programId ?? null,
      programName: programTitle ?? null,
    };

    if (loc) session.location = loc;
    await writeSession(session);

    // Kirim event play
    const playEvent: ListenerAnalyticsEvent = {
      id: generateEventId(),
      sessionId: sessionIdRef.current,
      eventType: "play",
      timestamp: Timestamp.now(),
      deviceInfo: deviceInfoRef.current,
      programId: programId ?? null,
      programName: programTitle ?? null,
    };
    if (loc) playEvent.location = loc;
    await writeEvent(playEvent);
  }, [startHeartbeat, setCurrentProgramWithRef]);

  const trackPause = useCallback(async () => {
    stopHeartbeat();

    const geo = geoLocationRef.current;
    const loc = geo ? geoToLocationInfo(geo) : undefined;
    const prog = currentProgramRef.current;

    const pauseEvent: ListenerAnalyticsEvent = {
      id: generateEventId(),
      sessionId: sessionIdRef.current,
      eventType: "pause",
      timestamp: Timestamp.now(),
      deviceInfo: deviceInfoRef.current,
      programId: prog.id ?? null,
      programName: prog.title ?? null,
    };
    if (loc) pauseEvent.location = loc;
    await writeEvent(pauseEvent);

    const sessionUpdate: ListenerSession = {
      id: sessionIdRef.current,
      deviceInfo: deviceInfoRef.current,
      startTime: Timestamp.now(),
      duration: playDurationRef.current,
      events: 1,
      isActive: false,
      lastActivity: Timestamp.now(),
      programId: prog.id ?? null,
      programName: prog.title ?? null,
    };
    if (loc) sessionUpdate.location = loc;
    await writeSession(sessionUpdate);
  }, [stopHeartbeat]);

  const trackStop = useCallback(async () => {
    stopHeartbeat();

    const geo = geoLocationRef.current;
    const loc = geo ? geoToLocationInfo(geo) : undefined;
    const prog = currentProgramRef.current;

    const stopEvent: ListenerAnalyticsEvent = {
      id: generateEventId(),
      sessionId: sessionIdRef.current,
      eventType: "stop",
      timestamp: Timestamp.now(),
      deviceInfo: deviceInfoRef.current,
      programId: prog.id ?? null,
      programName: prog.title ?? null,
    };
    if (loc) stopEvent.location = loc;
    await writeEvent(stopEvent);

    await endSession(sessionIdRef.current, Timestamp.now(), playDurationRef.current);
  }, [stopHeartbeat]);

  // Ambil geolokasi berbasis IP saat provider pertama kali mount (background, non-blocking)
  useEffect(() => {
    setGeoStatus("loading");
    fetchGeoLocation()
      .then((geo) => {
        if (geo) {
          geoLocationRef.current = geo;
          setGeoLocation(geo);
          setGeoStatus("ready");
        } else {
          setGeoStatus("failed");
        }
      })
      .catch(() => setGeoStatus("failed"));
  }, []);

  // Bersihkan heartbeat saat unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return (
    <ListenerAnalyticsContext.Provider
      value={{
        sessionId: sessionIdRef.current,
        trackPlay,
        trackPause,
        trackStop,
        geoLocation,
        geoStatus,
      }}
    >
      {children}
    </ListenerAnalyticsContext.Provider>
  );
}

export function useListenerAnalytics() {
  const context = useContext(ListenerAnalyticsContext);
  if (context === undefined) {
    throw new Error("useListenerAnalytics must be used within a ListenerAnalyticsProvider");
  }
  return context;
}
