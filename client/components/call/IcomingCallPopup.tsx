"use client";

import { useState, useEffect } from "react";
import {
  VideoIcon,
  PhoneOffIcon,
  VolumeXIcon,
  BanIcon,
  MessageSquareIcon,
} from "lucide-react";
import { useCallStore } from "@/store";

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "accepted"
  | "ended"
  | "missed"
  | "rejected";

export default function IncomingCallPopup() {
  const status = useCallStore((s) => s.status);
  const setStatus = useCallStore((s) => s.setStatus);

  useEffect(() => {
    if (status !== "ringing") {
      const t = setTimeout(() => {
        setStatus("idle");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [status, setStatus]);

  if (status === "idle") return null;

  const statusLabel: Partial<Record<CallStatus, string>> = {
    ringing: "Incoming Video Call...",
    calling: "Calling...",
    accepted: "Connecting...",
    connected: "Connected",
    rejected: "Call Rejected",
    ended: "Call Ended",
    missed: "Missed Call",
  };

  const labelColor: Partial<Record<CallStatus, string>> = {
    ringing: "text-[#2b2bee] animate-pulse",
    calling: "text-[#2b2bee] animate-pulse",
    accepted: "text-green-500 animate-pulse",
    connected: "text-green-500",
    rejected: "text-red-500",
    ended: "text-slate-400",
    missed: "text-amber-500",
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div
          className={`
            w-full max-w-105
            bg-[#101022]
            border border-slate-800
            rounded-2xl shadow-2xl overflow-hidden
            transition-all duration-300
            ${status !== "ringing" ? "opacity-70 scale-95" : "opacity-100 scale-100"}
          `}
        >
          {/* Avatar section */}
          <div className="flex justify-center pt-10">
            <div className="relative size-32">
              <>
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping [animation-duration:1.5s]" />
                <span className="absolute inset-0 rounded-full scale-110 bg-primary/20" />
                <span className="absolute inset-0 scale-125 rounded-full bg-primary/10 animate-ping [animation-duration:2s] [animation-delay:0.3s]" />
              </>
              {/* Avatar */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC24lfGzrs-a5tPV0Yyc8KL4I0fYxuR91eHoJMrML0eqC68UGHriJWwFtbwLOnUPnzN0TPIYLvUk7PePItGBPtQbUnnM2bcDq8yo2n28XH5EZ12yo2GiqYuPjzzCDT6m_Rsf5LnghmgBd3lQtiUNZ6TN6CchiZmGV1WypKKQYcN5UIINFKah-49MW_U0Px6DuGgVuimTuIxvusnrDEB6dpBEqz02zhLQ6ZXbauW9s3zMZAtH2uf7XjzuRn8X1j-bRzasSYqOJ3OtYaD"
                alt="John Doe"
                className="relative z-10 size-32 rounded-full object-cover border-4 border-[#111118] shadow-xl"
              />
              {/* Badge */}
              <span className="absolute bottom-0 right-0 z-20 bg-primary text-white p-1.5 rounded-full border-2 border-[#111118]">
                <VideoIcon size={14} />
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col items-center px-8 pt-6 pb-3">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              John Doe
            </h3>
            <p
              className={`font-medium mt-1 text-sm ${labelColor[status] ?? "text-slate-400"}`}
            >
              {statusLabel[status] ?? ""}
            </p>
          </div>

          {/* Decline / Accept */}
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <button
                  onClick={() => status === "ringing" && setStatus("rejected")}
                  disabled={status !== "ringing"}
                  className="size-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PhoneOffIcon size={26} />
                </button>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Decline
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <button
                  onClick={() => status === "ringing" && setStatus("accepted")}
                  disabled={status !== "ringing"}
                  className="size-14 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <VideoIcon size={26} />
                </button>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Accept
                </span>
              </div>
            </div>
          </div>

          {/* Quick message */}
          <div className="px-6 pb-6 pt-0">
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#1c1c33] border border-gray">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-white text-sm font-bold">
                    Can&apos;t talk right now?
                  </p>
                  <p className="text-slate-400 text-xs">
                    Send a quick message instead
                  </p>
                </div>
                <button
                  onClick={() => status === "ringing" && setStatus("missed")}
                  disabled={status !== "ringing"}
                  className="bg-primary text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-[#2020cc] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquareIcon size={12} />
                  Message
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#18182e] py-3 px-6 border-t border-slate-800 flex justify-center gap-8">
            <button className="text-slate-400 cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 text-xs">
              <VolumeXIcon size={16} />
              Mute
            </button>
            <button className="text-slate-400 cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 text-xs">
              <BanIcon size={16} />
              Ignore
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
