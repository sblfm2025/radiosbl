# DEPLOYMENT_GUIDE.md

## Build

```bash
npm run build
```

## Deploy

```bash
firebase deploy
```

## Checklist

- Typecheck lolos.
- Test lolos.
- Build lolos.
- Firebase rules deploy.
- Google Drive OAuth domain terdaftar.
- PWA installable.
- `public/sw.js` ikut terdeploy.
- Manifest tersedia di `/manifest.webmanifest`.
- Audio stream `https://pu.klikhost.com/proxy/sbl/stream` tidak dicache oleh service worker.
- Social preview aktif:
  - `https://radiosbl.web.app/` memuat meta Open Graph/Twitter di HTML awal.
  - `https://radiosbl.web.app/coverSBL.jpg` merespons publik sebagai JPG.
  - `og:image` dan `twitter:image` memakai URL absolut HTTPS.
- Proxy notifikasi berjalan di backend aman jika WhatsApp/Gemini otomatis
  diaktifkan.

## Local Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run seed:export
```

## Google Drive API

Untuk verifikasi upload lokal:

```bash
npm run drive:auth
npm run drive:server
```

Pastikan `.env.local` berisi `VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT`,
`GOOGLE_DRIVE_CLIENT_SECRET_PATH`, dan `GOOGLE_DRIVE_TOKEN_PATH`. File
`client_secret_*.json` serta token OAuth tidak boleh di-commit.

Untuk production, pindahkan logic endpoint upload ke backend/hosting server yang
aman, lalu arahkan `VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT` ke URL backend tersebut.

## Notification Proxy

Untuk verifikasi lokal:

```bash
npm run proxy:notifications
```

Endpoint lokal:

```txt
http://localhost:8788/whatsapp/send
http://localhost:8788/gemini/draft
```

Set `.env.local`:

```env
VITE_WHATSAPP_PROXY_ENDPOINT=http://localhost:8788/whatsapp/send
VITE_GEMINI_PROXY_ENDPOINT=http://localhost:8788/gemini/draft
NOTIFICATION_PROXY_ALLOWED_ORIGIN=http://localhost:5173
WHATSAPP_CLOUD_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
GEMINI_API_KEY=
GEMINI_API_KEYS=
GEMINI_MODEL=gemini-2.0-flash
```

Jika token WhatsApp atau Gemini belum diisi, proxy berjalan dalam mode demo dan
tidak mengirim pesan eksternal nyata. Untuk production, deploy script ini sebagai
backend aman atau pindahkan handler ke Cloud Functions/Cloud Run, lalu arahkan
env `VITE_*_PROXY_ENDPOINT` ke URL backend tersebut.

## Firebase Functions Proxy

Scaffold Functions tersedia di `functions/index.js` dengan fungsi HTTP
`notificationProxy`.

```bash
npm run functions:lint
npm run functions:deploy
```

Endpoint yang akan dipakai setelah deploy Functions:

```txt
https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/whatsapp/send
https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/gemini/draft
```

Catatan status 15 Mei 2026: deploy Functions dicoba, tetapi project `radiosbl`
masih berada di Spark Plan. Firebase CLI menolak enable `cloudbuild.googleapis.com`
dan meminta upgrade ke Blaze sebelum Functions dapat dideploy. Hosting dan
Firestore rules tetap bisa dideploy dengan:

```bash
npx firebase-tools deploy --only hosting --project radiosbl
npx firebase-tools deploy --only firestore:rules --project radiosbl
```

Setelah deploy, buka DevTools > Application untuk memastikan manifest dan
service worker aktif.

## Social Sharing Verification

Setelah hosting deploy, cek URL berikut:

```txt
https://radiosbl.web.app/
https://radiosbl.web.app/coverSBL.jpg
```

Lalu refresh cache preview melalui:

- Facebook Sharing Debugger: `https://developers.facebook.com/tools/debug/`
- LinkedIn Post Inspector: `https://www.linkedin.com/post-inspector/`
- X/Twitter Card Validator jika tersedia untuk akun terkait.

WhatsApp memakai cache preview dari URL yang pernah dibagikan. Jika preview lama
masih muncul, ubah sedikit URL saat tes, misalnya
`https://radiosbl.web.app/?v=cover-20260515`, lalu bagikan ulang.
