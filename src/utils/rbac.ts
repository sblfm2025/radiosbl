import type { UserRole, Permission } from "../types/domain";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "dashboard:read",
    "users:manage",
    "attendance:self",
    "attendance:manage",
    "schedule:read",
    "schedule:manage",
    "schedule:swap",
    "coverage:manage",
    "live_ob:manage",
    "complaints:submit",
    "complaints:manage",
    "ai:use",
    "settings:manage"
  ],
  admin: [
    "dashboard:read",
    "attendance:self",
    "attendance:manage",
    "schedule:read",
    "schedule:manage",
    "schedule:swap",
    "coverage:manage",
    "live_ob:manage",
    "complaints:submit",
    "complaints:manage",
    "ai:use"
  ],
  leader: [
    "dashboard:read",
    "attendance:self",
    "attendance:manage",
    "schedule:read",
    "coverage:manage",
    "complaints:manage"
  ],
  announcer: [
    "dashboard:read",
    "attendance:self",
    "schedule:read",
    "schedule:swap",
    "ai:use",
    "complaints:submit"
  ],
  reporter: [
    "dashboard:read",
    "attendance:self",
    "coverage:manage",
    "complaints:submit",
    "schedule:read"
  ],
  operator: [
    "dashboard:read",
    "attendance:self",
    "schedule:read",
    "live_ob:manage"
  ],
  employee: [
    "dashboard:read",
    "attendance:self",
    "complaints:submit",
    "schedule:read"
  ],
  public: [
    "dashboard:read",
    "complaints:submit",
    "schedule:read"
  ]
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "dashboard:read": "Melihat ringkasan statistik dan program siaran",
  "users:manage": "Mengelola akun user, hak akses, dan rekap absensi",
  "attendance:self": "Melakukan absensi mandiri",
  "attendance:manage": "Memverifikasi atau mengoreksi absensi staf",
  "schedule:read": "Melihat jadwal siaran mingguan",
  "schedule:manage": "Mengatur slot jadwal dan memverifikasi tukar jadwal",
  "schedule:swap": "Mengajukan permintaan tukar jadwal siaran",
  "coverage:manage": "Mengelola penugasan liputan/event",
  "live_ob:manage": "Mengelola teknis siaran luar studio (Live OB)",
  "complaints:submit": "Mengirimkan aduan atau request lagu",
  "complaints:manage": "Merespon dan mengelola status aduan masyarakat",
  "ai:use": "Menggunakan asisten AI untuk membuat naskah siaran",
  "settings:manage": "Mengubah pengaturan stasiun radio dan konfigurasi sistem"
};

/**
 * Mengecek apakah user dengan role tertentu memiliki izin untuk melakukan aksi tertentu.
 */
export function canUser(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Mengecek apakah user memiliki salah satu dari daftar izin yang diberikan.
 */
export function canUserAny(role: UserRole | undefined, permissions: Permission[]): boolean {
  return permissions.some(p => canUser(role, p));
}

/**
 * Mendapatkan label yang ramah pengguna untuk setiap role.
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    admin: "Administrator",
    leader: "Pimpinan",
    announcer: "Penyiar",
    reporter: "Reporter",
    operator: "Operator",
    employee: "Staf / Pegawai",
    public: "Umum / Tamu"
  };
  return labels[role] || role;
}
