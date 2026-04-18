"use client";

import { useAuthService } from "@/services";
import { LogOut, User } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  onClose: () => void;
  onViewProfile: () => void;
}

const SettingsPopover = ({ onClose, onViewProfile }: Props) => {
  const { logout } = useAuthService();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Tự động đóng khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-2 w-60 bg-dark-secondary! rounded-lg shadow-xl text-white p-2 z-50 animate-fade-in-up"
    >
      <ul className="space-y-1">
        <li>
          <button
            onClick={onViewProfile}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-200 hover:bg-white/10 transition-colors"
          >
            <User size={18} />
            <span>Thông tin tài khoản</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default SettingsPopover;
