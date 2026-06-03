import { MapPin } from "lucide-react";
import type { LocationConsentStatus } from "../hooks/usePreciseLocationConsent";

type LocationPermissionPromptProps = {
  consentStatus: LocationConsentStatus;
  onAccept: () => void;
  onSkip: () => void;
};

export function LocationPermissionPrompt({
  consentStatus,
  onAccept,
  onSkip
}: LocationPermissionPromptProps) {
  if (consentStatus !== "undecided") {
    return null;
  }

  return (
    <div className="location-prompt-overlay" role="dialog" aria-labelledby="location-prompt-title">
      <div className="location-prompt-content">
        <h3 id="location-prompt-title">
          <MapPin size={18} />
          Izinkan Akses Lokasi?
        </h3>
        <p>
          Radio SBL dapat menggunakan lokasi perangkat Anda untuk membantu membaca jangkauan pendengar secara lebih akurat. Izin lokasi tidak wajib. Jika ditolak, radio tetap dapat didengarkan seperti biasa.
        </p>
        <div className="location-prompt-actions">
          <button type="button" onClick={onSkip} className="location-btn secondary">
            Lewati
          </button>
          <button type="button" onClick={onAccept} className="location-btn primary">
            Izinkan Lokasi
          </button>
        </div>
      </div>
    </div>
  );
}
