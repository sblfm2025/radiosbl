# Tahap 7 - Polish UI, Release, Dokumentasi, dan Training

## Tujuan
Memastikan fitur profesional yang sudah dibuat terasa menyatu dengan Radio SBL, rapi di mobile/desktop, dan siap dipakai tim.

## Fitur Tahap Ini

1. UI consistency audit.
2. Mobile responsiveness audit.
3. Empty/loading/error state audit.
4. Final release checklist.
5. Dokumentasi operator/admin.
6. Training internal.

## Prinsip UI

- Pertahankan tampilan premium yang sudah ada.
- Gunakan card rounded, soft shadow, spacing lega.
- Gunakan ikon konsisten dari lucide-react.
- Jangan pakai komponen kasar/default browser.
- Jangan terlalu banyak warna baru.
- Jangan membuat tabel sempit di mobile.
- Gunakan tab/filter untuk data panjang.

## Checklist UI Global

Untuk setiap halaman baru:

- [ ] Header jelas.
- [ ] Subjudul menjelaskan fungsi halaman.
- [ ] Ada loading state.
- [ ] Ada empty state.
- [ ] Ada error state.
- [ ] Ada tombol kembali jika halaman detail.
- [ ] Ada konfirmasi sebelum delete/reject/publish.
- [ ] Mobile nyaman.
- [ ] Desktop tidak terlalu lebar kosong.
- [ ] Tidak ada horizontal scroll.
- [ ] Font tidak terlalu besar.
- [ ] Button tidak terlalu kecil.
- [ ] Icon konsisten.

## Halaman yang Harus Diaudit

- Streaming player.
- Mini player.
- Now On Air.
- Request lagu V2.
- Salam udara.
- Studio Inbox.
- Podcast.
- Video Hub.
- Rundown.
- Checklist pra-siaran.
- Log siaran.
- Handover.
- Listener Analytics.
- Audit Log.
- Approval Queue.

## Dokumentasi Wajib

Buat file:

```txt
docs/pro-features/PANDUAN_ADMIN_FITUR_PRO.md
docs/pro-features/PANDUAN_OPERATOR_STUDIO.md
docs/pro-features/PANDUAN_PENYIAR.md
docs/pro-features/PANDUAN_ANALYTICS.md
docs/pro-features/RELEASE_NOTES.md
```

## Isi Panduan Admin

Minimal mencakup:

- Cara mengakses fitur baru.
- Cara melihat analytics.
- Cara publish episode/video.
- Cara melihat audit log.
- Cara approve request.
- Cara rollback via feature flag.

## Isi Panduan Operator

- Cara membuka Studio Inbox.
- Cara memproses request lagu.
- Cara membaca salam udara.
- Cara menggunakan checklist pra-siaran.
- Cara mencatat kendala teknis.

## Isi Panduan Penyiar

- Cara membuat rundown.
- Cara memakai script board.
- Cara mengisi log siaran.
- Cara membaca handover.
- Cara melihat request yang masuk.

## Isi Panduan Analytics

- Arti “estimasi pendengar aktif dari aplikasi”.
- Bedanya data aplikasi dan data server streaming.
- Cara membaca device breakdown.
- Cara membaca program performance.
- Cara membaca lokasi yang memberi izin.
- Batasan akurasi data.

## Release Checklist

Sebelum merge ke main:

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Checklist manual:

- [ ] Login berhasil.
- [ ] Dashboard utama berhasil.
- [ ] Streaming berhasil.
- [ ] Mini player berhasil.
- [ ] Jadwal siaran berhasil.
- [ ] Absensi berhasil.
- [ ] Request lagu lama/baru berhasil.
- [ ] AI naskah berhasil.
- [ ] Manajemen user berhasil.
- [ ] Analytics hanya admin.
- [ ] Podcast/video hanya published untuk publik.
- [ ] Role access benar.
- [ ] Mobile rapi.
- [ ] Desktop rapi.

## Training Internal

Sesi 1 - Admin:

- Role dan akses.
- Analytics.
- Audit log.
- Approval.

Sesi 2 - Operator:

- Studio Inbox.
- Request lagu.
- Salam udara.
- Checklist.
- Log teknis.

Sesi 3 - Penyiar:

- Rundown.
- Script board.
- Log siaran.
- Handover.

## Rollback Plan Global

Jika setelah release ada masalah:

1. Matikan feature flag fitur bermasalah.
2. Deploy ulang hosting.
3. Jangan hapus data produksi.
4. Catat bug di release notes.
5. Perbaiki di branch hotfix.

Contoh:

```ts
export const featureFlags = {
  listeningEnhancements: true,
  listenerEngagement: false,
  contentHub: false,
  broadcastWorkflow: false,
  listenerAnalytics: false,
  securityAuditLog: false,
};
```

## Definisi Final Selesai

Fitur profesional dianggap siap jika:

- Tidak mengganggu UI premium.
- Tidak mengganggu alur data lama.
- Semua tahap bisa dimatikan via feature flag.
- Semua halaman baru punya panduan.
- Admin/operator/penyiar bisa memakai tanpa didampingi developer.
- Tidak ada regresi fitur utama.
