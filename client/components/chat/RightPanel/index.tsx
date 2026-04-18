"use client";

import { useConversationStore } from "@/store/conversation.store";
import { useShallow } from "zustand/react/shallow";
import { Info, X, LogOut } from "lucide-react";
import GroupHeader from "./GroupHeader";
import MembersAccordion from "./MembersAccordion";
import SharedMediaAccordion from "./SharedMediaAccordion";
import DocumentsAccordion from "./DocumentsAccordion";
import { useGetInfiniteSharedContent } from "@/services";

interface Props {
  conversationId: string;
  onClose: () => void;
}

export default function RightPanel({ conversationId, onClose }: Props) {
  // Tối ưu selector: chỉ lấy đúng conversation cần thiết
  const conversation = useConversationStore(
    useShallow((state) => state.conversations.get(conversationId)),
  );
  const sharedFiles = useGetInfiniteSharedContent(conversationId, "file");

  const isGroup = conversation?.type === "group";

  if (!conversation) return null;

  return (
    <div className="w-full max-w-105 bg-[#0f0f18] border-l border-gray flex flex-col h-screen overflow-hidden shadow-2xl text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray px-6 py-4 bg-[#111118] shrink-0">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-[#9d9db9]" />
          <h2 className="text-base font-bold tracking-tight text-white">
            {isGroup ? "Group Info" : "Contact Info"}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg h-8 w-8 border-gray hover:bg-primary/20 hover:text-white transition-all text-slate-400 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="bg-[#111118]/50">
          <GroupHeader conversation={conversation} />
        </div>

        <div className="flex flex-col divide-y divide-gray">
          <MembersAccordion conversation={conversation} />
          <SharedMediaAccordion conversationId={conversation._id} />
          <DocumentsAccordion conversationId={conversation._id} />
        </div>

        {isGroup && (
          <div className="p-6 mt-4">
            <button className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/30 text-red-500 text-sm font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 group">
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Leave Group
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-gray text-center bg-[#0b0b14] shrink-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
          Created May 2023
        </p>
      </footer>
    </div>
  );
}
