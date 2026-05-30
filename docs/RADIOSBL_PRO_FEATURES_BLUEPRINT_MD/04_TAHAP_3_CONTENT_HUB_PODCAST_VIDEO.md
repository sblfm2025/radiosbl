# Tahap 3 - Podcast, Arsip Audio, dan Video Hub/SBL TV

## Tujuan
Mengubah konten Radio SBL agar tidak hilang setelah live: siaran dapat diarsipkan sebagai audio, podcast, atau video.

## Fitur Tahap Ini

1. Arsip program audio.
2. Halaman Podcast SBL.
3. Resume playback episode.
4. Video Hub / SBL TV.
5. Pinrang Berkabar video feed.

## Prinsip Implementasi

- Jangan membuat sistem video berat sendiri.
- Untuk tahap awal gunakan embed YouTube/Facebook/video external yang aman.
- Jangan upload video besar ke Firebase Storage tanpa perhitungan biaya.
- Audio arsip boleh menggunakan link storage atau link eksternal.
- Jangan mengganggu streaming live.

## Struktur File

```txt
src/features/contentHub/pages/PodcastPage.tsx
src/features/contentHub/pages/EpisodeDetailPage.tsx
src/features/contentHub/pages/VideoHubPage.tsx
src/features/contentHub/components/EpisodeCard.tsx
src/features/contentHub/components/EpisodePlayer.tsx
src/features/contentHub/components/VideoCard.tsx
src/features/contentHub/components/ResumePlaybackBadge.tsx
src/features/contentHub/services/episode.service.ts
src/features/contentHub/services/videoHub.service.ts
src/features/contentHub/hooks/useEpisodeProgress.ts
```

## 1. Arsip Program Audio

### Collection

```txt
programEpisodes/{episodeId}
```

Field:

```ts
{
  episodeId: string;
  title: string;
  slug: string;
  programId: string;
  programTitle: string;
  description?: string;
  hosts?: string[];
  operator?: string;
  tags: string[];
  audioUrl: string;
  audioStoragePath?: string;
  coverImageUrl?: string;
  durationSeconds?: number;
  publishedAt: Timestamp;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Admin Form

Admin dapat:

- Tambah episode.
- Edit episode.
- Publish/unpublish.
- Arsipkan.
- Upload cover.
- Isi tag.
- Pilih program.

### UI Publik

Halaman Podcast:

- Episode terbaru.
- Filter program.
- Filter tag.
- Search judul.
- Card episode.
- Detail episode.
- Share link.

## 2. Resume Playback

### Local Storage Key

```txt
radiosbl_episode_progress_{episodeId}
```

Value:

```ts
{
  episodeId: string;
  currentTime: number;
  duration: number;
  updatedAt: string;
}
```

### Aturan

- Simpan progress setiap 15 detik.
- Jangan simpan ke Firestore dulu.
- Jika progress > 95%, anggap selesai.
- Tampilkan tombol “Lanjutkan dari menit ...”.

## 3. Video Hub / SBL TV

### Collection

```txt
videoItems/{videoId}
```

Field:

```ts
{
  videoId: string;
  title: string;
  description?: string;
  source: 'youtube' | 'facebook' | 'external';
  embedUrl: string;
  thumbnailUrl?: string;
  programId?: string;
  programTitle?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### UI

Halaman:

```txt
/video
```

Section:

- Video terbaru.
- Pinrang Berkabar.
- Podcast video.
- Liputan OB.
- Event live.

## 4. Pinrang Berkabar Feed

Jika data masih manual:

- Admin input link video.
- Admin input judul.
- Admin pilih kategori Pinrang Berkabar.

Jika nanti otomatis:

- Integrasi YouTube API dilakukan tahap lanjutan.
- Jangan langsung ambil otomatis tanpa API key dan caching.

## 5. Storage dan Biaya

Hindari upload video besar ke Firebase Storage pada tahap awal.

Rekomendasi:

- Audio pendek/arsip penting: Firebase Storage boleh, cek ukuran.
- Video: embed YouTube/Facebook lebih aman.
- Cover image: Firebase Storage boleh.

## Testing Tahap 3

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Manual:

- [ ] Streaming live tetap normal.
- [ ] Halaman podcast tidak merusak player live.
- [ ] Episode bisa dibuka.
- [ ] Progress episode tersimpan.
- [ ] Tombol lanjutkan tampil.
- [ ] Video embed tampil.
- [ ] Video tidak autoplay mengganggu audio live.
- [ ] Admin bisa tambah episode draft.
- [ ] User biasa hanya melihat episode published.
- [ ] Mobile rapi.

## Rollback

Matikan flag:

```ts
contentHub: false
```

Data `programEpisodes` dan `videoItems` jangan dihapus saat rollback UI.
