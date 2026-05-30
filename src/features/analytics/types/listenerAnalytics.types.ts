/**
 * Listener Analytics Types
 * Fail-safe analytics tracking system for Radio SBL
 * Following LISTENER_ANALYTICS_MVP_RADIO_SBL.md specification
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Event types for listener analytics
 */
export type ListenerEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'heartbeat'
  | 'error'
  | 'session_start'
  | 'session_end';

/**
 * Device information
 */
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  isMobile: boolean;
  isPWA: boolean;
}

/**
 * Location information — berbasis IP geolocation (tanpa izin GPS)
 */
export interface LocationInfo {
  /** Nama kota/kabupaten (mis: "Pinrang", "Makassar") */
  city: string;
  /** Nama provinsi/wilayah (mis: "South Sulawesi") */
  region: string;
  /** Nama lengkap negara (mis: "Indonesia") */
  country: string;
  /** Kode negara ISO 2 huruf (mis: "ID") */
  countryCode: string;
  /** Latitude dari IP geolocation (akurasi tingkat kota) */
  latitude: number;
  /** Longitude dari IP geolocation (akurasi tingkat kota) */
  longitude: number;
  /** Nama ISP/provider internet pendengar */
  isp?: string;
}

/**
 * Base analytics event
 */
export interface ListenerAnalyticsEvent {
  id: string;
  sessionId: string;
  eventType: ListenerEventType;
  timestamp: Timestamp;
  deviceInfo: DeviceInfo;
  location?: LocationInfo;
  programId?: string | null;
  programName?: string | null;
  broadcasterId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Listener session information
 */
export interface ListenerSession {
  id: string;
  userId?: string; // Optional: logged-in users only
  deviceInfo: DeviceInfo;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number; // in seconds
  events: number;
  location?: LocationInfo;
  programId?: string | null;
  programName?: string | null;
  broadcasterId?: string | null;
  isActive: boolean;
  lastActivity: Timestamp;
}

/**
 * Daily analytics summary
 */
export interface ListenerAnalyticsDaily {
  id: string; // Format: YYYY-MM-DD
  date: Timestamp;
  totalSessions: number;
  totalDuration: number; // in seconds
  uniqueListeners: number;
  averageSessionDuration: number;
  peakActiveListeners: number;
  peakActiveTime?: Timestamp;
  deviceBreakdown: Record<string, number>;
  programBreakdown: Record<string, number>;
  locationBreakdown?: {
    totalWithLocation: number;
    /** Jumlah sesi per kota: { "Pinrang": 12, "Makassar": 5 } */
    cities: Record<string, number>;
    /** Jumlah sesi per provinsi: { "South Sulawesi": 17 } */
    regions: Record<string, number>;
    /** Jumlah sesi per negara: { "Indonesia": 17, "Malaysia": 2 } */
    countries: Record<string, number>;
  };
}

/**
 * Analytics service configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  heartbeatInterval: number; // milliseconds
  sessionTimeout: number; // milliseconds
  enableLocation: boolean; // require explicit user consent
  batchSize: number; // number of events to batch before sending
  debug: boolean;
}

/**
 * Default analytics configuration (MVP safe defaults)
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  heartbeatInterval: 60000, // 60 seconds
  sessionTimeout: 300000, // 5 minutes of inactivity
  enableLocation: false, // disabled by default
  batchSize: 10,
  debug: false,
};

/**
 * Location permission status
 */
export type LocationPermissionStatus =
  | 'not_requested'
  | 'granted'
  | 'denied'
  | 'error';

/**
 * Analytics service initialization result
 */
export interface AnalyticsInitResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}