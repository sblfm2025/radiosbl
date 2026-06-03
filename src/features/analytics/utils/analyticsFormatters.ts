/**
 * analyticsFormatters.ts
 * Kumpulan fungsi helper untuk memformat label dan durasi 
 * pada Dashboard Listener Analytics agar konsisten dan akurat.
 */

export function getIcecastStatusLabel(isOnline: boolean): string {
  return isOnline ? "Online" : "Offline";
}

export function getIcecastListenerLabel(count: number): string {
  return `${count} pendengar streaming`;
}

export function getActiveSessionLabel(count: number): string {
  return `${count} sesi aktif`;
}

export function getTrackedSessionLabel(count: number): string {
  return `${count} sesi terlacak`;
}

/**
 * Memformat durasi detik sesi secara natural untuk operator/admin
 */
export function formatSessionDuration(seconds: number): string {
  if (seconds < 10) return "Baru aktif";
  if (seconds < 60) return "< 1 menit";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}j ${remainingMinutes}m`
    : `${hours}j`;
}
