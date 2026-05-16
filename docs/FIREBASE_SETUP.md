# FIREBASE_SETUP.md

## Langkah

1. Buat Firebase Project.
2. Pilih Spark Plan.
3. Aktifkan Firebase Auth.
   - Aktifkan provider Email/Password.
   - Aktifkan provider Google.
   - Tambahkan domain aplikasi ke Authorized domains jika deploy di domain baru.
4. Aktifkan Firestore.
5. Setup Firebase Hosting.

## Commands

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

Selama project masih Spark Plan, gunakan deploy terarah agar tidak memicu
Functions:

```bash
npx firebase-tools deploy --only hosting --project radiosbl
npx firebase-tools deploy --only firestore:rules --project radiosbl
```

Firebase Functions proxy tersedia, tetapi deploy membutuhkan upgrade ke Blaze:

```bash
npm run functions:deploy
```

## Environment

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_MEASUREMENT_ID=
GEMINI_API_KEY=
GEMINI_API_KEYS=
VITE_GEMINI_PROXY_ENDPOINT=
VITE_WHATSAPP_PROXY_ENDPOINT=
NOTIFICATION_PROXY_PORT=8788
NOTIFICATION_PROXY_ALLOWED_ORIGIN=http://localhost:5173
WHATSAPP_CLOUD_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_API_VERSION=v20.0
GEMINI_MODEL=gemini-2.0-flash
```

Salin `.env.example` menjadi `.env.local`, lalu isi nilai dari Firebase Console.
Jangan commit `.env.local`.

`GEMINI_API_KEY` dan `GEMINI_API_KEYS` tidak memakai prefix `VITE_` agar tidak
terbawa ke bundle frontend. Gunakan key tersebut di backend/proxy, lalu expose
hanya URL proxy lewat `VITE_GEMINI_PROXY_ENDPOINT`.

`WHATSAPP_CLOUD_API_TOKEN` dan `WHATSAPP_PHONE_NUMBER_ID` juga hanya boleh berada
di backend/proxy. Frontend cukup memakai `VITE_WHATSAPP_PROXY_ENDPOINT`.

Untuk menjalankan import seed dari terminal, pastikan environment `VITE_FIREBASE_*`
tersedia di shell aktif. Script import memakai nilai yang sama dengan aplikasi.

## Seed Data Resmi 2026

```bash
npm run seed:export
npm run seed:import
npm run seed:import:write
npm run seed:import:write:cli
```

- `seed:export` membuat `tmp/firestore-seed.json`.
- `seed:import` adalah dry-run dan tidak menulis data.
- `seed:import:write` menulis data resmi jadwal, penyiar, direktur utama,
  streaming, dan pengaturan aplikasi ke Firestore.
- `seed:import:write:cli` menulis data yang sama lewat Firestore REST API
  memakai kredensial Firebase CLI yang sudah login.

Mode tulis memakai Firebase Web SDK, sehingga proses import tetap tunduk pada
Firestore Rules. Jika rules produksi menolak write dari client, jalankan import
di lingkungan yang rules-nya sementara mengizinkan admin/operator, atau lanjutkan
dengan `seed:import:write:cli` dari mesin yang sudah `firebase login`.

## Files

- `firebase.json` untuk Hosting dan Firestore.
- `firestore.rules` untuk role-based access awal.
- `firestore.indexes.json` untuk query utama dashboard, absensi, jadwal, aduan, dan Live OB.
