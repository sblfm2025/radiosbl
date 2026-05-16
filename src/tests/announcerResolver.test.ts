import { describe, expect, it } from "vitest";
import {
  findAnnouncerProfile,
  formatAnnouncerDisplay,
  getAnnouncerWorkload,
  resolveAnnouncerText
} from "../utils/announcerResolver";

describe("announcer resolver", () => {
  it("finds official profiles from air names", () => {
    expect(findAnnouncerProfile("Miah")?.fullName).toBe("Salmiah");
    expect(findAnnouncerProfile("Ria")?.fullName).toBe("St. Rukiah");
    expect(findAnnouncerProfile("Hendra")?.fullName).toBe("Muhammad Chendra Burhan");
  });

  it("splits combined announcers and external partners", () => {
    const resolved = resolveAnnouncerText("Amar & Riska / Tokoh / Komunitas");

    expect(resolved).toHaveLength(4);
    expect(resolved[0]).toMatchObject({ kind: "announcer", label: "Amar" });
    expect(resolved[1]).toMatchObject({ kind: "announcer", label: "Riska" });
    expect(resolved[2]).toMatchObject({ kind: "external", label: "Tokoh" });
    expect(resolved[3]).toMatchObject({ kind: "external", label: "Komunitas" });
  });

  it("formats display text with full names for official announcers", () => {
    expect(formatAnnouncerDisplay("Miah / Dikbud, Dispusip, Sahabat KITA")).toBe(
      "Miah (Salmiah) / Dikbud / Dispusip / Sahabat KITA"
    );
  });

  it("calculates announcer workload from weekly slots", () => {
    expect(getAnnouncerWorkload("Wiwik")).toMatchObject({
      slotCount: 5,
      totalHours: 10,
      days: ["Senin", "Selasa", "Rabu", "Sabtu", "Minggu"]
    });

    expect(getAnnouncerWorkload("Hendra")).toMatchObject({
      slotCount: 0,
      totalHours: 0,
      days: []
    });
  });
});
