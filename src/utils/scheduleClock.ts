import {
  dailyInsertPrograms,
  weeklyBroadcastSchedule,
  type BroadcastProgramSlot
} from "../data/radioData";

export type CurrentBroadcastSlot =
  | {
      type: "main";
      label: "Program Utama";
      day: string;
      time: string;
      title: string;
      description: string;
      announcer: string;
    }
  | {
      type: "insert";
      label: "Program Sisipan";
      day: string;
      time: string;
      title: string;
      description: string;
      announcer: string;
    }
  | {
      type: "offair";
      label: "Off Air";
      day: string;
      time: string;
      title: string;
      description: string;
      announcer: string;
    };

const dayNames = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu"
];

function parseClock(value: string): number {
  const [hour, minute] = value.trim().replace(".", ":").split(":").map(Number);
  return hour * 60 + minute;
}

export function parseTimeRangeMinutes(time: string) {
  const [start, end] = time.split("-").map((part) => parseClock(part));
  return { start, end };
}

export function getIndonesianDay(date: Date): string {
  return dayNames[date.getDay()];
}

export function getMinutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isWithinTimeRange(minutes: number, time: string): boolean {
  const { start, end } = parseTimeRangeMinutes(time);
  return minutes >= start && minutes < end;
}

function toMainSlot(slot: BroadcastProgramSlot): CurrentBroadcastSlot {
  return {
    type: "main",
    label: "Program Utama",
    day: slot.day,
    time: slot.time,
    title: slot.program,
    description: slot.description,
    announcer: slot.announcer
  };
}

export function findCurrentBroadcastSlot(date = new Date()): CurrentBroadcastSlot {
  return findCurrentBroadcastSlotFromSchedule(date, weeklyBroadcastSchedule);
}

export function findCurrentBroadcastSlotFromSchedule(
  date = new Date(),
  schedule: BroadcastProgramSlot[] = weeklyBroadcastSchedule
): CurrentBroadcastSlot {
  const day = getIndonesianDay(date);
  const minutes = getMinutesOfDay(date);

  const mainSlot = schedule.find(
    (slot) => slot.day === day && isWithinTimeRange(minutes, slot.time)
  );

  if (mainSlot) {
    return toMainSlot(mainSlot);
  }

  const insertSlot = dailyInsertPrograms.find((slot) =>
    isWithinTimeRange(minutes, slot.time)
  );

  if (insertSlot) {
    return {
      type: "insert",
      label: "Program Sisipan",
      day,
      time: insertSlot.time,
      title: insertSlot.program,
      description: insertSlot.description,
      announcer: insertSlot.pic
    };
  }

  return {
    type: "offair",
    label: "Off Air",
    day,
    time: "23.00 - 05.00",
    title: "Jeda Siaran",
    description: "Siaran utama dan playlist harian akan kembali pada pukul 05.00 WITA.",
    announcer: "Radio Suara Bumi Lasinrang"
  };
}
