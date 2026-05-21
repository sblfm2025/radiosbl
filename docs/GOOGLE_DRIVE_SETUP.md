# GOOGLE_DRIVE_SETUP.md

## Tujuan

Google Drive API digunakan sebagai pengganti Firebase Storage untuk menyimpan
foto, audio, video, dan dokumen.

## Langkah Google Cloud

1. Buka Google Cloud Console.
2. Enable Google Drive API.
3. Enable Google Picker API jika nanti memakai file picker.
4. Buat OAuth Client untuk Web Application.
5. Tambahkan redirect URI lokal. File OAuth saat ini memakai
   `http://localhost:5173`; jika ingin port auth terpisah, tambahkan juga
   `http://localhost:8788/oauth2callback` di Google Cloud Console.
6. Tambahkan domain production untuk backend upload saat sudah deploy.

## Konfigurasi Lokal

File `client_secret_*.json` tidak boleh masuk repo. Simpan path-nya di
`.env.local`:

```env
VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT=http://localhost:8787/upload
GOOGLE_DRIVE_CLIENT_SECRET_PATH=D:\# DOWNLOAD\client_secret_....json
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5173
GOOGLE_DRIVE_TOKEN_PATH=C:\tmp\radio-sbl-google-drive-token.json
GOOGLE_DRIVE_UPLOAD_PORT=8787
GOOGLE_DRIVE_ROOT_FOLDER=LPPL-RADIO
GOOGLE_DRIVE_ALLOWED_ORIGIN=http://localhost:5173
```

## OAuth Lokal

Jalankan:

```bash
npm run drive:auth
```

Buka URL yang muncul di terminal, login dengan akun Google Drive tujuan, lalu
izinkan akses. Script akan menyimpan refresh token ke `GOOGLE_DRIVE_TOKEN_PATH`,
bukan ke repo.

Catatan: jika `GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5173`, hentikan dev
server Vite sebentar saat menjalankan `npm run drive:auth`, karena script OAuth
perlu mendengarkan callback di port yang sama.

## Endpoint Upload Lokal

Setelah OAuth berhasil:

```bash
npm run drive:server
```

Endpoint upload aktif di:

```txt
http://localhost:8787/upload
```

Frontend akan memakai endpoint ini jika `VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT`
terisi. Jika env tersebut kosong, aplikasi tetap memakai metadata demo agar mode
offline/test tidak menyentuh Google Drive.

## Endpoint Publik Sementara

Untuk aplikasi live di `https://radiosbl.web.app`, endpoint `localhost` tidak
bisa diakses dari HP staf. Selama belum ada VPS/domain tetap, jalankan tunnel
HTTPS ke server lokal:

```bash
ngrok http 8787
```

Lalu set `.env.local`:

```env
VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT=https://DOMAIN-NGROK/upload
GOOGLE_DRIVE_ALLOWED_ORIGIN=https://radiosbl.web.app
```

Restart `npm run drive:server`, jalankan `npm run drive:status`, lalu build dan
deploy ulang hosting. Jika ngrok restart dan domain berubah, update env dan
deploy ulang.

## Endpoint 24 Jam Tanpa Komputer

Jika tidak ingin memakai Firebase Storage, Firebase Functions Blaze, VPS, atau
komputer lokal, gunakan Google Apps Script Web App.

1. Buka `https://script.google.com`.
2. Buat project baru.
3. Salin isi `scripts/google-drive-apps-script.js` ke file `Code.gs`.
4. Klik `Deploy` > `New deployment` > pilih `Web app`.
5. `Execute as`: `Me`.
6. `Who has access`: `Anyone`.
7. Klik `Deploy`, izinkan akses Google Drive, lalu salin URL Web App.
8. Isi `.env.local`:

```env
VITE_GOOGLE_DRIVE_APPS_SCRIPT_ENDPOINT=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT=
```

9. Jalankan pengecekan endpoint:

```bash
npm run drive:status
```

Jika muncul `BELUM REDEPLOY: doGet belum ada di deployment Apps Script`, buka
project Apps Script yang sama, pilih `Deploy` > `Manage deployments`, klik ikon
edit, pilih `New version`, lalu deploy ulang. URL Web App tetap sama jika
deployment yang diedit adalah deployment lama.

Redeploy dianggap selesai jika `npm run drive:status` menampilkan:

```txt
Health Apps Script: OK (2026-05-21-drive-validation-v1)
```

10. Jalankan build dan deploy hosting ulang:

```bash
npm run build
firebase deploy --only hosting --project radiosbl
```

Mode ini menyimpan file langsung ke Google Drive akun pemilik Apps Script dan
tidak membutuhkan komputer lokal menyala.

File yang diizinkan pada endpoint Apps Script:

- Maksimal 10 MB.
- Modul upload: `attendance`, `liputan`, `uploads`, `attendance-healthcheck`.
- Tipe file: gambar, PDF, TXT, DOC, dan DOCX.

## Struktur Folder

```txt
LPPL-RADIO/
+-- attendance/
+-- liputan/
+-- uploads/
+-- attendance-healthcheck/
```

Server upload akan membuat folder root dan subfolder modul secara otomatis jika
belum ada.
