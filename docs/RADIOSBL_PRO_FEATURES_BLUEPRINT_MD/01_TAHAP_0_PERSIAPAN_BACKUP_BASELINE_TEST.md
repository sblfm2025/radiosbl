# Tahap 0 - Persiapan, Backup, Baseline Test, dan Feature Flag

## Tujuan
Menyiapkan fondasi kerja aman sebelum fitur profesional ditambahkan.

## Output Tahap Ini

- Backup commit state stabil.
- Branch kerja baru.
- Baseline test tercatat.
- Feature flag tersedia.
- Folder dokumentasi tersedia.
- Catatan file yang tidak boleh disentuh tersedia.

## Langkah 1 - Backup Git

```bash
git status
git add .
git commit -m "backup: stable state before professional features"
git checkout -b feature/radiosbl-pro-stage-00-prep
```

Jika ada file belum siap commit, hentikan pekerjaan dan minta pemilik repo memastikan state stabil.

## Langkah 2 - Catat Baseline Test

Jalankan:

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Buat file:

```txt
docs/pro-features/BASELINE_TEST_REPORT.md
```

Isi minimal:

```md
# Baseline Test Report

Tanggal:
Branch:
Commit:

## Command Result
- npm run typecheck: PASS/FAIL
- npm run test: PASS/FAIL
- npm run build: PASS/FAIL
- npm run test:e2e: PASS/FAIL

## Catatan
- Error lama yang sudah ada:
- Error baru:
- Screenshot dashboard:
- Screenshot streaming:
- Screenshot jadwal:
- Screenshot absensi:
```

## Langkah 3 - Tambahkan Feature Flag

Buat file:

```txt
src/config/featureFlags.ts
```

Isi:

```ts
export const featureFlags = {
  listeningEnhancements: false,
  listenerEngagement: false,
  contentHub: false,
  broadcastWorkflow: false,
  listenerAnalytics: false,
  securityAuditLog: false,
};
```

Aturan:

- Default semua fitur baru `false`.
- Aktifkan satu per satu saat pengujian.
- Jangan hardcode fitur baru langsung aktif di banyak tempat.

## Langkah 4 - Buat Struktur Folder

```txt
src/features/listening/
src/features/engagement/
src/features/contentHub/
src/features/broadcastWorkflow/
src/features/analytics/
src/features/securityAudit/
src/shared/components/
src/shared/hooks/
src/shared/utils/
docs/pro-features/
```

Jangan pindahkan file lama ke folder baru pada tahap ini.

## Langkah 5 - Daftar File yang Tidak Boleh Diubah Besar

Buat file:

```txt
docs/pro-features/DO_NOT_BREAK_LIST.md
```

Isi:

```md
# Do Not Break List

Fitur yang tidak boleh rusak:

1. Login.
2. Dashboard utama.
3. Streaming audio.
4. Mini player.
5. Jadwal siaran.
6. Absensi.
7. Request lagu.
8. AI naskah.
9. Manajemen user.
10. Role access.
11. Firebase config.
12. Firestore rules lama.
```

## Langkah 6 - Setup Shared Error Wrapper

Buat util:

```txt
src/shared/utils/safeAsync.ts
```

Contoh:

```ts
export async function safeAsync<T>(
  label: string,
  task: () => Promise<T>,
  fallback?: T,
): Promise<T | undefined> {
  try {
    return await task();
  } catch (error) {
    console.warn(`[safeAsync:${label}]`, error);
    return fallback;
  }
}
```

Gunakan untuk fitur baru yang tidak boleh mengganggu fitur inti.

## Langkah 7 - Firestore Rules Tidak Dibuka Dulu

Pada tahap 0 jangan ubah Firestore rules kecuali menambahkan komentar TODO.

Contoh:

```txt
// TODO pro-features: add rules only when each collection is implemented.
```

## Checklist Selesai Tahap 0

- [ ] Backup commit dibuat.
- [ ] Branch baru dibuat.
- [ ] Baseline test dicatat.
- [ ] Feature flag dibuat.
- [ ] Folder fitur dibuat.
- [ ] `safeAsync` dibuat.
- [ ] Tidak ada perubahan UI.
- [ ] Tidak ada perubahan schema lama.
- [ ] Build berhasil.

## Rollback

Jika tahap 0 bermasalah:

```bash
git checkout main
git branch -D feature/radiosbl-pro-stage-00-prep
```
