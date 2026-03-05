/* ═══════════════════════════════════════════════════════════
   hooks/useTyping.ts
   TODO: tên event "typing:start" / "typing:stop" phải khớp backend
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useRef, useCallback, useEffect } from "react";
import { getSocket } from "./useSocket";

export function useTyping(conversationId: string) {
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = useRef(false);

  const start = useCallback(() => {
    const s = getSocket();
    if (!s || !conversationId) return;
    if (!isActive.current) {
      isActive.current = true;
      // TODO: event name "typing:start"
      s.emit("typing:start", { conversationId });
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      isActive.current = false;
      s.emit("typing:stop", { conversationId });
    }, 2000);
  }, [conversationId]);

  const stop = useCallback(() => {
    const s = getSocket();
    if (timer.current) clearTimeout(timer.current);
    if (isActive.current && s) {
      isActive.current = false;
      s.emit("typing:stop", { conversationId });
    }
  }, [conversationId]);

  useEffect(() => () => { stop(); }, [conversationId, stop]);

  return { startTyping: start, stopTyping: stop };
}
