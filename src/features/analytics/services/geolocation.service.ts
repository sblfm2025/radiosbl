/**
 * Geolocation Service — IP-based
 * Mengambil data lokasi pendengar berdasarkan alamat IP menggunakan ipapi.co
 *
 * Keunggulan:
 * - Tidak memerlukan izin GPS dari pengguna
 * - Langsung mendapatkan nama kota, provinsi, dan negara
 * - Gratis hingga 1000 request/hari tanpa API key
 * - Fail-safe: jika gagal, sesi tetap berjalan normal
 *
 * Cache: Hasil disimpan di sessionStorage agar tidak melakukan
 * request berulang selama satu sesi browser yang sama.
 */

const CACHE_KEY = 'sbl_geo_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

export interface GeoLocation {
  /** Nama kota/kabupaten (mis: "Pinrang", "Makassar") */
  city: string;
  /** Nama provinsi (mis: "South Sulawesi") */
  region: string;
  /** Nama lengkap negara (mis: "Indonesia") */
  country: string;
  /** Kode negara ISO 2 huruf (mis: "ID") */
  countryCode: string;
  /** Latitude (dari IP geolocation, akurasi kota) */
  latitude: number;
  /** Longitude (dari IP geolocation, akurasi kota) */
  longitude: number;
  /** Nama ISP/provider internet */
  isp?: string;
  /** Timestamp pengambilan data (unix ms) */
  fetchedAt: number;
}

interface IpapiResponse {
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  org?: string;
  error?: boolean;
  reason?: string;
}

/**
 * Ambil data geolokasi berdasarkan IP publik pendengar.
 * Hasil di-cache di sessionStorage selama 30 menit.
 * Mengembalikan null jika gagal (fail-safe).
 */
export async function fetchGeoLocation(): Promise<GeoLocation | null> {
  // Cek cache terlebih dahulu
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: GeoLocation = JSON.parse(cached);
      const age = Date.now() - parsed.fetchedAt;
      if (age < CACHE_TTL_MS) {
        return parsed;
      }
    }
  } catch {
    // Cache tidak valid, lanjut fetch
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[Geo] ipapi.co responded with status:', response.status);
      return null;
    }

    const data: IpapiResponse = await response.json();

    if (data.error) {
      console.warn('[Geo] ipapi.co error:', data.reason);
      return null;
    }

    const geo: GeoLocation = {
      city: data.city || 'Tidak Diketahui',
      region: data.region || 'Tidak Diketahui',
      country: data.country_name || 'Tidak Diketahui',
      countryCode: data.country_code || 'XX',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      isp: data.org,
      fetchedAt: Date.now(),
    };

    // Simpan ke cache
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(geo));
    } catch {
      // sessionStorage penuh atau tidak tersedia, abaikan
    }

    return geo;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[Geo] Request timeout, lokasi tidak tersedia');
    } else {
      console.warn('[Geo] Gagal mengambil data geolokasi:', error);
    }
    return null;
  }
}

/**
 * Format nama lokasi menjadi string yang mudah dibaca.
 * Contoh: "Pinrang, South Sulawesi, ID"
 */
export function formatGeoLocation(geo: GeoLocation | null): string {
  if (!geo) return 'Tidak Diketahui';
  const parts = [geo.city, geo.region, geo.countryCode].filter(Boolean);
  return parts.join(', ');
}

/**
 * Dapatkan emoji bendera dari kode negara (ISO 3166-1 alpha-2).
 * Contoh: "ID" → "🇮🇩"
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌏';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
