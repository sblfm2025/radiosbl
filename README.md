# Radio SBL Management System

![Radio SBL cover](public/coverSBL.jpg)

**Radio SBL Management System** adalah Progressive Web App untuk mendukung
operasional LPPL Radio Suara Bumi Lasinrang 92,4 FM: absensi, jadwal siaran,
profil penyiar, liputan, streaming, pengaduan, naskah AI, dan administrasi
pengguna.

Tagline: **Suara Pinrang, Suara Kita**

## Tampilan Identitas

| Logo aplikasi | Cover utama | Studio login |
|---|---|---|
| ![Logo aplikasi](public/logoapp.png) | ![Cover Radio SBL](public/coverartsbl.jpg) | ![Studio Radio SBL](public/sbl-auth-studio-bg.png) |

## Modul Utama

- **Dashboard operasional:** ringkasan siaran, absensi, request lagu, dan status
  layanan.
- **Absensi staf:** check-in berbasis lokasi, selfie, radius kantor, review
  admin, dan rekap periode.
- **Jadwal siaran:** daftar slot program, penyiar, operator, dan pengajuan tukar
  jadwal.
- **Profil penyiar:** data kru, foto, program, role, dan status aktif.
- **Streaming:** audio player, info siaran aktif, mini player, dan waveform.
- **Liputan dan OB:** pengelolaan agenda lapangan, dokumentasi, dan koordinasi.
- **Pengaduan publik:** form aspirasi masyarakat dan tindak lanjut admin.
- **AI naskah siaran:** generator draft naskah berbasis proxy Gemini/OpenAI.
- **Manajemen pengguna:** role, hak akses, verifikasi admin, dan profil staf.

Dokumentasi lengkap tersedia di
[docs/DOKUMENTASI_LENGKAP.md](docs/DOKUMENTASI_LENGKAP.md).

## Galeri Program

| Program | Poster | Program | Poster |
|---|---|---|---|
| Aga Kareba | ![Aga Kareba](public/program/Aga_Kareba.jpg) | Informasi Seputar Pinrang | ![Informasi Seputar Pinrang](public/program/Informasi_Seputar_Pinrang.jpg) |
| Info Terkini | ![Info Terkini](public/program/Info_Terkini.jpg) | Jumat Ceria | ![Jumat Ceria](public/program/Jumat_Ceria.jpg) |
| Lasinrang Preneur | ![Lasinrang Preneur](public/program/Lasinrang_Preneur.jpg) | Pinrang Berkabar | ![Pinrang Berkabar](public/program/Pinrang_Berkabar.jpg) |
| Pinrang Creative Network | ![Pinrang Creative Network](public/program/Pinrang_Creative_Network.jpg) | Podcast SBL | ![Podcast SBL](public/program/PODCAST_SBL.jpg) |
| Salam Bumi Lasinrang | ![Salam Bumi Lasinrang](public/program/Salam_Bumi_lasinrang.jpg) | SBL Goes To School | ![SBL Goes To School](public/program/SBL_Goes_To_School.jpg) |
| SBL On Stage | ![SBL On Stage](public/program/SBL_On_Stage.jpg) | SBL Peduli | ![SBL Peduli](public/program/SBL_Peduli.jpg) |
| Siporio Siporennu | ![Siporio Siporennu](public/program/Siporio_Siporennu.jpg) |  |  |

## Galeri Kru

| Amar | Azhar | Hendra |
|---|---|---|
| ![Amar](public/crew/amar.png) | ![Azhar](public/crew/azhar.png) | ![Hendra](public/crew/hendra.png) |

| Miah | Muhas | Ria |
|---|---|---|
| ![Miah](public/crew/Miah.png) | ![Muhas](public/crew/muhas.png) | ![Ria](public/crew/ria.png) |

| Riska | Sul | Wiwik |
|---|---|---|
| ![Riska](public/crew/riska.png) | ![Sul](public/crew/sul.png) | ![Wiwik](public/crew/wiwik.png) |

## Teknologi

- React 19, Vite 7, TypeScript
- Firebase Auth, Firestore, Storage, Hosting
- Firebase Functions untuk proxy produksi
- Google Drive API untuk arsip file
- Gemini/OpenAI proxy untuk naskah siaran
- Playwright dan Vitest untuk pengujian

## Mulai Cepat

```bash
npm install
npm run dev
```

Buat `.env.local` dari `.env.example`, lalu isi konfigurasi Firebase dan proxy
yang dipakai.

## Verifikasi Lokal

```bash
npm run typecheck
npm run test
npm run build
```

`npm run lint` tersedia, tetapi repo saat ini masih memiliki lint debt pada
beberapa script scratch dan file lama. Lihat catatan status di
[docs/HANDOFF.md](docs/HANDOFF.md).

## Deploy

```bash
npm run build
npx firebase-tools deploy --only hosting --project radiosbl
```

Deploy Functions membutuhkan Firebase Blaze Plan:

```bash
npm run functions:deploy
```

## Dokumentasi Penting

- [Dokumentasi lengkap](docs/DOKUMENTASI_LENGKAP.md)
- [Panduan aset visual](docs/PANDUAN_ASET_VISUAL.md)
- [Setup Firebase](docs/FIREBASE_SETUP.md)
- [Setup Gemini](docs/GEMINI_SETUP.md)
- [Setup Google Drive](docs/GOOGLE_DRIVE_SETUP.md)
- [Deployment](docs/DEPLOYMENT_GUIDE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Hak akses role](docs/ROLE_ACCESS.md)
- [Handoff pengembangan](docs/HANDOFF.md)
