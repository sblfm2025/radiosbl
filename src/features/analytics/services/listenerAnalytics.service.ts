/**
 * Listener Analytics Service
 * Handles session management, event batching, and Firestore writes
 * Design: Fail-safe — all write errors are logged but never block UI
 * 
 * Following LISTENER_ANALYTICS_MVP_RADIO_SBL.md specification
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../../lib/firebase';
import {
  ANALYTICS_COLLECTIONS,
} from './analyticsCollection.service';
import {
  type ListenerAnalyticsEvent,
  type ListenerSession,
  type ListenerAnalyticsDaily,
  type ListenerEventType,
  type DeviceInfo,
  type AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
} from '../types/listenerAnalytics.types';

// ── Session ID Generation ─────────────────────────────────────────────

/**
 * Generate a unique session ID based on device fingerprint and timestamp
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ls_${timestamp}_${random}`;
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `ev_${timestamp}_${random}`;
}

// ── Device Detection ───────────────────────────────────────────────────

/**
 * Detect device information from the browser
 */
export function detectDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  // Simple browser detection
  let browser = 'unknown';
  if (ua.includes('Firefox/')) browser = 'firefox';
  else if (ua.includes('Edg/')) browser = 'edge';
  else if (ua.includes('Chrome/')) browser = 'chrome';
  else if (ua.includes('Safari/')) browser = 'safari';

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;

  return {
    userAgent: ua,
    platform: navigator.platform || 'unknown',
    browser,
    isMobile,
    isPWA,
  };
}

// ── Firestore Write Helpers ────────────────────────────────────────────

/**
 * Write or update a listener session document (fail-safe)
 */
export async function writeSession(session: ListenerSession): Promise<void> {
  try {
    const ref = doc(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS, session.id);
    await setDoc(ref, session, { merge: true });
  } catch (error) {
    console.warn('[Analytics] Failed to write session:', error);
  }
}

/**
 * End a listener session (fail-safe)
 */
export async function endSession(sessionId: string, endTime: Timestamp, duration: number): Promise<void> {
  try {
    const ref = doc(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS, sessionId);
    await updateDoc(ref, {
      endTime,
      duration,
      isActive: false,
      lastActivity: endTime,
    });
  } catch (error) {
    console.warn('[Analytics] Failed to end session:', error);
  }
}

/**
 * Write a single analytics event (fail-safe)
 */
export async function writeEvent(event: ListenerAnalyticsEvent): Promise<void> {
  try {
    const ref = collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.EVENTS);
    await addDoc(ref, event);
  } catch (error) {
    console.warn('[Analytics] Failed to write event:', error);
  }
}

/**
 * Write a batch of analytics events (fail-safe)
 */
export async function writeEventBatch(events: ListenerAnalyticsEvent[]): Promise<void> {
  if (events.length === 0) return;
  
  try {
    const batch = writeBatch(getFirebaseFirestore());
    const ref = collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.EVENTS);
    
    for (const event of events) {
      const docRef = doc(ref);
      batch.set(docRef, event);
    }
    
    await batch.commit();
  } catch (error) {
    console.warn('[Analytics] Failed to write event batch:', error);
  }
}

// ── Daily Summary ──────────────────────────────────────────────────────

/**
 * Get or create a daily summary document
 */
export async function getDailySummary(dateStr: string): Promise<ListenerAnalyticsDaily | null> {
  try {
    const ref = doc(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.DAILY_SUMMARIES, dateStr);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as ListenerAnalyticsDaily : null;
  } catch (error) {
    console.warn('[Analytics] Failed to get daily summary:', error);
    return null;
  }
}

/**
 * Write or update daily summary (fail-safe)
 */
export async function writeDailySummary(summary: ListenerAnalyticsDaily): Promise<void> {
  try {
    const ref = doc(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.DAILY_SUMMARIES, summary.id);
    await setDoc(ref, summary, { merge: true });
  } catch (error) {
    console.warn('[Analytics] Failed to write daily summary:', error);
  }
}

// ── Query Helpers ──────────────────────────────────────────────────────

/**
 * Get active sessions count
 */
export async function getActiveSessionsCount(): Promise<number> {
  try {
    const q = query(
      collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS),
      where('isActive', '==', true),
      limit(500)
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.warn('[Analytics] Failed to count active sessions:', error);
    return 0;
  }
}

/**
 * Get sessions for a date range
 */
export async function getSessionsByDateRange(
  startDate: Timestamp,
  endDate: Timestamp
): Promise<ListenerSession[]> {
  try {
    const q = query(
      collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS),
      where('startTime', '>=', startDate),
      where('startTime', '<=', endDate),
      orderBy('startTime', 'desc'),
      limit(1000)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ListenerSession);
  } catch (error) {
    console.warn('[Analytics] Failed to query sessions by date:', error);
    return [];
  }
}

/**
 * Subscribe to active sessions count (real-time)
 */
export function subscribeToActiveListeners(
  callback: (count: number) => void
): () => void {
  const q = query(
    collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS),
    where('isActive', '==', true),
    limit(500)
  );
  
  return onSnapshot(
    q,
    (snap) => callback(snap.size),
    (error) => {
      console.warn('[Analytics] Active listeners subscription error:', error);
      callback(0);
    }
  );
}

// ── Daily Summary Aggregation ──────────────────────────────────────────

/**
 * Aggregate daily summary from sessions (fail-safe)
 * Called by cloud function or manually for MVP
 */
export async function aggregateDailySummary(dateStr: string): Promise<ListenerAnalyticsDaily | null> {
  try {
    // Parse date boundaries
    const [year, month, day] = dateStr.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

    const sessions = await getSessionsByDateRange(
      Timestamp.fromDate(startOfDay),
      Timestamp.fromDate(endOfDay)
    );

    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Unique listeners by device fingerprint (MVP approximation)
    const uniqueDevices = new Set(sessions.map((s) => s.deviceInfo.userAgent));
    const uniqueListeners = uniqueDevices.size;

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    sessions.forEach((s) => {
      const key = s.deviceInfo.isMobile ? 'mobile' : 'desktop';
      deviceBreakdown[key] = (deviceBreakdown[key] || 0) + 1;
    });

    // Program breakdown
    const programBreakdown: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.programName) {
        programBreakdown[s.programName] = (programBreakdown[s.programName] || 0) + 1;
      }
    });

    const summary: ListenerAnalyticsDaily = {
      id: dateStr,
      date: Timestamp.fromDate(startOfDay),
      totalSessions,
      totalDuration,
      uniqueListeners,
      averageSessionDuration,
      peakActiveListeners: 0, // requires real-time tracking
      deviceBreakdown,
      programBreakdown,
    };

    await writeDailySummary(summary);
    return summary;
  } catch (error) {
    console.warn('[Analytics] Failed to aggregate daily summary:', error);
    return null;
  }
}

// ── Export types for hooks (already exported by types) ────────────────────────