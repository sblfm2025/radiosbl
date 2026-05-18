type EnvKey =
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_STORAGE_BUCKET"
  | "VITE_FIREBASE_APP_ID"
  | "VITE_FIREBASE_MESSAGING_SENDER_ID"
  | "VITE_FIREBASE_MEASUREMENT_ID"
  | "VITE_GEMINI_PROXY_ENDPOINT"
  | "VITE_WHATSAPP_PROXY_ENDPOINT"
  | "VITE_PINRANG_BERKABAR_FEED_URL"
  | "VITE_YOUTUBE_API_KEY";

export function getEnv(key: EnvKey): string {
  return import.meta.env[key] ?? "";
}

export function hasFirebaseConfig(): boolean {
  if (import.meta.env.MODE === "test") {
    return false;
  }

  return Boolean(
    getEnv("VITE_FIREBASE_API_KEY") &&
      getEnv("VITE_FIREBASE_AUTH_DOMAIN") &&
      getEnv("VITE_FIREBASE_PROJECT_ID") &&
      getEnv("VITE_FIREBASE_APP_ID")
  );
}

export function shouldUseLocalFallback(): boolean {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
}

export const featureFlags = {
  enableNewDashboard: import.meta.env.VITE_ENABLE_NEW_DASHBOARD !== "false",
  enablePinrangBerkabar: import.meta.env.VITE_ENABLE_PINRANG_BERKABAR !== "false",
  enableTutorialSystem: import.meta.env.VITE_ENABLE_TUTORIAL_SYSTEM !== "false",
  enableNewHelpCenter: import.meta.env.VITE_ENABLE_NEW_HELP_CENTER !== "false"
};
