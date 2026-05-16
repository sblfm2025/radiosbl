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

## Struktur Folder

```txt
LPPL-RADIO/
+-- attendance/
+-- coverage/
+-- ob-events/
+-- streaming/
+-- archives/
```

Server upload akan membuat folder root dan subfolder modul secara otomatis jika
belum ada.
