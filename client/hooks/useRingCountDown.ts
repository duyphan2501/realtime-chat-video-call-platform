import { useCallStore } from "@/store";
import { useEffect, useState } from "react";

export function useRingCountdown(timeoutSeconds = 30) {
  const ringStartedAt = useCallStore((s) => s.ringStartedAt);
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);

  useEffect(() => {
    if (!ringStartedAt) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - ringStartedAt) / 1000);
      const remaining = Math.max(0, timeoutSeconds - elapsed);
      setTimeLeft(remaining);
    };

    tick(); 
    const id = setInterval(tick, 500); // poll 500ms để bù clock drift

    return () => clearInterval(id);
  }, [ringStartedAt, timeoutSeconds]);

  return timeLeft;
}