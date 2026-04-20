"use client";

import { useState, useRef } from "react";
import type { User } from "@/types";
import { useAuthStore } from "@/store";
import { useConversationService, useSearchFriends } from "@/services";
import useDebounce from "@/hooks/useDebounce";
import { X, Camera, Search, Loader2, Check } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function CreateGroupModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  
  const searchTerm = useDebounce(query, 500);
  const { data: friends = [] } = useSearchFriends(searchTerm);
  const { createConversation, isCreatingConv } = useConversationService();

  const toggle = (u: User) =>
    setSelected((prev) =>
      prev.find((p) => p._id === u._id)
        ? prev.filter((p) => p._id !== u._id)
        : [...prev, u],
    );

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatar(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCreate = async () => {
    const participantIds = selected
      .map((s) => s._id)
      .concat(useAuthStore.getState().user?._id || "");
    await createConversation({
      type: "group",
      participantIds,
      name: name.trim(),
      avatar,
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-[460px] max-h-[90vh] flex flex-col rounded-[2.5rem] bg-[#181829] border border-white/5 shadow-2xl pointer-events-auto overflow-hidden animate-scale-in">
          
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#12121e] shrink-0">
            <h3 className="font-bold text-xl text-white">Create Group</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {/* Avatar + Group Name Input */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => imgRef.current?.click()}
                className="group relative w-20 h-20 rounded-[2rem] bg-[#1c1c2e] border-2 border-dashed border-white/10 flex items-center justify-center shrink-0 overflow-hidden hover:border-[#2b2bee]/50 transition-all"
              >
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Camera className="text-slate-500 group-hover:text-[#2b2bee] transition-colors" size={24} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Edit</span>
                </div>
              </button>

              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  placeholder="Group name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-[#1c1c2e] text-white px-5 py-4 rounded-2xl outline-none border border-transparent focus:border-[#2b2bee]/50 transition-all text-sm font-medium"
                />
                <p className="text-[10px] text-slate-500 text-right font-bold pr-1">
                  {name.length}/50
                </p>
              </div>
              <input ref={imgRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
            </div>

            {/* Selected Chips Section */}
            {selected.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Participants ({selected.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selected.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 bg-[#2b2bee]/10 border border-[#2b2bee]/20 rounded-xl animate-scale-in"
                    >
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2b2bee&color=fff&bold=true`}
                        className="w-6 h-6 rounded-lg object-cover"
                        alt=""
                      />
                      <span className="text-xs font-bold text-[#2b2bee]">{u.name.split(' ')[0]}</span>
                      <button onClick={() => toggle(u)} className="text-[#2b2bee] hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Friends List */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Invite friends..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#1c1c2e] text-white pl-12 pr-5 py-4 rounded-2xl outline-none border border-transparent focus:border-[#2b2bee]/50 transition-all text-sm"
                />
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {friends.map((f: User) => {
                  const isChecked = selected.some((s) => s._id === f._id);
                  return (
                    <div
                      key={f._id}
                      onClick={() => toggle(f)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                        isChecked 
                          ? "bg-[#2b2bee]/5 border-[#2b2bee]/20" 
                          : "hover:bg-white/5 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1c1c2e&color=64748b&bold=true`}
                          className="w-10 h-10 rounded-xl object-cover"
                          alt=""
                        />
                        <span className="text-sm font-bold text-slate-200">{f.name}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                        isChecked 
                          ? "bg-[#2b2bee] border-[#2b2bee] text-white" 
                          : "border-white/10"
                      }`}>
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}

                {friends.length === 0 && (
                  <div className="text-center py-10 opacity-40">
                    <p className="text-sm font-bold text-slate-400">No friends found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 px-8 py-6 bg-[#12121e] border-t border-white/10 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-[#282839] text-slate-300 font-bold hover:bg-[#323245] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selected.length < 1 || isCreatingConv}
              className="flex-1 py-4 rounded-2xl bg-[#2b2bee] text-white font-bold transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98]"
            >
              {isCreatingConv ? <Loader2 size={18} className="animate-spin" /> : null}
              Create Group
            </button>
          </div>
        </div>
      </div>
    </>
  );
}