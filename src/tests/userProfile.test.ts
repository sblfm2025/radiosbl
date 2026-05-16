import { describe, expect, it } from "vitest";
import { normalizeUserProfile } from "../services/userProfile.service";

const fallback = {
  email: "operator@radiosbl.go.id",
  displayName: "Operator Radio SBL",
  photoUrl: "https://example.test/avatar.png"
};

describe("user profile normalization", () => {
  it("uses Firestore profile fields when valid", () => {
    expect(
      normalizeUserProfile("uid-1", fallback, {
        email: "ria@radiosbl.go.id",
        displayName: "St. Rukiah",
        employeeId: "SBL-005",
        photoUrl: "https://example.test/ria.png",
        role: "announcer",
        active: false
      })
    ).toEqual({
      id: "uid-1",
      email: "ria@radiosbl.go.id",
      displayName: "St. Rukiah",
      employeeId: "SBL-005",
      airName: undefined,
      announcerNames: [],
      photoUrl: "https://example.test/ria.png",
      whatsapp: undefined,
      role: "announcer",
      active: false
    });
  });

  it("falls back safely when profile is missing or role is invalid", () => {
    expect(
      normalizeUserProfile("uid-2", fallback, {
        role: "owner",
        active: "yes",
        displayName: ""
      })
    ).toEqual({
      id: "uid-2",
      email: fallback.email,
      displayName: fallback.displayName,
      photoUrl: fallback.photoUrl,
      role: "public",
      active: true,
      employeeId: undefined,
      airName: undefined,
      announcerNames: [],
      whatsapp: undefined
    });
  });
});
