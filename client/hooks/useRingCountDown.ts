import { useCallStore } from "@/store";
import { useCallback, useEffect, useState } from "react";

export function useRingCountdown(timeoutSeconds = 30) {
  const ringStartedAt = useCallStore((s) => s.ringStartedAt);

  const getRemainingTime = useCallback(
    (startedAt: number | null) => {
      if (!startedAt) return timeoutSeconds;

      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      return Math.max(0, timeoutSeconds - elapsed);
    },
    [timeoutSeconds],
  );

  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(null));

  useEffect(() => {
    if (!ringStartedAt) {
      setTimeLeft(timeoutSeconds);
      return;
    }

    const tick = () => setTimeLeft(getRemainingTime(ringStartedAt));

    tick();
    const id = setInterval(tick, 500);

    return () => clearInterval(id);
  }, [getRemainingTime, ringStartedAt, timeoutSeconds]);

  return timeLeft;
}
