"use client";

import { ChevronUp } from "lucide-react";
import { JSX, useState, type ReactNode } from "react";

interface AccordionProps {
  icon: JSX.Element;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function Accordion({ icon, title, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#1c1c2d]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[#161625] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span
          className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronUp />
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
