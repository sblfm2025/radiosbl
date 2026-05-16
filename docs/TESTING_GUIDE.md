# TESTING_GUIDE.md

## Tools

- Vitest
- Playwright
- Testing Library

## Unit Test Wajib

- Role permission.
- Geolocation radius.
- File validation.
- YouTube URL parser.
- Attendance payload.
- Schedule swap flow.

## Self-Healing

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Jika gagal, perbaiki lalu ulangi sampai semua lolos.
