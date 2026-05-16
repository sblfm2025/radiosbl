# SYSTEM_ARCHITECTURE.md

## Arsitektur Umum

```txt
React PWA
  ↓
Firebase Auth
  ↓
Firestore
  ↓
Google Drive API
  ↓
Gemini AI / YouTube / Discord
```

## Prinsip

- Frontend mobile-first.
- Firebase Spark untuk Auth, Firestore, Hosting.
- Tidak menggunakan Firebase Storage.
- File disimpan di Google Drive.
- Firestore hanya menyimpan metadata file.

## File Upload Flow

```txt
User pilih/ambil file
  ↓
Validasi ukuran dan mime type
  ↓
Upload ke Google Drive
  ↓
Simpan metadata ke Firestore
```
