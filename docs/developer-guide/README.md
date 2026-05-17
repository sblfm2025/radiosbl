# Panduan Developer Internal

## Fungsi
Panduan ini memberi konteks teknis untuk developer internal yang memelihara RadioSBL App.

## Stack
- React + Vite + TypeScript
- Firebase Auth dan Firestore
- PWA shell
- Playwright untuk e2e/screenshot
- Vitest untuk unit test

## Struktur Penting
| Path | Fungsi |
| --- | --- |
| `src/App.tsx` | Routing halaman utama dan shell aplikasi |
| `src/components` | Halaman dan komponen UI |
| `src/services` | Integrasi Firestore, auth, request, absensi, AI, Live/OB |
| `src/data/radioData.ts` | Data resmi stasiun, program, role menu, dan jadwal seed |
| `src/styles/app.css` | Design system dan CSS halaman |
| `docs` | Dokumentasi teknis dan panduan user |

## Command
```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
npm run docs:screenshots
```

## Screenshot Dokumentasi
Script `npm run docs:screenshots` menjalankan Vite mode test, login dengan sesi demo lokal, lalu menyimpan PNG ke `docs/screenshots`.

## Catatan Keamanan
- Jangan commit `.env.local`.
- Jangan menaruh API key di file publik.
- Frontend hanya memanggil AI/WhatsApp melalui proxy.
- Screenshot dokumentasi wajib memakai data demo/dummy.

