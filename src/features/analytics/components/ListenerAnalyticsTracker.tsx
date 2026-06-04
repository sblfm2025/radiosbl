import { useGlobalAudio } from "../../../contexts/useGlobalAudio";
import { useListenerAnalytics } from "../hooks/useListenerAnalytics";
import { LocationPermissionPrompt } from "./LocationPermissionPrompt";
import type { AuthSession } from "../../../services/auth.service";
import "../styles/listenerAnalytics.css";

type ListenerAnalyticsTrackerProps = {
  session: AuthSession | null;
  programId?: string;
  programTitle?: string;
};

export function ListenerAnalyticsTracker({
  session,
  programId,
  programTitle
}: ListenerAnalyticsTrackerProps) {
  const { playing, programTitle: contextProgramTitle } = useGlobalAudio();

  const activeProgramTitle = programTitle || contextProgramTitle || "Siaran Live";

  const {
    consentStatus,
    captureLocationConsent,
    skipLocationConsent
  } = useListenerAnalytics({
    isPlaying: playing,
    programId: programId,
    programTitle: activeProgramTitle,
    userId: session?.user?.id
  });

  // Render prompt izin lokasi secara ramah ketika status bermain aktif
  return (
    <LocationPermissionPrompt
      consentStatus={playing ? consentStatus : "granted"} // Hanya tampilkan jika sedang memutar
      onAccept={captureLocationConsent}
      onSkip={skipLocationConsent}
    />
  );
}
