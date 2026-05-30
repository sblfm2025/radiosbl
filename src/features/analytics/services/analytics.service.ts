import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../../lib/firebase';
import { ANALYTICS_COLLECTIONS } from './analyticsCollection.service';
import { getActiveSessionsCount } from './listenerAnalytics.service';

export enum MetricsTimeRange {
  TODAY = "TODAY",
  LAST_7_DAYS = "LAST_7_DAYS",
  LAST_30_DAYS = "LAST_30_DAYS",
}

export enum TopContentTimeRange {
  TODAY = "TODAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
}

export interface SessionStats {
  activeSessionsCount: number;
}

export interface ActiveSession {
  id: string;
  startTime: Timestamp;
  lastActivity: Timestamp;
  duration: number;
  deviceInfo: {
    browser: string;
    platform: string;
    isMobile: boolean;
  };
  programName?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
  };
}

/** Data sebaran wilayah pendengar */
export interface LocationBreakdown {
  /** Total sesi yang memiliki data lokasi */
  totalWithLocation: number;
  /** Sesi per kota: [{ city, count, region, countryCode }] diurutkan terbanyak */
  cities: Array<{ city: string; region: string; country: string; countryCode: string; count: number }>;
  /** Sesi per provinsi: { "South Sulawesi": 17 } */
  regions: Record<string, number>;
  /** Sesi per negara: { "Indonesia": 17 } */
  countries: Record<string, { name: string; code: string; count: number }>;
}

export interface ListenerMetrics {
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  uniqueListenersCount: number;
  peakListenersCount: number;
  locationConsentCount: number;
}

export interface RealTimeListenerData {
  currentListeners: number;
  peakListeners: number;
  trend: "up" | "down" | "stable";
}

export interface TopContent {
  id: string;
  title: string;
  type: string;
  playCount: number;
  listenTime: number;
}

class AnalyticsService {
  async getSessionStats(): Promise<SessionStats> {
    try {
      const activeSessionsCount = await getActiveSessionsCount();
      return { activeSessionsCount };
    } catch (error) {
      console.warn('[AnalyticsService] Failed to get session stats:', error);
      return { activeSessionsCount: 0 };
    }
  }

  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const q = query(
        collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS),
        where('isActive', '==', true),
        orderBy('lastActivity', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((docVal) => {
        const data = docVal.data();
        return {
          id: docVal.id,
          startTime: data.startTime,
          lastActivity: data.lastActivity,
          duration: data.duration || 0,
          deviceInfo: data.deviceInfo || { browser: 'unknown', platform: 'unknown', isMobile: false },
          programName: data.programName,
          location: data.location,
        };
      });
    } catch (error) {
      console.warn('[AnalyticsService] Failed to get active sessions:', error);
      return [];
    }
  }

  async getListenerMetrics(timeRange: MetricsTimeRange): Promise<ListenerMetrics> {
    let startDate = new Date();
    if (timeRange === MetricsTimeRange.TODAY) {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === MetricsTimeRange.LAST_7_DAYS) {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    try {
      const q = query(
        collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS),
        where('startTime', '>=', Timestamp.fromDate(startDate))
      );
      const snap = await getDocs(q);
      const sessions = snap.docs.map((d) => d.data());
      
      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
      const uniqueListeners = new Set(sessions.map((s) => s.deviceInfo?.userAgent)).size;
      const locationConsentCount = sessions.filter((s) => s.location).length;

      return {
        totalSessions,
        totalDuration,
        averageDuration,
        uniqueListenersCount: uniqueListeners,
        peakListenersCount: Math.max(totalSessions, 1),
        locationConsentCount,
      };
    } catch (error) {
      console.warn('[AnalyticsService] Failed to get listener metrics:', error);
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageDuration: 0,
        uniqueListenersCount: 0,
        peakListenersCount: 0,
        locationConsentCount: 0,
      };
    }
  }

  async getRealTimeListeners(): Promise<RealTimeListenerData> {
    try {
      const currentListeners = await getActiveSessionsCount();
      return {
        currentListeners,
        peakListeners: Math.max(currentListeners, 1),
        trend: "stable",
      };
    } catch (error) {
      console.warn('[AnalyticsService] Failed to get real-time listeners:', error);
      return {
        currentListeners: 0,
        peakListeners: 0,
        trend: "stable",
      };
    }
  }

  async getTopContent(timeRange: TopContentTimeRange, limitCount: number): Promise<TopContent[]> {
    try {
      const q = query(
        collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS),
        limit(100)
      );
      const snap = await getDocs(q);
      const sessions = snap.docs.map((d) => d.data());
      
      const programMap: Record<string, { playCount: number; listenTime: number }> = {};
      sessions.forEach((s) => {
        const progName = s.programName || "Streaming Radio";
        if (!programMap[progName]) {
          programMap[progName] = { playCount: 0, listenTime: 0 };
        }
        programMap[progName].playCount += 1;
        programMap[progName].listenTime += (s.duration || 0);
      });

      const topContentList: TopContent[] = Object.entries(programMap).map(([title, stats]) => ({
        id: title,
        title,
        type: "Radio Stream",
        playCount: stats.playCount,
        listenTime: stats.listenTime,
      }));

      return topContentList
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limitCount);
    } catch (error) {
      console.warn('[AnalyticsService] Failed to get top content:', error);
      return [];
    }
  }
  async getLocationBreakdown(timeRange: MetricsTimeRange): Promise<LocationBreakdown> {
    let startDate = new Date();
    if (timeRange === MetricsTimeRange.TODAY) {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === MetricsTimeRange.LAST_7_DAYS) {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    try {
      const q = query(
        collection(getFirebaseFirestore(), ANALYTICS_COLLECTIONS.SESSIONS),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        limit(1000)
      );
      const snap = await getDocs(q);
      const sessions = snap.docs.map((d) => d.data());

      const sessionsWithLocation = sessions.filter((s) => s.location?.city);
      const totalWithLocation = sessionsWithLocation.length;

      // Agregasi per kota
      const cityMap: Record<string, { city: string; region: string; country: string; countryCode: string; count: number }> = {};
      const regionsMap: Record<string, number> = {};
      const countriesMap: Record<string, { name: string; code: string; count: number }> = {};

      sessionsWithLocation.forEach((s) => {
        const city = s.location.city || 'Tidak Diketahui';
        const region = s.location.region || 'Tidak Diketahui';
        const country = s.location.country || 'Tidak Diketahui';
        const countryCode = s.location.countryCode || 'XX';

        // Per kota
        const cityKey = `${city}__${region}`;
        if (!cityMap[cityKey]) {
          cityMap[cityKey] = { city, region, country, countryCode, count: 0 };
        }
        cityMap[cityKey].count += 1;

        // Per provinsi
        regionsMap[region] = (regionsMap[region] || 0) + 1;

        // Per negara
        if (!countriesMap[country]) {
          countriesMap[country] = { name: country, code: countryCode, count: 0 };
        }
        countriesMap[country].count += 1;
      });

      const cities = Object.values(cityMap)
        .sort((a, b) => b.count - a.count);

      return { totalWithLocation, cities, regions: regionsMap, countries: countriesMap };
    } catch (error) {
      console.warn('[AnalyticsService] Failed to get location breakdown:', error);
      return { totalWithLocation: 0, cities: [], regions: {}, countries: {} };
    }
  }
}

export const analyticsService = new AnalyticsService();
