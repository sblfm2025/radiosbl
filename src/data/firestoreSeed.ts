import {
  announcers,
  dailyInsertPrograms,
  directorProfile,
  stationInfo,
  weeklyBroadcastSchedule
} from "./radioData";
import type {
  Announcer,
  AppSettings,
  BroadcastProgram,
  BroadcastSchedule,
  StreamingSettings
} from "../types/domain";
import {
  findAnnouncerProfile,
  getAnnouncerWorkload,
  resolveAnnouncerText
} from "../utils/announcerResolver";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseTimeRange(day: string, time: string) {
  const [start, end] = time.split("-").map((part) => part.trim().replace(".", ":"));
  return {
    startsAt: `2026-${slugify(day)}T${start}:00+08:00`,
    endsAt: `2026-${slugify(day)}T${end}:00+08:00`
  };
}

export function buildAnnouncerSeed(): Announcer[] {
  return announcers.map((profile: any) => {
    const workload = getAnnouncerWorkload(profile.airName);

    return {
      id: slugify(profile.airName),
      fullName: profile.fullName,
      airName: profile.airName,
      scheduleNames: profile.scheduleNames,
      photoUrl: profile.photoUrl,
      decreeOrder: profile.decreeOrder,
      active: profile.active,
      totalDays: workload.days.length,
      totalHours: workload.totalHours,
      note: profile.note
    };
  });
}

export function buildProgramSeed(): BroadcastProgram[] {
  const mainPrograms = Array.from(
    new Map(
      weeklyBroadcastSchedule.map((slot) => [
        slot.program,
        {
          id: slugify(slot.program),
          title: slot.program,
          description: slot.description,
          defaultDurationMinutes: 120,
          category: "main" as const,
          active: true
        }
      ])
    ).values()
  );

  const insertPrograms = dailyInsertPrograms.map((slot) => ({
    id: slugify(slot.program),
    title: slot.program,
    description: slot.description,
    defaultDurationMinutes: slot.time === "10.00 - 11.30" ? 90 : 60,
    category: "insert" as const,
    active: true
  }));

  return [...mainPrograms, ...insertPrograms];
}

export function buildScheduleSeed(): BroadcastSchedule[] {
  return weeklyBroadcastSchedule.map((slot) => {
    const resolved = resolveAnnouncerText(slot.announcer);
    const announcerIds = resolved
      .filter((part) => part.kind === "announcer")
      .map((part) => slugify(part.profile.airName));
    const externalPic = resolved
      .filter((part) => part.kind === "external")
      .map((part) => part.label);
    const timeRange = parseTimeRange(slot.day, slot.time);

    return {
      id: slugify(`${slot.day}-${slot.time}-${slot.program}`),
      programId: slugify(slot.program),
      announcerId: announcerIds[0],
      announcerIds,
      externalPic,
      day: slot.day,
      timeLabel: slot.time,
      startsAt: timeRange.startsAt,
      endsAt: timeRange.endsAt,
      status: "ready"
    };
  });
}

export function buildStreamingSettingsSeed(): StreamingSettings {
  return {
    id: "main",
    stationName: stationInfo.name,
    frequency: stationInfo.frequency,
    streamUrl: stationInfo.streamUrl,
    publicStreamPage: stationInfo.publicStreamPage,
    website: stationInfo.website,
    phone: stationInfo.phone,
    socialHandle: stationInfo.socialHandle
  };
}

export function buildAppSettingsSeed(): AppSettings {
  return {
    id: "main",
    legalName: stationInfo.legalName,
    directorName: directorProfile.fullName,
    directorPosition: directorProfile.position,
    decreeNumber: directorProfile.decreeNumber,
    decreeDate: directorProfile.decreeDate,
    address: stationInfo.address,
    postalCode: stationInfo.postalCode
  };
}

export function buildFirestoreSeed() {
  return {
    announcers: buildAnnouncerSeed(),
    broadcastPrograms: buildProgramSeed(),
    broadcastSchedules: buildScheduleSeed(),
    streamingSettings: [buildStreamingSettingsSeed()],
    appSettings: [buildAppSettingsSeed()]
  };
}

export { findAnnouncerProfile };
