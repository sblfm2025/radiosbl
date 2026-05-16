import { describe, expect, it } from "vitest";
import { distanceInMeters, isWithinRadius } from "../utils/geolocation";

describe("geolocation radius", () => {
  const office = { latitude: -3.7931, longitude: 119.6522 };

  it("calculates short distances in meters", () => {
    const nearby = { latitude: -3.7932, longitude: 119.6522 };
    expect(distanceInMeters(office, nearby)).toBeLessThan(20);
  });

  it("detects positions outside the office radius", () => {
    const farAway = { latitude: -3.78, longitude: 119.64 };
    expect(isWithinRadius(farAway, office, 100)).toBe(false);
  });
});
