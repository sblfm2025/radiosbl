import {
  complaints,
  announcerBreakdown,
  announcers,
  dailyInsertPrograms,
  directorProfile,
  dashboardStats,
  liveChecklist,
  modules,
  stationInfo,
  todayPrograms,
  weeklyBroadcastSchedule
} from "./radioData";
import type { AppUser } from "../types/domain";

export type DashboardSnapshot = {
  stats: typeof dashboardStats;
  programs: typeof todayPrograms;
  modules: typeof modules;
  liveChecklist: typeof liveChecklist;
  complaints: typeof complaints;
  weeklySchedule: typeof weeklyBroadcastSchedule;
  insertPrograms: typeof dailyInsertPrograms;
  announcers: typeof announcerBreakdown;
  announcerProfiles: typeof announcers;
  director: typeof directorProfile;
  station: typeof stationInfo;
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  return {
    stats: dashboardStats,
    programs: todayPrograms,
    modules,
    liveChecklist,
    complaints,
    weeklySchedule: weeklyBroadcastSchedule,
    insertPrograms: dailyInsertPrograms,
    announcers: announcerBreakdown,
    announcerProfiles: announcers,
    director: directorProfile,
    station: stationInfo
  };
}

export function getProfileSummary(user: AppUser) {
  return {
    name: user.displayName,
    subtitle: user.role === "admin" ? "Admin operasional" : "Pengguna sistem",
    role: user.role
  };
}
