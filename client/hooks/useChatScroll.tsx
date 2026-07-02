import { useEffect, useRef, useCallback, DependencyList } from "react";

export function useChatScroll(deps: DependencyList, convId?: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isStickyRef = useRef(true);
  const disableAutoScrollRef = useRef(false);
  const isChangingChatRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null); // Quản lý timer chống leak

  // Kiểm tra dữ liệu hợp lệ để tránh cuộn khi khung chat trống
  const hasContent = deps.some((dep) => {
    if (Array.isArray(dep)) return dep.length > 0;
    if (typeof dep === "string") return dep.trim().length > 0;
    return dep != null;
  });

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth", delay = 0) => {
      const el = containerRef.current;
      if (!el || disableAutoScrollRef.current) return;

      // Xóa tác vụ cuộn cũ đang chờ (nếu có) để tránh xung đột
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }

      const runScroll = () => {
        if (!el || disableAutoScrollRef.current) return;
        const maxTop = Math.max(el.scrollHeight - el.clientHeight, 0);
        el.scrollTo({ top: maxTop, behavior });
      };

      if (delay > 0) {
        scrollTimerRef.current = window.setTimeout(runScroll, delay);
      } else {
        // Sử dụng chuẩn requestAnimationFrame để cuộn mượt theo tần số quét màn hình
        requestAnimationFrame(runScroll);
      }
    },
    []
  );

  // Dọn dẹp timer khi hook unmount
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // 1. Theo dõi thao tác cuộn của User
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      isStickyRef.current = isAtBottom;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 2. Bắt sự kiện đổi Hội thoại (Reset trạng thái dính đáy)
  useEffect(() => {
    isChangingChatRef.current = true;
    isStickyRef.current = true;
    
    // Đưa khung chat về đỉnh ngay lập tức để tạo cảm giác đổi tab mượt mà
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [convId]);

  // 3. MutationObserver xử lý cho Tin nhắn Streaming (AI gõ chữ)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      // Khi đang đổi chat, để cho Effect số 4 xử lý cuộn sau khi data về
      if (isChangingChatRef.current) return;

      if (isStickyRef.current && !disableAutoScrollRef.current && hasContent) {
        scrollToBottom("auto"); // Chat streaming cần nhạy, không dùng delay
      }
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [hasContent, scrollToBottom]);

  // 4. Xử lý cuộn khi Danh sách tin nhắn thay đổi (API trả về / User gửi)
  useEffect(() => {
    if (!hasContent) return;

    if (isChangingChatRef.current) {
      // Khi đổi chat: Chờ 100ms để layout cũ unmount và layout mới kịp render
      scrollToBottom("auto", 100);
      isChangingChatRef.current = false;
      return;
    }

    if (isStickyRef.current && !disableAutoScrollRef.current) {
      // Khi có tin nhắn mới trong cùng hội thoại: Chờ nhẹ 40ms để DOM cập nhật đủ chiều cao
      scrollToBottom("auto", 40);
    }
  }, [deps, hasContent, scrollToBottom]);

  return {
    containerRef,
    scrollToBottom,
    isStickyRef,
    disableAutoScrollRef,
  };
}
