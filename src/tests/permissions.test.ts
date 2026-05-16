import { describe, expect, it } from "vitest";
import { can, getRolePermissions } from "../utils/permissions";

describe("role permissions", () => {
  it("allows super admin to manage settings", () => {
    expect(can("super_admin", "settings:manage")).toBe(true);
  });

  it("keeps public users limited to complaint submission", () => {
    expect(getRolePermissions("public")).toEqual(["complaints:submit"]);
    expect(can("public", "dashboard:read")).toBe(false);
  });
});
