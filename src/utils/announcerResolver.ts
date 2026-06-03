import {
  announcers,
  weeklyBroadcastSchedule,
  type AnnouncerProfile,
  type BroadcastProgramSlot
} from "../data/radioData";

export type ResolvedAnnouncerPart =
  | {
      kind: "announcer";
      label: string;
      profile: AnnouncerProfile;
    }
  | {
      kind: "external";
      label: string;
    };

export type ResolvedAnnouncerSlot = {
  id: string;
  fullName: string;
  airName: string;
  displayName: string;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function splitPicText(value: string): string[] {
  return value
    .split(/\s*(?:\/|&|,)\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function findAnnouncerProfile(name: string): AnnouncerProfile | null {
  const needle = normalize(name);

  return (
    announcers.find((profile: AnnouncerProfile) =>
      [profile.fullName, profile.airName, ...profile.scheduleNames].some(
        (candidate) => normalize(candidate) === needle
      )
    ) ?? null
  );
}

export function resolveAnnouncerText(value: string): ResolvedAnnouncerPart[] {
  return splitPicText(value).map((label) => {
    const profile = findAnnouncerProfile(label);

    if (profile) {
      return {
        kind: "announcer",
        label,
        profile
      };
    }

    return {
      kind: "external",
      label
    };
  });
}

export function resolveAnnouncerFromSlot(value: string): ResolvedAnnouncerSlot | null {
  const resolved = resolveAnnouncerText(value).find(
    (part): part is Extract<ResolvedAnnouncerPart, { kind: "announcer" }> => part.kind === "announcer"
  );

  if (!resolved) return null;

  return {
    id: resolved.profile.id ?? resolved.profile.airName,
    fullName: resolved.profile.fullName,
    airName: resolved.profile.airName,
    displayName: formatAirNameOnly(resolved.profile.airName)
  };
}

export function formatAnnouncerDisplay(value: string): string {
  return formatAirNameOnly(value);
}

export function formatAirNameOnly(value: string): string {
  return resolveAnnouncerText(value)
    .map((part) => {
      if (part.kind !== "announcer") return part.label;

      const rawAirName = part.profile.airName.toLowerCase();
      if (rawAirName === "miah") return "Miah Jufri";
      if (rawAirName === "ria") return "Ria Finky";
      if (rawAirName === "rena") return part.profile.fullName;
      if (rawAirName === "wiwik") return part.profile.fullName;

      return toTitleCase(part.profile.airName);
    })
    .join(" / ");
}

export function getScheduleSlotsForAnnouncer(
  airName: string
): BroadcastProgramSlot[] {
  const profile = findAnnouncerProfile(airName);
  const names = profile ? [profile.airName, ...profile.scheduleNames] : [airName];

  return weeklyBroadcastSchedule.filter((slot) =>
    resolveAnnouncerText(slot.announcer).some(
      (part) =>
        part.kind === "announcer" &&
        names.some((name) => part.profile.airName === name || part.label === name)
    )
  );
}

export function getAnnouncerWorkload(airName: string) {
  const slots = getScheduleSlotsForAnnouncer(airName);
  const days = Array.from(new Set(slots.map((slot) => slot.day)));

  return {
    slotCount: slots.length,
    totalHours: slots.length * 2,
    days,
    slots
  };
}
