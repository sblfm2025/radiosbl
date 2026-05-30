# Tahap 6 - Security, Role, Audit Log, dan Approval Workflow

## Tujuan
Memastikan fitur profesional tidak membuka celah akses, perubahan data penting tercatat, dan aksi sensitif butuh approval.

## Fitur Tahap Ini

1. Audit log.
2. Role refinement.
3. Approval notifikasi/publikasi.
4. Mode aman jika data gagal.
5. Review Firestore rules.

## Prinsip Implementasi

- Jangan merusak role lama.
- Jangan mengubah user lama tanpa migration plan.
- Tambahkan role baru sebagai optional.
- Semua aksi sensitif dicatat.
- Jangan tampilkan data sensitif ke user biasa.

## Struktur File

```txt
src/features/securityAudit/services/auditLog.service.ts
src/features/securityAudit/services/approval.service.ts
src/features/securityAudit/pages/AuditLogPage.tsx
src/features/securityAudit/pages/ApprovalQueuePage.tsx
src/features/securityAudit/components/AuditLogTable.tsx
src/features/securityAudit/components/ApprovalCard.tsx
src/features/securityAudit/utils/roleGuards.ts
```

## 1. Audit Log

### Collection

```txt
auditLogs/{auditId}
```

Field:

```ts
{
  auditId: string;
  actorUserId: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  targetCollection?: string;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}
```

### Aksi yang Wajib Dicatat

- Ubah jadwal siaran.
- Approve/tolak tukar jadwal.
- Hapus request lagu.
- Tandai request lagu diputar/ditolak.
- Publish/unpublish podcast.
- Publish/unpublish video.
- Kirim notifikasi massal.
- Ubah role user.
- Baca/export analytics lokasi presisi.
- Hapus data analytics.

## 2. Role Refinement

Role rekomendasi:

```txt
super_admin
admin_siaran
operator
penyiar
reporter
editor_konten
viewer_pimpinan
user
```

Jangan langsung mengganti role lama. Buat mapping:

```ts
export function normalizeRole(role: string) {
  const map = {
    admin: 'super_admin',
    penyiar: 'penyiar',
    operator: 'operator',
  };
  return map[role] ?? role;
}
```

## 3. Approval Workflow

### Collection

```txt
approvalRequests/{approvalId}
```

Field:

```ts
{
  approvalId: string;
  type: 'notification' | 'public_content' | 'schedule_change' | 'analytics_export';
  title: string;
  payload: Record<string, unknown>;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
}
```

### Aksi Butuh Approval

- Notifikasi massal ke semua user.
- Publish konten publik utama.
- Export analytics lokasi presisi.
- Perubahan jadwal besar.

## 4. Mode Aman

Jika data gagal dimuat:

- Tampilkan empty state.
- Tampilkan tombol refresh.
- Jangan blank page.
- Jangan console error berlebihan.

Contoh teks:

```txt
Data belum dapat dimuat. Coba muat ulang atau hubungi admin.
```

## 5. Firestore Rules Review

Checklist:

- [ ] Analytics tidak public read.
- [ ] Lokasi presisi hanya admin tertentu.
- [ ] User hanya update data miliknya.
- [ ] Request/salam masuk bisa create, status hanya admin/operator.
- [ ] Audit log tidak bisa diedit user biasa.
- [ ] Approval hanya reviewer berwenang.

## Testing Tahap 6

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Manual:

- [ ] User biasa tidak melihat menu admin.
- [ ] Penyiar tidak bisa ubah role user.
- [ ] Operator bisa proses request sesuai izin.
- [ ] Audit log tercatat saat jadwal diubah.
- [ ] Audit log tercatat saat konten dipublish.
- [ ] Notifikasi massal masuk approval.
- [ ] Export lokasi presisi butuh approval.
- [ ] Halaman tidak blank saat data gagal.

## Rollback

Matikan flag:

```ts
securityAuditLog: false
```

Jangan hapus `auditLogs` jika sudah ada data produksi.
