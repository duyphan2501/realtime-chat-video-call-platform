"use client";

import { useState, useRef } from "react";
import { Conversation } from "@/types";
import { useConversationService } from "@/services";
import toast from "react-hot-toast";
import { Loader2, Camera, X } from "lucide-react";

interface EditGroupModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export default function EditGroupModal({
  conversation,
  onClose,
}: EditGroupModalProps) {
  const [name, setName] = useState(conversation.name || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    conversation.avatar || null,
  );
  const [hasAvatarChanged, setHasAvatarChanged] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const { updateGroup, isUpdatingGroup } = useConversationService();

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatar(f);
    setPreview(URL.createObjectURL(f));
    setHasAvatarChanged(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    try {
      const payload: any = {
        conversationId: conversation._id,
        name: name.trim(),
      };
      // Only include avatar if it was actually changed
      if (hasAvatarChanged) {
        payload.avatar = avatar;
      }
      await updateGroup(payload);
      onClose();
    } catch (error) {
      // Error handled by service
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-sm rounded-[2.5rem] bg-surface border border-white/5 shadow-2xl pointer-events-auto overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
            <h3 className="font-bold text-xl text-white">Edit Group</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Avatar Selection Area */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <button
                  onClick={() => imgRef.current?.click()}
                  className="w-24 h-24 rounded-4xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20 bg-[#1c1c2e] hover:border-primary transition-all group shadow-inner"
                >
                  {preview ? (
                    <img
                      src={preview}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                  ) : conversation.avatar ? (
                    <img
                      src={conversation.avatar}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <Camera
                      size={32}
                      className="text-slate-500 group-hover:text-primary transition-colors"
                    />
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </button>

                {/* Decoration badge */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary flex items-center justify-center border-4 border-surface text-white">
                  <Camera size={14} />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Click to change group photo
              </p>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Group Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-[#1c1c2e] text-white px-5 py-4 rounded-2xl outline-none border border-transparent focus:border-primary/50 transition-all text-sm font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-surface px-2 py-1 rounded-md">
                  {name.length}/50
                </span>
              </div>
            </div>

            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              hidden
              onChange={pickAvatar}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 px-8 py-6 border-t border-white/10 bg-[#1c1c2e]">
            <button
              onClick={onClose}
              disabled={isUpdatingGroup}
              className="flex-1 py-4 rounded-2xl bg-gray text-slate-300 font-bold hover:bg-[#323245] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUpdatingGroup}
              className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold transition-all active:scale-[.96] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110"
            >
              {isUpdatingGroup ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
