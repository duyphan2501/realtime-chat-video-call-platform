/* ═══════════════════════════════════════════════════════════
   components/chat/CreateGroupModal.tsx

   TODO — backend:
   ① Search friends: userApi.getFriends() — đã load sẵn
   ② Create group: conversationApi.createGroup()
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useState, useRef, useCallback } from "react";
import type { User } from "@/types";
import { conversationApi } from "@/lib/api";
import { useConversationStore } from "@/store";

interface Props {
  friends:  User[];
  onClose:  () => void;
  onCreate: (convId: string) => void;
}

export default function CreateGroupModal({ friends, onClose, onCreate }: Props) {
  const [name,     setName]    = useState("");
  const [query,    setQuery]   = useState("");
  const [selected, setSelected]= useState<User[]>([]);
  const [avatar,   setAvatar]  = useState<File | null>(null);
  const [preview,  setPreview] = useState<string | null>(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const imgRef = useRef<HTMLInputElement>(null);
  const addConv = useConversationStore((s) => s.addConversation);

  const filtered = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.find((s) => s._id === f._id)
  );

  const toggle = (u: User) => setSelected((prev) =>
    prev.find((p) => p._id === u._id) ? prev.filter((p) => p._id !== u._id) : [...prev, u]
  );

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatar(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length < 1) return;
    setLoading(true); setError("");
    try {
      // TODO ②: tạo nhóm
      const res = await conversationApi.createGroup(
        { name: name.trim(), memberIds: selected.map((u) => u._id) },
        avatar ?? undefined
      );
      // TODO ②: kiểm tra key response — "conversation" hay "data"?
      const conv = res.conversation ?? res.data ?? res;
      addConv(conv);
      onCreate(conv._id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Tạo nhóm thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative w-full max-w-115 max-h-[85vh] flex flex-col rounded-3xl animate-scale-in pointer-events-auto overflow-hidden"
          style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-lg)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid var(--color-s3)" }}>
            <h3 className="font-bold text-base">Tạo nhóm mới</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl"
              style={{ color: "var(--color-ink-3)" }}>
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => imgRef.current?.click()}
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-dashed transition-colors"
                style={{ background: "var(--color-s2)", borderColor: "var(--color-s4)" }}
              >
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <CamIcon className="w-6 h-6" style={{ color: "var(--color-ink-4)" }} />
                )}
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tên nhóm..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ background: "var(--color-s2)", color: "var(--color-ink)" }}
                />
                <p className="text-[11px] text-right mt-1" style={{ color: "var(--color-ink-4)" }}>
                  {name.length}/50
                </p>
              </div>
              <input ref={imgRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                    style={{ background: "var(--color-brand-light)", color: "var(--color-brand)" }}
                  >
                    <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-medium">{u.name}</span>
                    <button onClick={() => toggle(u)} className="opacity-60 hover:opacity-100">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Search + list */}
            <div>
              <div className="relative mb-3">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--color-ink-4)" }} />
                <input
                  type="text"
                  placeholder="Tìm bạn bè..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm outline-none"
                  style={{ background: "var(--color-s2)" }}
                />
              </div>
              <div className="space-y-1 max-h-50 overflow-y-auto">
                {filtered.map((f) => {
                  const checked = !!selected.find((s) => s._id === f._id);
                  return (
                    <label
                      key={f._id}
                      className="flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition-colors"
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--color-s2)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(f)}
                        className="w-4 h-4 rounded accent-[#0068FF]"
                      />
                      <img
                        src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=e3e8f0&color=0068FF&bold=true&size=32`}
                        className="w-8 h-8 rounded-full object-cover"
                        alt={f.name}
                      />
                      <span className="text-sm font-medium">{f.name}</span>
                    </label>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "var(--color-ink-4)" }}>
                    Không tìm thấy
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "var(--color-danger)" }}>{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: "1px solid var(--color-s3)" }}>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-medium transition-colors"
              style={{ background: "var(--color-s2)", color: "var(--color-ink-2)" }}
            >
              Huỷ
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selected.length < 1 || loading}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--color-brand)" }}
            >
              {loading && <SpinIcon className="w-4 h-4 animate-spin" />}
              Tạo nhóm ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Icons ───────────────────────────────────────── */
const CloseIcon  = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const CamIcon    = ({ className, style }: { className: string; style?: React.CSSProperties }) => <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const SearchIcon = ({ className, style }: { className: string; style?: React.CSSProperties }) => <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>;
const SpinIcon   = ({ className }: { className: string }) => <svg className={className} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>;
