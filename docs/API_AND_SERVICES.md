# API_AND_SERVICES.md

## Service Layer

- firebaseAuth.service.ts
- firestore.service.ts
- googleDrive.service.ts
- attendance.service.ts
- schedule.service.ts
- liveOb.service.ts
- youtube.service.ts
- discord.service.ts
- gemini.service.ts
- whatsappNotification.service.ts

## Proxy Lokal

```bash
npm run proxy:notifications
```

Script `scripts/notification-proxy-server.mjs` menyediakan endpoint:

- `POST /whatsapp/send` untuk WhatsApp Cloud API.
- `POST /gemini/draft` untuk Gemini.

Frontend hanya menyimpan URL proxy:

- `VITE_WHATSAPP_PROXY_ENDPOINT=http://localhost:8788/whatsapp/send`
- `VITE_GEMINI_PROXY_ENDPOINT=http://localhost:8788/gemini/draft`

Secret tetap berada di backend/proxy:

- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `GEMINI_API_KEY` atau `GEMINI_API_KEYS`

## Firebase Functions

Proxy produksi juga sudah disiapkan sebagai Firebase Functions:

- `functions/index.js`
- function: `notificationProxy`
- region: `asia-southeast1`

Perintah:

```bash
npm run functions:lint
npm run functions:deploy
```

Deploy Functions membutuhkan Firebase Blaze Plan karena perlu Cloud Build.
Pada Spark Plan, gunakan proxy lokal untuk development dan deploy hosting/rules
dengan `--only hosting` atau `--only firestore:rules`.

## Prinsip

Komponen UI tidak langsung memanggil Firebase atau API eksternal. Semua lewat service layer.
