import { describe, expect, it } from "vitest";
import { moduleFileRules, validateFile } from "../utils/fileValidation";

describe("file validation", () => {
  it("accepts attendance selfie images", () => {
    expect(
      validateFile(
        { name: "selfie.jpg", type: "image/jpeg", size: 600_000 },
        moduleFileRules.attendance
      )
    ).toEqual({ valid: true });
  });

  it("rejects invalid attendance mime types", () => {
    expect(
      validateFile(
        { name: "recording.mp3", type: "audio/mpeg", size: 600_000 },
        moduleFileRules.attendance
      )
    ).toEqual({ valid: false, reason: "Tipe file tidak didukung." });
  });
});
