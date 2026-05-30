# Checklist Gabungan Eksekusi Developer

## Sebelum Mulai

- [ ] Pull repo terbaru.
- [ ] Pastikan branch main stabil.
- [ ] Jalankan baseline test.
- [ ] Commit backup.
- [ ] Buat branch fitur.
- [ ] Aktifkan hanya satu feature flag per tahap.

## Tahap 0 - Persiapan

- [ ] `src/config/featureFlags.ts` dibuat.
- [ ] Folder fitur dibuat.
- [ ] `safeAsync.ts` dibuat.
- [ ] Baseline test report dibuat.
- [ ] Do Not Break List dibuat.

## Tahap 1 - Listening Experience

- [ ] Sleep timer dibuat.
- [ ] Enhanced Now On Air dibuat.
- [ ] Favorite program dibuat.
- [ ] Mini player status badge dibuat.
- [ ] Streaming error state ringan dibuat.
- [ ] Player lama tetap berjalan.

## Tahap 2 - Engagement

- [ ] Request lagu V2 dibuat.
- [ ] Status request dibuat.
- [ ] Studio Inbox dibuat.
- [ ] Salam udara dibuat.
- [ ] Polling dibuat.
- [ ] Moderasi diterapkan.

## Tahap 3 - Content Hub

- [ ] Program episodes dibuat.
- [ ] Halaman podcast dibuat.
- [ ] Episode detail dibuat.
- [ ] Resume playback dibuat.
- [ ] Video Hub dibuat.
- [ ] Pinrang Berkabar feed manual dibuat.

## Tahap 4 - Broadcast Workflow

- [ ] Rundown dibuat.
- [ ] Checklist pra-siaran dibuat.
- [ ] Log siaran dibuat.
- [ ] Handover dibuat.
- [ ] Script board dibuat.

## Tahap 5 - Analytics

- [ ] Session tracking dibuat.
- [ ] Heartbeat dibuat.
- [ ] GPS consent dibuat.
- [ ] Latitude/longitude disimpan hanya jika izin.
- [ ] Streaming error tracking dibuat.
- [ ] Dashboard analytics dibuat.
- [ ] UI memakai istilah estimasi.

## Tahap 6 - Security

- [ ] Audit log dibuat.
- [ ] Approval queue dibuat.
- [ ] Role guard dibuat.
- [ ] Firestore rules direview.
- [ ] Lokasi presisi dibatasi admin tertentu.

## Tahap 7 - Release

- [ ] Semua UI mobile rapi.
- [ ] Semua UI desktop rapi.
- [ ] Loading/empty/error state lengkap.
- [ ] Panduan admin dibuat.
- [ ] Panduan operator dibuat.
- [ ] Panduan penyiar dibuat.
- [ ] Release notes dibuat.

## Command Wajib Setiap Tahap

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Checklist Regresi Final

- [ ] Login tidak rusak.
- [ ] Dashboard utama tidak rusak.
- [ ] Streaming tidak rusak.
- [ ] Mini player tidak rusak.
- [ ] Jadwal siaran tidak rusak.
- [ ] Absensi tidak rusak.
- [ ] Request lagu tidak rusak.
- [ ] AI naskah tidak rusak.
- [ ] Manajemen user tidak rusak.
- [ ] Role access tidak bocor.
- [ ] Mobile tidak horizontal scroll.
- [ ] Build production sukses.

## Catatan Penting

Jika ada satu fitur baru membuat fitur lama rusak, jangan tambal di banyak tempat. Matikan feature flag, rollback bagian kecil, lalu perbaiki secara terpisah.
