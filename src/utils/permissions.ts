import type { Permission, UserRole } from "../types/domain";

const rolePermissions: Record<UserRole, Permission[]> = {
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
    "radioboss:manage",
    "complaints:submit",
    "complaints:manage",
    "ai:use",
    "settings:manage"
  ],
  admin: [
    "dashboard:read",
    "users:manage",
    "attendance:manage",
    "schedule:read",
    "schedule:manage",
    "coverage:manage",
    "live_ob:manage",
    "radioboss:manage",
    "complaints:manage",
    "ai:use"
  ],
  leader: [
    "dashboard:read",
    "attendance:manage",
    "schedule:read",
    "coverage:manage",
    "live_ob:manage",
    "complaints:manage",
    "ai:use"
  ],
  announcer: [
    "dashboard:read",
    "attendance:self",
    "schedule:read",
    "schedule:swap",
    "ai:use"
  ],
  reporter: [
    "dashboard:read",
    "attendance:self",
    "schedule:read",
    "coverage:manage",
    "ai:use"
  ],
  operator: [
    "dashboard:read",
    "attendance:self",
    "schedule:read",
    "live_ob:manage",
    "radioboss:manage"
  ],
  employee: ["dashboard:read", "attendance:self", "schedule:read"],
  public: ["complaints:submit"]
};

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role];
}

export function can(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
