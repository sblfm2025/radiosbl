import { useState, useEffect, useMemo } from "react";
import { weeklyBroadcastSchedule } from "../data/radioData";
import type { BroadcastProgramSlot } from "../types/domain";
import {
  findCurrentBroadcastSlotFromSchedule
} from "../utils/scheduleClock";
import {
  formatScheduleDate,
  getActualScheduleForDate
} from "../services/scheduleSlot.service";

export function useCurrentBroadcastSlot() {
  const [now, setNow] = useState(() => new Date());
  const [scheduleSlots, setScheduleSlots] = useState<BroadcastProgramSlot[]>(weeklyBroadcastSchedule);
  const todayKey = formatScheduleDate(now);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    getActualScheduleForDate(todayKey, weeklyBroadcastSchedule)
      .then((slots) => {
        if (isMounted) {
          setScheduleSlots(slots);
        }
      })
      .catch(() => {
        if (isMounted) {
          setScheduleSlots(weeklyBroadcastSchedule);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  return useMemo(() => findCurrentBroadcastSlotFromSchedule(now, scheduleSlots), [now, scheduleSlots]);
}
