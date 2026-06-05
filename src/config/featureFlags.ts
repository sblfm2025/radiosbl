function enabledByEnv(name: string, defaultValue: boolean): boolean {
  const value = import.meta.env[name];
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

export const featureFlags = {
  listeningEnhancements: true,
  listenerEngagement: true,
  contentHub: true,
  broadcastWorkflow: true,
  listenerAnalytics: enabledByEnv("VITE_ENABLE_LISTENER_ANALYTICS", false),
  securityAuditLog: true,
};
