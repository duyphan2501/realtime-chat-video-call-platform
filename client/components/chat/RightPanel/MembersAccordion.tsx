"use client";

import { useEffect, useMemo, useState } from "react";
import Accordion from "./Accordion";
import { Conversation, Participant, User } from "@/types";
import { Ellipsis, Search, Users } from "lucide-react";
import { getAvatar } from "@/utils/user.utils";

interface MembersAccordionProps {
  conversation: Conversation;
}

const STATUS_DOT: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-slate-400",
  busy: "bg-yellow-500",
};

const ROLE_BADGE: Record<
  Participant["role"],
  { label: string; className: string } | null
> = {
  owner: { label: "Owner", className: "bg-primary/10 text-primary" },
  admin: { label: "Admin", className: "bg-amber-500/10 text-amber-500" },
  member: null,
};

const actions = [
  { label: "View Profile", onClick: () => {} },
  { label: "Send Message", onClick: () => {} },
  { label: "Make Admin", onClick: () => {} },
  { label: "Remove from Group", onClick: () => {} },
];

export default function MembersAccordion({
  conversation,
}: MembersAccordionProps) {
  if (conversation.type === "direct") {
    return null; // Don't show members accordion for direct messages
  }

  const [query, setQuery] = useState("");
  const [showActions, setShowActions] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    return conversation.participants.filter((p) =>
      p.user.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [conversation.participants, query]);

  const handleToggleActions = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowActions(showActions === id ? null : id);
  };

  useEffect(() => {
    const handleClose = () => setShowActions(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  return (
    <Accordion
      icon={<Users />}
      title={`Members (${conversation.participants.length})`}
      defaultOpen
    >
      <div className="px-4 pb-4">
        {/* Search */}
        <div className="px-2 py-2 mb-2">
          <label className="flex items-center bg-gray rounded-lg h-10 px-3 gap-2 border border-transparent focus-within:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              <Search />
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500 outline-none"
              placeholder="Find a member..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {/* List */}
        <div className="flex flex-col gap-1">
          {filteredMembers.map((participant) => {
            const badge = ROLE_BADGE[participant.role];
            return (
              <div
                key={participant.user._id}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1c1c2d] transition-colors group/item"
              >
                <div className="relative">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 shadow-sm"
                    style={{
                      backgroundImage: `url("${getAvatar(participant.user)}")`,
                    }}
                    role="img"
                    aria-label={participant.user.name}
                  />
                  {/* Assuming User has an actual status field */}
                  {/* {participant.user.status && ( 
                    <div 
                      className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white dark:border-[#111118] ${STATUS_DOT[participant.user.status]}`} 
                    /> 
                  )} */}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {participant.user.name}
                    </p>
                    {badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {/* <p className="text-[11px] text-slate-400">{member.statusText}</p> */}
                </div>
                <span
                  className="material-symbols-outlined text-slate-300 cursor-pointer transition-opacity p-1 rounded-full hover:bg-gray active:bg-gray/80 relative"
                  onClick={(e) => handleToggleActions(e, participant.user._id)}
                >
                  <Ellipsis />
                  {showActions === participant.user._id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-gray rounded-lg shadow-lg py-1 z-10 cursor-pointer">
                      {actions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            action.onClick();
                            setShowActions(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-primary/30 transition-colors z-20"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* <button className="w-full mt-4 text-xs font-semibold text-primary hover:underline py-2"> 
          View all {conversation.participants.length} members 
        </button> */}
      </div>
    </Accordion>
  );
}
