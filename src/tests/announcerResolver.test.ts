import { describe, expect, it } from "vitest";
import {
  findAnnouncerProfile,
  formatAnnouncerDisplay,
  formatAirNameOnly,
  getAnnouncerWorkload,
  resolveAnnouncerText
} from "../utils/announcerResolver";

describe("announcer resolver", () => {
  it("finds official profiles from air names", () => {
    expect(findAnnouncerProfile("Miah")?.fullName).toBe("Salmiah");
    expect(findAnnouncerProfile("Ria")?.fullName).toBe("St. Rukiah");
  });

  it("splits combined announcers and external partners", () => {
    const resolved = resolveAnnouncerText("Amar & Riska / Tokoh / Komunitas");

    expect(resolved).toHaveLength(4);
    expect(resolved[0]).toMatchObject({ kind: "announcer", label: "Amar" });
    expect(resolved[1]).toMatchObject({ kind: "announcer", label: "Riska" });
    expect(resolved[2]).toMatchObject({ kind: "external", label: "Tokoh" });
    expect(resolved[3]).toMatchObject({ kind: "external", label: "Komunitas" });
  });

  it("formats display text with air names for official announcers without full names", () => {
    expect(formatAnnouncerDisplay("Miah / Dikbud, Dispusip, Sahabat KITA")).toBe(
      "Miah Jufri / Dikbud / Dispusip / Sahabat KITA"
    );
  });

  it("formats air name only for official announcers while keeping external labels", () => {
    expect(formatAirNameOnly("Miah / Dikbud, Dispusip, Sahabat KITA")).toBe(
      "Miah Jufri / Dikbud / Dispusip / Sahabat KITA"
    );
    expect(formatAirNameOnly("Amar & Riska")).toBe("Amar / Riska");
    expect(formatAirNameOnly("St. Rukiah")).toBe("Ria Finky");
  });

  it("calculates announcer workload from weekly slots", () => {
    expect(getAnnouncerWorkload("Wiwik")).toMatchObject({
      slotCount: 4,
      totalHours: 8,
      days: ["Senin", "Selasa", "Sabtu", "Minggu"]
    });
  });
});
