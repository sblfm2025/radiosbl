# Tahap 1 - Listening Experience Profesional

## Tujuan
Meningkatkan pengalaman mendengar tanpa mengubah alur streaming utama.

## Fitur Tahap Ini

1. Sleep timer.
2. Enhanced Now On Air.
3. Favorite program.
4. Mini player state.
5. Status buffering/reconnecting/error.

## Prinsip Implementasi

- Jangan ganti audio player utama.
- Jangan ubah URL stream.
- Jangan ubah state global lama secara agresif.
- Tambahkan hook/helper baru.
- Jika fitur baru error, audio tetap berjalan.

## Struktur File

```txt
src/features/listening/hooks/useSleepTimer.ts
src/features/listening/hooks/useProgramFavorite.ts
src/features/listening/hooks/usePlayerStatus.ts
src/features/listening/components/SleepTimerControl.tsx
src/features/listening/components/EnhancedNowOnAirCard.tsx
src/features/listening/components/FavoriteProgramButton.tsx
src/features/listening/components/PlayerStatusBadge.tsx
src/features/listening/services/programFavorite.service.ts
```

## 1. Sleep Timer

### Requirement

User dapat memilih timer:

- Off.
- 15 menit.
- 30 menit.
- 45 menit.
- 60 menit.
- Custom menit jika mudah.

Saat timer habis:

- Audio pause/stop.
- Mini player menampilkan status “Timer selesai”.
- Tidak menghapus session streaming.
- Tidak logout user.

### Hook

```ts
export function useSleepTimer(options: {
  onTimerEnd: () => void;
}) {
  return {
    selectedMinutes,
    remainingSeconds,
    isActive,
    startTimer,
    cancelTimer,
  };
}
```

### UI

Tempatkan di player detail, bukan wajib di mini player.

Label:

```txt
Sleep Timer
Berhenti otomatis setelah...
```

### Larangan

- Jangan pakai alert browser.
- Jangan auto-start timer.
- Jangan simpan timer ke Firestore.

## 2. Enhanced Now On Air

### Data yang Ditampilkan

- Nama program aktif.
- Penyiar.
- Operator jika tersedia.
- Jam mulai-selesai.
- Poster program.
- Status LIVE.
- Tombol request lagu.
- Tombol salam udara jika tahap 2 sudah aktif.

### Komponen

```tsx
<EnhancedNowOnAirCard
  program={currentProgram}
  host={host}
  operator={operator}
  onRequestSong={handleRequestSong}
/>
```

### Fallback

Jika jadwal tidak ditemukan:

```txt
Radio SBL Live
Suara Pinrang, Suara Kita
```

Jangan tampilkan error mentah.

## 3. Favorite Program

### Firestore Collection Baru

```txt
userProgramFavorites/{userId}/items/{programId}
```

Field:

```ts
{
  programId: string;
  programTitle: string;
  programPoster?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Rules

- User hanya bisa membaca/menulis favorit miliknya sendiri.
- Admin boleh membaca agregat jika nanti diperlukan.

### UI

Gunakan icon hati/star.

State:

- Favorit.
- Belum favorit.
- Loading.

### Fail-safe

Jika gagal simpan favorit:

- Tampilkan toast kecil.
- Jangan membuat player error.

## 4. Mini Player State

Tambahkan status visual ringan:

- LIVE.
- Buffering.
- Reconnecting.
- Paused.
- Error.

Jangan ubah posisi mini player yang sudah stabil.

### Komponen

```tsx
<PlayerStatusBadge status={playerStatus} />
```

### Warna

Gunakan warna yang sudah ada di tema Radio SBL. Jangan memperkenalkan palet baru yang kontras berlebihan.

## 5. Error Handling Streaming

Tambahkan listener pada audio element:

- `waiting` → buffering.
- `playing` → live/playing.
- `pause` → paused.
- `error` → error.
- `stalled` → reconnecting.

Jangan langsung reload page saat error.

## Testing Tahap 1

### Command

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

### Manual Test

- [ ] Streaming bisa play.
- [ ] Streaming bisa pause.
- [ ] Sleep timer 15 menit bisa dipilih.
- [ ] Sleep timer bisa dibatalkan.
- [ ] Saat timer selesai, audio berhenti normal.
- [ ] Now On Air tampil dengan data jadwal.
- [ ] Jika jadwal kosong, fallback tampil.
- [ ] Favorite program bisa ditambah.
- [ ] Favorite program bisa dihapus.
- [ ] Mini player tidak berubah posisi.
- [ ] Mobile tidak horizontal scroll.
- [ ] Dashboard utama tidak berubah.

## Rollback

Matikan flag:

```ts
listeningEnhancements: false
```

Jika masih bermasalah, revert file di `src/features/listening/` dan route/menu yang ditambahkan.
