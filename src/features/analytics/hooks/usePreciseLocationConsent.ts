import { useState, useCallback, useEffect } from "react";

const CONSENT_LOCAL_KEY = "radiosbl_location_consent_status";

export type LocationConsentStatus = "undecided" | "granted" | "denied" | "unavailable";

export function usePreciseLocationConsent() {
  const [consentStatus, setConsentStatus] = useState<LocationConsentStatus>("undecided");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(CONSENT_LOCAL_KEY) as LocationConsentStatus;
      if (stored === "granted" || stored === "denied") {
        setConsentStatus(stored);
      } else if (!navigator.geolocation) {
        setConsentStatus("unavailable");
      }
    } catch {
      setConsentStatus("undecided");
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<{
    permission: "granted" | "denied" | "unavailable" | "failed";
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    error?: string;
  }> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return { permission: "unavailable", error: "Geolocation API tidak didukung browser ini." };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            localStorage.setItem(CONSENT_LOCAL_KEY, "granted");
          } catch {
            // Persetujuan tetap berlaku untuk sesi ini meski storage tidak tersedia.
          }
          setConsentStatus("granted");
          resolve({
            permission: "granted",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (err) => {
          const isDenied = err.code === err.PERMISSION_DENIED;
          const statusResult = isDenied ? "denied" : "failed";
          
          if (isDenied) {
            try {
              localStorage.setItem(CONSENT_LOCAL_KEY, "denied");
            } catch {
              // Penolakan tetap dicatat di state meski storage tidak tersedia.
            }
            setConsentStatus("denied");
          }
          
          resolve({
            permission: statusResult,
            error: err.message
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000 // Cache 5 menit
        }
      );
    });
  }, []);

  const denyLocation = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_LOCAL_KEY, "denied");
    } catch {
      // Storage opsional; state tetap diperbarui.
    }
    setConsentStatus("denied");
  }, []);

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_LOCAL_KEY);
    } catch {
      // Storage opsional; state tetap direset.
    }
    setConsentStatus("undecided");
  }, []);

  return {
    consentStatus,
    requestLocation,
    denyLocation,
    resetConsent
  };
}
