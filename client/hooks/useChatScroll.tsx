import { useEffect, useRef, useCallback } from "react";

export function useChatScroll(deps: any[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isStickyRef = useRef(true);
  const disableAutoScrollRef = useRef(false);
  const firstRenderRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el || disableAutoScrollRef.current) return;

    // Sử dụng setTimeout 0 để đẩy việc cuộn vào cuối hàng đợi event loop
    // giúp trình duyệt có thời gian tính toán lại scrollHeight chuẩn xác nhất
    setTimeout(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    }, 0);
  }, []);

  // 1. Theo dõi user cuộn
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      // Tăng ngưỡng sai số lên 150px để nhạy hơn
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      isStickyRef.current = isAtBottom;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 2. Optimized MutationObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      if (isStickyRef.current && !disableAutoScrollRef.current) {
        // Use "auto" on mutation to stick closely to expanding content
        scrollToBottom("auto");
      }
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true, // Important for streaming/typing messages
    });

    return () => observer.disconnect();
  }, [scrollToBottom]);

  // 3. Handle when deps change (New messages added to array)
  useEffect(() => {
    if (firstRenderRef.current) {
      scrollToBottom("auto");
      firstRenderRef.current = false;
      return;
    }

    if (isStickyRef.current && !disableAutoScrollRef.current) {
      // With long messages, "smooth" sometimes gets interrupted, "auto" is more reliable
      scrollToBottom("auto");
    }
  }, [deps, scrollToBottom]); // Add scrollToBottom to deps

  return {
    containerRef,
    scrollToBottom,
    isStickyRef,
    disableAutoScrollRef,
  };
}
