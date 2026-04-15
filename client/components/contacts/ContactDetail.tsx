"use client";
import type { User } from "@/types";
import { usePresenceStore } from "@/store";
import {
  MessageSquare,
  Phone,
  Video,
  UserMinus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  contact: User;
  isFriend: boolean;
  onStartChat: (userId: string) => void;
  onUnfriend: (userId: string) => void;
}

export default function ContactDetail({
  contact,
  isFriend,
  onStartChat,
  onUnfriend,
}: Props) {
  const isOnline = usePresenceStore((s) => s.isOnline);
  const online = isOnline(contact._id);
  const [showInfo, setShowInfo] = useState(true);

  const getGenderLabel = (g?: string) => {
    if (g === "male") return "Nam";
    if (g === "female") return "Nữ";
    if (g === "other") return "Khác";
    return "—";
  };

  const formatDOB = (d?: string | Date) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  const avatarUrl =
    contact.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=e3e8f0&color=0068FF&bold=true&size=120`;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-dark-secondary!">
      {/* ── Cover / Avatar hero ── */}
      <div className="relative flex flex-col items-center pt-10 pb-6 px-6 bg-gradient-to-b from-gray-800 to-dark-secondary!">
        {/* Avatar */}
        <div className="relative mb-3">
          <img
            src={avatarUrl}
            alt={contact.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-dark-secondary! shadow-md"
          />
          {online && (
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-dark-secondary! bg-green-500" />
          )}
        </div>

        {/* Name + Status */}
        <h2 className="font-bold text-xl mb-1 text-center text-white">
          {contact.name}
        </h2>
        <p
          className={`text-sm mb-1 ${online ? "text-green-500" : "text-gray-400"}`}
        >
          {online ? "Đang hoạt động" : "Ngoại tuyến"}
        </p>
        {contact.bio && (
          <p className="text-sm text-center max-w-xs mt-1 italic text-gray-300">
            "{contact.bio}"
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5">
          {isFriend && (
            <>
              <ActionBtn
                icon={<MessageSquare className="w-5 h-5" />}
                label="Nhắn tin"
                onClick={() => onStartChat(contact._id)}
                primary
              />
              <ActionBtn
                icon={<Phone className="w-5 h-5" />}
                label="Gọi thoại"
                onClick={() => {}}
              />
              <ActionBtn
                icon={<Video className="w-5 h-5" />}
                label="Video"
                onClick={() => {}}
              />
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-dark-primary" />

      {/* ── Thông tin cá nhân ── */}
      <div className="mx-0 bg-dark-secondary!">
        <button
          className="w-full flex items-center justify-between px-5 py-4"
          onClick={() => setShowInfo((v) => !v)}
        >
          <span className="font-semibold text-sm text-white">
            Thông tin cá nhân
          </span>
          {showInfo ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showInfo && (
          <div className="px-6 pb-4 flex flex-col gap-3 max-w-sm w-full">
            <InfoRow
              label="Giới tính"
              value={getGenderLabel((contact as any).gender)}
            />
            <InfoRow
              label="Ngày sinh"
              value={formatDOB((contact as any).dob)}
            />
            <InfoRow label="Số điện thoại" value={contact.phone ?? "—"} />
            <InfoRow label="Email" value={contact.email ?? "—"} />
          </div>
        )}
      </div>

      <div className="h-2 bg-dark-primary" />

      {/* ── Hành động ── */}
      {isFriend && (
        <div className="bg-dark-secondary!">
          <button
            onClick={() => {
              if (confirm(`Huỷ kết bạn với ${contact.name}?`)) {
                onUnfriend(contact._id);
              }
            }}
            className="w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-red-500/10"
          >
            <UserMinus className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-500">
              Huỷ kết bạn
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */
function ActionBtn({
  icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all active:scale-95 min-w-[72px] ${
        primary
          ? "bg-primary text-white hover:bg-blue-600"
          : "bg-dark-gray text-gray-200 hover:bg-gray-700"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start py-1">
      <span className="text-sm text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-white break-words flex-1">
        {value}
      </span>
    </div>
  );
}
