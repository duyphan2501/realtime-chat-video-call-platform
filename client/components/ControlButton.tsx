"use client";

import { ReactNode } from "react";

export default function ControlButton({
  icon,
  activeIcon,
  label = "",
  active = false,
  onClick,
  variant = "default",
  disabled = false,
}: {
  icon: ReactNode;
  activeIcon?: ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}) {
  const isDanger = variant === "danger";

  // Group common classes in one place for cleanliness
  const baseStyles =
    "relative flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-2xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95";
  const disabledStyles = "opacity-40 cursor-not-allowed pointer-events-none";

  // Color logic
  const idleStyles =
    "bg-white/5 border-white/8 text-white/50 hover:bg-white/10 hover:border-white/15 hover:text-white/80";
  const activeStyles =
    "bg-indigo-500/20 border-indigo-400/50 text-indigo-300 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)] hover:bg-indigo-500/30 hover:border-indigo-400/70";
  const dangerStyles =
    "bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 hover:text-red-300";

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        aria-label={label}
        className={`
          ${baseStyles}
          ${disabled ? disabledStyles : ""}
          ${isDanger ? dangerStyles : active ? activeStyles : idleStyles}
        `}
      >
        {active && activeIcon ? activeIcon : icon}

        {/* Active dot indicator */}
        {active && !isDanger && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
        )}
      </button>

      {label && (
        <span
          className={`
            max-w-16 truncate text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors uppercase
            ${active && !isDanger ? "text-indigo-300/80" : "text-white/25 group-hover:text-white/50"}
          `}
        >
          {label}
        </span>
      )}
    </div>
  );
}
