"use client";
import { useEffect, useRef } from "react";
import { useCallStore } from "@/store";

// Bạn cần chuẩn bị các file audio này trong thư mục /public/sounds/
const SOUNDS = {
  RINGING: "/sounds/incoming-call.mp3", // Tiếng chuông reo khi có người gọi đến
  DIALING: "/sounds/dialing.mp3",      // Tiếng "tút tút" khi mình gọi cho người ta
  END:     "/sounds/call-end.mp3",     // Tiếng "tút" ngắn khi kết thúc cuộc gọi
};

export function useAudioFeedback() {
  const status = useCallStore((s) => s.status);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (src: string, loop: boolean = false) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(src);
    audio.loop = loop;
    audio.play().catch(() => console.log("User interaction required for audio"));
    audioRef.current = audio;
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  useEffect(() => {
    switch (status) {
      case "ringing":
        // Có người gọi đến -> Phát nhạc chuông lặp lại
        playSound(SOUNDS.RINGING, true);
        break;

      case "calling":
        // Mình đang gọi người ta -> Phát tiếng tút tút lặp lại
        playSound(SOUNDS.DIALING, true);
        break;

      case "connected":
        // Đã kết nối -> Ngắt mọi âm thanh chờ
        stopSound();
        break;

      case "ended":
        // Kết thúc -> Phát âm thanh báo hiệu rồi ngắt
        playSound(SOUNDS.END, false);
        setTimeout(stopSound, 2000);
        break;

      case "idle":
        stopSound();
        break;
    }

    return () => stopSound();
  }, [status]);

  return { stopSound };
}
