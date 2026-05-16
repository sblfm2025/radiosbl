# LPPL Radio Suara Bumi Lasinrang Management System

**Tagline:** "Suara Pinrang, Suara Kita"

Aplikasi Progressive Web App (PWA) untuk manajemen operasional LPPL Radio
Suara Bumi Lasinrang, mencakup absensi, penyiar, jadwal siaran, liputan,
Outside Broadcast (OB), streaming, YouTube, Discord, pengaduan, arsip digital,
dan dukungan AI.

## Stack

- React
- Vite
- TypeScript
- Firebase Auth, Firestore, dan Firebase Hosting
- Google Drive API
- Gemini AI

## Instalasi

```bash
npm install
npm run dev
```

## Verifikasi

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deploy

```bash
firebase deploy
```

Dokumentasi lanjutan tersedia di folder `docs/`.

## Melanjutkan Dari Sesi/Akun Lain

Baca terlebih dahulu:

- `docs/HANDOFF.md` untuk ringkasan status terbaru dan prioritas berikutnya.
- `docs/CODEX_SESSION_LOG.md` untuk riwayat perubahan lengkap.
- `docs/DATABASE_SCHEMA.md` untuk schema dan service.

Setiap perubahan signifikan wajib dicatat kembali ke `docs/CODEX_SESSION_LOG.md`
dan, bila mengubah status besar project, ringkas juga di `docs/HANDOFF.md`.
