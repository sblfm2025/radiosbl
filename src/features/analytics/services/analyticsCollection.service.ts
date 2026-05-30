/**
 * Firebase Collection Constants for Listener Analytics
 * Following LISTENER_ANALYTICS_MVP_RADIO_SBL.md specification
 */

/**
 * Collection names
 */
export const ANALYTICS_COLLECTIONS = {
  EVENTS: 'listener_analytics_events',
  SESSIONS: 'listener_analytics_sessions',
  DAILY_SUMMARIES: 'listener_analytics_daily',
} as const;

/**
 * Subcollection names (if needed in the future)
 */
export const ANALYTICS_SUBCOLLECTIONS = {
  SESSION_EVENTS: 'events',
} as const;