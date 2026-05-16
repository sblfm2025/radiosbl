import { useState, useEffect, useMemo } from "react";
import { findCurrentBroadcastSlot } from "../utils/scheduleClock";

export function useCurrentBroadcastSlot() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return useMemo(() => findCurrentBroadcastSlot(now), [now]);
}
