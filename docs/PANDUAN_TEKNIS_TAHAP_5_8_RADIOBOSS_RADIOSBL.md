# PANDUAN TEKNIS DETAIL TAHAP 5–8  
## Integrasi Studio Gateway RadioBOSS ke Aplikasi Radio SBL

**Project:** Radio SBL App + Studio Gateway  
**Fokus:** Tahap 5–8 setelah `studio-gateway` dinilai layak uji terbatas  
**Prinsip utama:** Integrasi harus non-invasif, fail-safe, tidak mengganggu streaming, mini player, jadwal siaran, absensi, request lagu, AI naskah, dan UI premium yang sudah stabil.

---

# 0. KONTEKS ARSITEKTUR

Arsitektur yang digunakan:

```txt
RadioBOSS Studio PC
  ↓ localhost API
Studio Gateway Agent
  ↓ Firebase Admin SDK
Firestore
  ↓ Realtime listener
Aplikasi Radio SBL
```

Aplikasi Radio SBL **tidak boleh langsung memanggil RadioBOSS API**.

Yang boleh dilakukan aplikasi Radio SBL:

```txt
- membaca radiobossStatus/current
- membaca radiobossNowPlaying/current
- membaca radiobossGatewayHeartbeat/studio-main
- membaca radiobossTrackHistory terbaru
```

Yang tidak boleh dilakukan pada tahap 5–8:

```txt
- remote stop
- remote pause
- remote play
- remote next
- remote set volume
- scheduler on/off
- clear playlist
- command queue write-control
```

---

# 1. PRASYARAT SEBELUM TAHAP 5

Sebelum masuk integrasi aplikasi Radio SBL, pastikan `studio-gateway` sudah lulus uji berikut di komputer studio atau PC uji:

```cmd
npm install
npm run format:check
npm run build
npm run test-parser
npm run mock-api
```

Lalu uji endpoint mock:

```cmd
curl "http://127.0.0.1:9100/?pass=test&action=playbackinfo"
```

Pastikan output XML tidak kosong dan memuat:

```xml
<Info>
  <CurrentTrack>
  <Playback ... />
  <NextTrack>
</Info>
```

Firestore minimal harus sudah memiliki dokumen:

```txt
radiobossStatus/current
radiobossNowPlaying/current
radiobossGatewayHeartbeat/studio-main
radiobossTrackHistory/{trackId}
```

---

# 2. TAHAP 5 — INTEGRASI AWAL KE APLIKASI RADIO SBL: STUDIO MONITOR ADMIN

## 2.1 Tujuan

Membuat halaman **Studio Monitor** khusus admin/studio admin untuk melihat status RadioBOSS dan metadata lagu dari Firestore.

Tahap ini **belum menampilkan Now Playing ke publik**.

Tujuan teknis:

```txt
- Admin bisa melihat gateway online/offline.
- Admin bisa melihat RadioBOSS online/offline.
- Admin bisa melihat lagu sedang diputar.
- Admin bisa melihat lagu berikutnya.
- Admin bisa melihat riwayat lagu terakhir.
- Tidak ada tombol kontrol RadioBOSS.
```

---

## 2.2 Struktur file yang disarankan

Tambahkan file baru di aplikasi Radio SBL:

```txt
src/services/radiobossNowPlaying.service.ts
src/hooks/useRadioBossNowPlaying.ts
src/hooks/useRadioBossStatus.ts
src/hooks/useRadioBossTrackHistory.ts

src/pages/admin/StudioMonitorPage.tsx

src/features/studio-monitor/components/StudioGatewayCard.tsx
src/features/studio-monitor/components/RadioBossStatusCard.tsx
src/features/studio-monitor/components/NowPlayingCard.tsx
src/features/studio-monitor/components/NextTrackCard.tsx
src/features/studio-monitor/components/TrackHistoryList.tsx
src/features/studio-monitor/components/StudioMonitorSkeleton.tsx
src/features/studio-monitor/components/StudioMonitorEmptyState.tsx
```

Jika struktur aplikasi Radio SBL berbeda, sesuaikan dengan pola yang sudah dipakai, tetapi **jangan menyisipkan semua logic ke komponen lama**.

---

## 2.3 Firestore paths yang dibaca

```txt
radiobossStatus/current
radiobossNowPlaying/current
radiobossGatewayHeartbeat/studio-main
radiobossTrackHistory
```

Query riwayat lagu:

```txt
radiobossTrackHistory
  orderBy startedAt desc
  limit 10
```

Jika index Firestore diperlukan, tambahkan ke `firestore.indexes.json`.

---

## 2.4 Tipe data TypeScript

Buat tipe data, misalnya:

```ts
export type RadioBossPlayerState =
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'unknown';

export type RadioBossStatus = {
  online: boolean;
  gatewayOnline: boolean;
  playerState: RadioBossPlayerState;
  lastSyncAt?: unknown;
  latencyMs?: number;
  errorCode?: string | null;
  errorMessageSafe?: string | null;
  source?: string;
  gatewayId?: string;
};

export type RadioBossNowPlaying = {
  artist?: string;
  title?: string;
  album?: string;
  castTitle?: string;
  durationSeconds?: number;
  positionSeconds?: number;
  progressPercent?: number;
  nextArtist?: string;
  nextTitle?: string;
  nextCastTitle?: string;
  updatedAt?: unknown;
  source?: string;
  gatewayId?: string;
};

export type RadioBossTrackHistory = {
  id: string;
  artist?: string;
  title?: string;
  castTitle?: string;
  startedAt?: unknown;
  endedAt?: unknown;
  programId?: string | null;
  programTitle?: string;
  source?: string;
  gatewayId?: string;
};
```

---

## 2.5 Service Firestore

Contoh konsep `radiobossNowPlaying.service.ts`:

```ts
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function subscribeRadioBossStatus(callback, onError) {
  return onSnapshot(
    doc(db, 'radiobossStatus', 'current'),
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    },
    onError
  );
}

export function subscribeRadioBossNowPlaying(callback, onError) {
  return onSnapshot(
    doc(db, 'radiobossNowPlaying', 'current'),
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    },
    onError
  );
}

export function subscribeRadioBossGatewayHeartbeat(callback, onError) {
  return onSnapshot(
    doc(db, 'radiobossGatewayHeartbeat', 'studio-main'),
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    },
    onError
  );
}

export function subscribeRadioBossTrackHistory(callback, onError) {
  const q = query(
    collection(db, 'radiobossTrackHistory'),
    orderBy('startedAt', 'desc'),
    limit(10)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    },
    onError
  );
}
```

Catatan:

```txt
- Sesuaikan import db dengan struktur Firebase di Radio SBL.
- Jangan gunakan service account di frontend.
- Frontend hanya membaca data.
```

---

## 2.6 Hook React

Contoh konsep hook:

```ts
import { useEffect, useState } from 'react';
import {
  subscribeRadioBossNowPlaying,
  subscribeRadioBossStatus,
  subscribeRadioBossTrackHistory,
} from '@/services/radiobossNowPlaying.service';

export function useRadioBossStudioMonitor() {
  const [status, setStatus] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSafe, setErrorSafe] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribers = [];

    unsubscribers.push(
      subscribeRadioBossStatus(
        (data) => {
          setStatus(data);
          setLoading(false);
        },
        () => {
          setErrorSafe('Status studio belum bisa dimuat.');
          setLoading(false);
        }
      )
    );

    unsubscribers.push(
      subscribeRadioBossNowPlaying(
        (data) => setNowPlaying(data),
        () => setErrorSafe('Now Playing belum bisa dimuat.')
      )
    );

    unsubscribers.push(
      subscribeRadioBossTrackHistory(
        (items) => setHistory(items),
        () => setErrorSafe('Riwayat lagu belum bisa dimuat.')
      )
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, []);

  return {
    status,
    nowPlaying,
    history,
    loading,
    errorSafe,
  };
}
```

---

## 2.7 Role dan akses menu

Menu `Admin → Studio Monitor` hanya boleh terlihat untuk role:

```txt
super_admin
admin
studio_admin
operator
```

Jika aplikasi Radio SBL sudah punya sistem role, ikuti pola lama.

Jangan membuat role logic baru yang bertabrakan dengan sistem lama.

Aturan akses:

```txt
- Super admin: boleh melihat semua.
- Admin/studio_admin: boleh melihat monitor.
- Operator: boleh melihat monitor jika memang diizinkan.
- Penyiar: opsional, read-only.
- User biasa: tidak boleh melihat menu dan tidak boleh akses route.
```

Jika user tidak berhak:

```txt
Tampilkan halaman 403 / akses ditolak yang konsisten dengan UI aplikasi.
```

---

## 2.8 UI Studio Monitor

Tampilan harus mengikuti gaya premium Radio SBL:

```txt
- rounded card
- soft shadow
- spacing lega
- font konsisten
- warna sesuai tema aplikasi
- icon lucide-react
- mobile responsive
- tidak memakai tampilan admin kasar/default
```

Layout desktop:

```txt
Header:
  Studio Monitor
  Status ringkas: Gateway Online / Offline

Grid:
  Card Gateway
  Card RadioBOSS
  Card Now Playing
  Card Next Track

Below:
  Track History List
```

Layout mobile:

```txt
Stack vertikal:
  Gateway status
  RadioBOSS status
  Now Playing
  Next Track
  History
```

---

## 2.9 Komponen yang wajib ada

### A. `StudioGatewayCard`

Menampilkan:

```txt
- Gateway online/offline
- Gateway ID
- PC name jika tersedia
- Last seen
- Mode: read_only
```

Status warna:

```txt
Online: hijau lembut
Offline: merah lembut
Unknown: abu-abu
```

### B. `RadioBossStatusCard`

Menampilkan:

```txt
- RadioBOSS online/offline
- Player state: playing / paused / stopped / unknown
- Last sync
- Latency ms
- Error safe jika ada
```

Jangan tampilkan error teknis mentah ke user.

### C. `NowPlayingCard`

Menampilkan:

```txt
- Artist
- Title
- Cast title
- Album jika ada
- Progress bar
- Duration
```

Fallback:

```txt
Radio SBL Live
Sedang mengudara
```

### D. `NextTrackCard`

Menampilkan:

```txt
- Next artist
- Next title
- Next cast title
```

Fallback:

```txt
Belum ada data lagu berikutnya
```

### E. `TrackHistoryList`

Menampilkan 10 lagu terakhir:

```txt
Jam mulai
Artist - Title
Program aktif jika tersedia
```

Jika kosong:

```txt
Riwayat lagu belum tersedia.
```

---

## 2.10 Checklist Tahap 5

```txt
[ ] Halaman Admin → Studio Monitor dibuat.
[ ] Route hanya bisa diakses role berwenang.
[ ] User biasa tidak melihat menu.
[ ] Data radiobossStatus/current terbaca.
[ ] Data radiobossNowPlaying/current terbaca.
[ ] Heartbeat terbaca.
[ ] Riwayat lagu 10 terakhir tampil.
[ ] Tidak ada tombol kontrol RadioBOSS.
[ ] Jika Firestore kosong, UI tetap rapi.
[ ] Jika gateway offline, UI tidak rusak.
[ ] Mobile responsive.
[ ] Dashboard utama tidak berubah.
[ ] Streaming tidak terganggu.
```

---

# 3. TAHAP 6 — TAMPILKAN NOW PLAYING KE STREAMING PAGE DAN MINI PLAYER

## 3.1 Tujuan

Menampilkan data lagu dari RadioBOSS ke area pendengar:

```txt
- Streaming Page
- Mini Player
```

Tetapi tetap fail-safe. Jika data gateway kosong/offline, player tetap berjalan dengan tampilan lama.

---

## 3.2 Prinsip integrasi

```txt
- Jangan ubah logic audio player.
- Jangan ubah cara streaming berjalan.
- Jangan ubah state utama audio.
- Jangan membuat player bergantung pada Firestore RadioBOSS.
- Now Playing hanya layer tampilan tambahan.
```

Salah:

```txt
Audio player tidak bisa play jika radiobossNowPlaying gagal dimuat.
```

Benar:

```txt
Audio player tetap play.
Now Playing fallback ke “Radio SBL Live”.
```

---

## 3.3 Data yang ditampilkan

Di Mini Player:

```txt
LIVE Radio SBL
Artist - Title
```

Jika metadata kosong:

```txt
LIVE Radio SBL
Sedang mengudara
```

Di Streaming Page:

```txt
Sedang Diputar:
Artist - Title

Berikutnya:
Next Artist - Next Title

Riwayat Lagu:
10 lagu terakhir
```

---

## 3.4 Hook publik yang lebih ringan

Buat hook khusus untuk public Now Playing:

```txt
src/hooks/usePublicNowPlaying.ts
```

Isi data minimal:

```ts
type PublicNowPlaying = {
  title: string;
  artist: string;
  displayTitle: string;
  isLive: boolean;
  isFromRadioBoss: boolean;
  updatedAt?: unknown;
};
```

Fallback:

```ts
const FALLBACK_NOW_PLAYING = {
  title: 'Sedang mengudara',
  artist: 'Radio SBL Live',
  displayTitle: 'Radio SBL Live — Sedang mengudara',
  isLive: true,
  isFromRadioBoss: false,
};
```

---

## 3.5 Integrasi Mini Player

Cari komponen Mini Player yang sudah ada. Jangan bongkar struktur besar.

Tambahkan hanya area metadata:

```tsx
<div className="min-w-0">
  <p className="text-xs font-semibold">LIVE Radio SBL</p>
  <p className="truncate text-sm">
    {nowPlaying.displayTitle}
  </p>
</div>
```

Aturan:

```txt
- Gunakan truncate agar teks panjang tidak merusak layout.
- Jangan membuat tinggi mini player berubah drastis.
- Jangan mengubah tombol play/pause.
- Jangan mengubah behavior floating/sticky.
```

---

## 3.6 Integrasi Streaming Page

Tambahkan section kecil di bawah/sekitar player utama:

```txt
Card: Sedang Diputar
- Artist - Title
- Progress jika tersedia

Card: Berikutnya
- Next Artist - Next Title

Section: Riwayat Lagu
- 10 lagu terakhir
```

Jangan sampai halaman streaming menjadi berat. Riwayat lagu bisa dibuat collapse/accordion di mobile.

---

## 3.7 Handling offline

Jika `radiobossStatus/current.online === false` atau `updatedAt` terlalu lama:

```txt
Tampilkan:
Radio SBL Live
Sedang mengudara

Tambahkan badge kecil:
Metadata studio belum tersinkron
```

Jangan tampilkan:

```txt
Error: ECONNREFUSED 127.0.0.1:9001
```

---

## 3.8 Batas stale data

Buat helper:

```ts
function isNowPlayingStale(updatedAt: Date | null): boolean {
  if (!updatedAt) return true;
  const diffMs = Date.now() - updatedAt.getTime();
  return diffMs > 120_000;
}
```

Jika data lebih lama dari 2 menit, anggap stale.

Fallback:

```txt
Radio SBL Live — Sedang mengudara
```

---

## 3.9 Checklist Tahap 6

```txt
[ ] Mini Player menampilkan Now Playing.
[ ] Streaming Page menampilkan Now Playing.
[ ] Streaming Page menampilkan Next Track jika ada.
[ ] Riwayat lagu tampil maksimal 10 item.
[ ] Data stale >2 menit tidak ditampilkan sebagai lagu aktif.
[ ] Jika gateway offline, audio player tetap jalan.
[ ] Tidak ada perubahan logic play/pause.
[ ] Tidak ada perubahan besar pada UI premium.
[ ] Mobile tidak horizontal scroll.
[ ] Teks panjang terpotong rapi.
```

---

# 4. TAHAP 7 — HUBUNGKAN TRACK HISTORY KE AI NASKAH SEBAGAI REFERENSI LAGU VALID

## 4.1 Tujuan

Mencegah AI mengarang judul lagu dan penyanyi.

AI boleh menyebut judul lagu/penyanyi hanya jika berasal dari sumber valid:

```txt
- radiobossTrackHistory
- radiobossNowPlaying/current
- katalog musik resmi jika nanti tersedia
```

---

## 4.2 Prinsip penting

```txt
AI tidak boleh membuat judul lagu sendiri.
AI tidak boleh membuat nama penyanyi sendiri.
AI boleh memberi rekomendasi suasana lagu jika data valid tidak tersedia.
AI boleh menyebut lagu hanya dari daftar referensi valid.
```

---

## 4.3 Service referensi lagu

Buat service:

```txt
src/services/musicReference.service.ts
```

Fungsi:

```ts
export async function getRecentValidTracks(limitCount = 20) {
  // query radiobossTrackHistory
  // orderBy startedAt desc
  // limit limitCount
  // normalize artist/title
  // remove duplicate
  // return array
}
```

Output:

```ts
type ValidTrackReference = {
  artist: string;
  title: string;
  castTitle?: string;
  playedAt?: Date;
  source: 'radiobossTrackHistory';
};
```

---

## 4.4 Deduplicate lagu

Gunakan key:

```ts
const key = `${artist.toLowerCase()}|${title.toLowerCase()}`;
```

Jangan kirim daftar duplikat ke prompt AI.

---

## 4.5 Format konteks untuk prompt AI

Tambahkan blok konteks ke prompt generator naskah:

```txt
REFERENSI LAGU VALID DARI RADIOBOSS:
1. Tulus - Hati-Hati di Jalan
2. Sheila on 7 - Dan
3. Mahalini - Sisa Rasa

ATURAN:
- Jika ingin menyebut judul lagu dan penyanyi, gunakan hanya daftar di atas.
- Jangan membuat judul lagu baru.
- Jangan membuat nama penyanyi baru.
- Jika daftar lagu tidak relevan, cukup beri arahan mood/tema lagu tanpa menyebut judul.
```

---

## 4.6 Integrasi ke `aiScript.service.ts`

Cari bagian yang menyusun prompt AI.

Tambahkan optional context:

```ts
const recentTracks = await getRecentValidTracks(20);

const musicReferenceBlock = buildMusicReferenceBlock(recentTracks);

const finalPrompt = `
${basePrompt}

${musicReferenceBlock}

${userInstruction}
`;
```

Pastikan jika Firestore gagal:

```ts
try {
  const recentTracks = await getRecentValidTracks(20);
} catch {
  // lanjutkan generate naskah tanpa referensi lagu
}
```

AI naskah tidak boleh gagal hanya karena track history tidak bisa dimuat.

---

## 4.7 UI opsional di halaman AI Naskah

Tambahkan info kecil:

```txt
Referensi lagu RadioBOSS tersedia: 20 lagu terakhir
```

Jika tidak tersedia:

```txt
Referensi lagu RadioBOSS belum tersedia. AI tidak akan menyebut judul lagu spesifik.
```

Jangan menambah form rumit.

---

## 4.8 Checklist Tahap 7

```txt
[ ] Service getRecentValidTracks dibuat.
[ ] Data diambil dari radiobossTrackHistory.
[ ] Duplikasi dihapus.
[ ] Prompt AI diberi blok referensi lagu valid.
[ ] AI dilarang mengarang judul/penyanyi.
[ ] Jika track history kosong, AI tetap generate naskah.
[ ] Jika Firestore error, AI tetap generate naskah.
[ ] Tidak mengubah kualitas fitur AI lama.
[ ] Tidak memaksa AI selalu menyebut lagu.
```

---

# 5. TAHAP 8 — CHECKLIST RILIS TERBATAS DAN VALIDASI STABILITAS

## 5.1 Tujuan

Memastikan integrasi RadioBOSS tidak merusak aplikasi Radio SBL dan aman digunakan dalam operasional terbatas.

---

## 5.2 Durasi uji minimal

Sebelum rilis ke semua user:

```txt
Minimal 1 hari siaran aktif.
Ideal 2–3 hari siaran aktif.
```

Uji harus mencakup:

```txt
- saat RadioBOSS aktif
- saat RadioBOSS mati
- saat gateway mati
- saat koneksi internet putus
- saat Firestore lambat
- saat metadata lagu kosong
- saat judul lagu sangat panjang
```

---

## 5.3 Checklist gateway

```txt
[ ] Gateway berjalan minimal 1 hari tanpa crash.
[ ] Heartbeat update normal.
[ ] RadioBOSS status online/offline akurat.
[ ] Jika RadioBOSS mati, status berubah offline.
[ ] Jika RadioBOSS hidup kembali, status kembali online.
[ ] Track history tidak duplikat berlebihan.
[ ] gateway.log tidak membesar tak terkendali.
[ ] Log rotation berjalan.
[ ] Graceful shutdown mencatat agent_stop.
[ ] service autostart aktif setelah PC restart.
```

---

## 5.4 Checklist Firestore

```txt
[ ] radiobossStatus/current update stabil.
[ ] radiobossNowPlaying/current update stabil.
[ ] radiobossGatewayHeartbeat/studio-main update stabil.
[ ] radiobossTrackHistory bertambah hanya saat track berubah.
[ ] Tidak terjadi write berlebihan.
[ ] Tidak ada data sensitif seperti password RadioBOSS.
[ ] Tidak ada IP lokal/password di dokumen publik.
```

---

## 5.5 Checklist Studio Monitor

```txt
[ ] Menu hanya tampil untuk role berwenang.
[ ] User biasa tidak bisa akses route.
[ ] Gateway status tampil benar.
[ ] RadioBOSS status tampil benar.
[ ] Now Playing tampil benar.
[ ] Next Track tampil jika tersedia.
[ ] History tampil 10 lagu terakhir.
[ ] Error aman, bukan error teknis mentah.
[ ] Tampilan mobile rapi.
[ ] Tampilan desktop rapi.
```

---

## 5.6 Checklist Mini Player dan Streaming Page

```txt
[ ] Audio tetap bisa play.
[ ] Tombol play/pause tidak berubah behavior.
[ ] Mini Player tetap floating/sticky sesuai aturan lama.
[ ] Mini Player tidak melebar karena judul panjang.
[ ] Streaming Page tidak blank jika Firestore error.
[ ] Now Playing fallback saat data stale/offline.
[ ] Riwayat lagu tidak membuat halaman berat.
[ ] Tidak ada horizontal scroll di mobile.
```

---

## 5.7 Checklist AI Naskah

```txt
[ ] Generate naskah tetap berjalan.
[ ] Jika referensi lagu tersedia, AI hanya menyebut dari daftar.
[ ] Jika referensi lagu kosong, AI tidak mengarang judul/penyanyi.
[ ] Jika Firestore gagal, generate tetap berhasil.
[ ] Prompt tidak terlalu panjang.
[ ] Hasil naskah tetap natural.
```

---

## 5.8 Checklist regresi aplikasi utama

Jalankan di repo Radio SBL:

```cmd
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Manual test:

```txt
[ ] Login normal.
[ ] Dashboard utama normal.
[ ] Streaming normal.
[ ] Mini Player normal.
[ ] Jadwal siaran normal.
[ ] Absensi normal.
[ ] Request lagu normal.
[ ] AI naskah normal.
[ ] Manajemen user normal.
[ ] Mobile normal.
[ ] Desktop normal.
```

---

## 5.9 Kriteria lolos rilis terbatas

Integrasi boleh dirilis terbatas jika:

```txt
[ ] Gateway stabil minimal 1 hari.
[ ] Firestore update stabil.
[ ] Studio Monitor admin berjalan.
[ ] Streaming dan Mini Player tidak terganggu.
[ ] Tidak ada error console fatal.
[ ] Build production sukses.
[ ] User biasa tidak mendapat akses admin.
[ ] Tidak ada credential bocor.
```

---

## 5.10 Rollback plan

Jika ada masalah setelah rilis:

### Rollback aplikasi Radio SBL

```cmd
git checkout main
git revert <commit-integrasi-radioboss>
npm run build
firebase deploy
```

Atau jika memakai feature flag:

```txt
Matikan feature flag:
VITE_ENABLE_RADIOBOSS_NOW_PLAYING=false
```

### Rollback gateway

```cmd
pm2 stop radiosbl-studio-gateway
```

Atau jika berjalan manual:

```cmd
Ctrl + C
```

Fallback aplikasi harus otomatis kembali ke:

```txt
Radio SBL Live
Sedang mengudara
```

---

# 6. FEATURE FLAG YANG DISARANKAN

Tambahkan env di aplikasi Radio SBL:

```env
VITE_ENABLE_STUDIO_MONITOR=true
VITE_ENABLE_RADIOBOSS_NOW_PLAYING=false
VITE_ENABLE_RADIOBOSS_TRACK_HISTORY=false
VITE_ENABLE_AI_MUSIC_REFERENCE=false
```

Aktifkan bertahap:

```txt
Hari 1:
VITE_ENABLE_STUDIO_MONITOR=true
VITE_ENABLE_RADIOBOSS_NOW_PLAYING=false

Setelah stabil:
VITE_ENABLE_RADIOBOSS_NOW_PLAYING=true

Setelah track history stabil:
VITE_ENABLE_RADIOBOSS_TRACK_HISTORY=true

Setelah AI diuji:
VITE_ENABLE_AI_MUSIC_REFERENCE=true
```

---

# 7. URUTAN EKSEKUSI FINAL

```txt
1. Pastikan gateway stabil di PC studio.
2. Tambahkan Firestore read services di Radio SBL.
3. Tambahkan hook Studio Monitor.
4. Tambahkan halaman Admin → Studio Monitor.
5. Uji role akses.
6. Uji mobile dan desktop.
7. Aktifkan Now Playing di Mini Player dengan feature flag.
8. Aktifkan Now Playing di Streaming Page.
9. Tambahkan Track History.
10. Integrasikan Track History ke AI naskah.
11. Jalankan regresi penuh.
12. Rilis terbatas.
13. Pantau 1–3 hari.
14. Baru rilis penuh.
```

---

# 8. LARANGAN PENTING

```txt
[ ] Jangan membuka RadioBOSS API ke internet.
[ ] Jangan menaruh password RadioBOSS di frontend.
[ ] Jangan memasukkan service-account.json ke repo Radio SBL.
[ ] Jangan membuat player bergantung pada Firestore RadioBOSS.
[ ] Jangan menambahkan remote command dulu.
[ ] Jangan mengubah schema lama aplikasi Radio SBL.
[ ] Jangan mengubah UI premium besar-besaran.
[ ] Jangan menghapus fallback lama streaming.
[ ] Jangan menampilkan error teknis mentah ke publik.
```

---

# 9. OUTPUT YANG DIHARAPKAN

Setelah Tahap 5–8 selesai:

```txt
- Admin punya halaman Studio Monitor.
- Radio SBL bisa menampilkan lagu sedang diputar dari RadioBOSS.
- Mini Player lebih hidup dengan metadata valid.
- Streaming Page punya Now Playing, Next Track, dan History.
- AI naskah punya referensi lagu valid sehingga tidak mengarang judul/penyanyi.
- Integrasi tetap fail-safe.
- Jika gateway/RadioBOSS/Firebase bermasalah, aplikasi tetap berjalan normal.
```

---

# 10. CATATAN FINAL

Integrasi RadioBOSS ini harus diperlakukan sebagai **lapisan metadata**, bukan pengganti sistem streaming utama.

Prioritasnya:

```txt
1. Aman
2. Stabil
3. Tidak mengganggu siaran
4. Tidak mengubah alur lama
5. Menambah nilai profesional secara bertahap
```

Jika semua checklist di atas terpenuhi, Radio SBL akan memiliki fondasi integrasi studio yang jauh lebih profesional tanpa mengorbankan stabilitas aplikasi yang sudah berjalan.
