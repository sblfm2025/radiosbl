import type { UserRole } from "../../../types/domain";

// Petakan role lama ke sistem role granular jika dibutuhkan
export function normalizeRole(role: string): string {
  const map: Record<string, string> = {
    admin: "super_admin",
    penyiar: "announcer",
    operator: "operator",
    leader: "leader",
    reporter: "reporter",
    employee: "employee",
    public: "public"
  };
  return map[role] ?? role;
}

// Cek apakah suatu role diizinkan melakukan aksi sensitif secara langsung
// atau apakah memerlukan approval terlebih dahulu
export type ActionPolicy = {
  allowed: boolean;
  requiresApproval: boolean;
};

export function getActionPolicy(userRole: string, action: string): ActionPolicy {
  const normalized = normalizeRole(userRole);

  // Kebijakan Super Admin
  if (normalized === "super_admin") {
    return { allowed: true, requiresApproval: false };
  }

  // Kebijakan Leader (Pimpinan)
  if (normalized === "leader") {
    if (action === "manage_users" || action === "delete_analytics") {
      return { allowed: false, requiresApproval: false }; // Hanya super_admin
    }
    return { allowed: true, requiresApproval: false };
  }

  // Kebijakan Admin Siaran
  if (normalized === "admin_siaran" || normalized === "admin") {
    if (action === "delete_analytics" || action === "manage_users") {
      return { allowed: false, requiresApproval: false }; // Hanya super_admin
    }
    return { allowed: true, requiresApproval: false };
  }

  // Kebijakan Editor Konten
  if (normalized === "editor_konten") {
    if (action === "publish_content") {
      return { allowed: true, requiresApproval: true }; // Butuh persetujuan
    }
    return { allowed: false, requiresApproval: false };
  }

  // Kebijakan Operator
  if (normalized === "operator") {
    if (action === "publish_content" || action === "send_notification") {
      return { allowed: true, requiresApproval: true }; // Butuh persetujuan
    }
    if (action === "manage_requests" || action === "archive_request") {
      return { allowed: true, requiresApproval: false };
    }
    return { allowed: false, requiresApproval: false };
  }

  // Kebijakan Penyiar
  if (normalized === "announcer" || normalized === "penyiar") {
    if (action === "manage_requests" || action === "archive_request") {
      return { allowed: true, requiresApproval: false };
    }
    return { allowed: false, requiresApproval: false };
  }

  // Secara default, tolak
  return { allowed: false, requiresApproval: false };
}

// Helper sederhana untuk mengecek izin langsung tanpa memedulikan alur approval
export function hasDirectPermission(userRole: string, action: string): boolean {
  const policy = getActionPolicy(userRole, action);
  return policy.allowed && !policy.requiresApproval;
}
