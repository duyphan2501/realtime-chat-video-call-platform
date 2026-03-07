/* ═══════════════════════════════════════════════════════════
   components/chat/RightPanel.tsx

   TODO — backend:
   ① removeMember: conversationApi.removeMember()
   ② leaveGroup / dissolve: thêm endpoint vào conversationApi
   ③ Media/files: lọc từ messages đã load trong store
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useState } from "react";
import type { Conversation, User, Participant } from "@/types";
import { conversationApi } from "@/lib/api";
import { useMessageStore } from "@/store";

interface Props {
  conversation: Conversation;
  currentUser:  User;
  onClose:      () => void;
}

export default function RightPanel({ conversation: conv, currentUser, onClose }: Props) {
  const [openSection, setOpenSection] = useState<string | null>("members");
  const messages = useMessageStore((s) => s.messages[conv._id] || []);

  // TODO ③: lọc ảnh/file từ messages trong store
  const images = messages.flatMap((m) =>
    (m.attachments || []).filter((a) => a.mimetype.startsWith("image/"))
  );
  const files = messages.flatMap((m) =>
    (m.attachments || []).filter((a) => !a.mimetype.startsWith("image/"))
  );

  const isGroup  = conv.type === "group";
  const myRole   = conv.participants.find((p) => (p.user as User)?._id === currentUser._id)?.role;
  const isAdmin  = myRole === "admin" || myRole === "owner";
  const otherUser = conv.participants.find((p) => (p.user as User)?._id !== currentUser._id)?.user as User | undefined;

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Xoá thành viên này?")) return;
    try {
      // TODO ①: gọi API remove member
      await conversationApi.removeMember(conv._id, userId);
    } catch {}
  };

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden animate-slide-in"
      style={{ width: 280, borderLeft: "1px solid var(--color-s3)", background: "var(--color-surface)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-s3)" }}>
        <span className="font-semibold text-sm">Thông tin</span>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ color: "var(--color-ink-3)" }}>
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile */}
        <div className="flex flex-col items-center py-5 px-4">
          <img
            src={isGroup ? conv.avatar : otherUser?.avatar}
            alt=""
            className="w-16 h-16 rounded-full object-cover mb-3"
          />
          <p className="font-bold text-base text-center" style={{ color: "var(--color-ink)" }}>
            {isGroup ? conv.name : otherUser?.name}
          </p>
          {!isGroup && otherUser?.email && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-4)" }}>{otherUser.email}</p>
          )}
          {isGroup && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-4)" }}>
              {conv.participants.length} thành viên
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-4 px-4 pb-4" style={{ borderBottom: "1px solid var(--color-s3)" }}>
          {[
            { icon: "🔔", label: "Tắt thông báo" },
            { icon: "📌", label: "Ghim" },
            { icon: "🔍", label: "Tìm kiếm" },
          ].map((a) => (
            <button key={a.label} className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors group"
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--color-s2)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <span className="text-xl">{a.icon}</span>
              <span className="text-[10px]" style={{ color: "var(--color-ink-4)" }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Members accordion — chỉ group */}
        {isGroup && (
          <Accordion
            title="Thành viên"
            id="members"
            open={openSection === "members"}
            onToggle={(id) => setOpenSection((v) => v === id ? null : id)}
          >
            <div className="space-y-2 py-2">
              {conv.participants.map((p) => {
                const u = p.user as User;
                const isSelf = u?._id === currentUser._id;
                return (
                  <div key={p._id ?? u?._id} className="flex items-center gap-3 px-4 py-1.5">
                    <img
                      src={u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "U")}&background=e3e8f0&color=0068FF&bold=true&size=32`}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                      alt={u?.name}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-ink)" }}>
                        {u?.name} {isSelf && <span style={{ color: "var(--color-ink-4)" }}>(Bạn)</span>}
                      </p>
                      {p.role !== "member" && (
                        <span className="text-[10px] font-semibold uppercase"
                          style={{ color: p.role === "owner" ? "var(--color-warning)" : "var(--color-brand)" }}>
                          {p.role === "owner" ? "Chủ nhóm" : "Quản trị"}
                        </span>
                      )}
                    </div>
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(u._id)}
                        className="shrink-0 text-xs px-2 py-0.5 rounded-lg transition-colors"
                        style={{ color: "var(--color-danger)", background: "#FEF2F2" }}
                      >
                        Xoá
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Accordion>
        )}

        {/* Images */}
        <Accordion
          title={`Ảnh (${images.length})`}
          id="images"
          open={openSection === "images"}
          onToggle={(id) => setOpenSection((v) => v === id ? null : id)}
        >
          {images.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--color-ink-4)" }}>Chưa có ảnh</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-1">
              {images.slice(0, 12).map((img) => (
                <a key={img.url} href={img.url} target="_blank" className="aspect-square">
                  <img src={img.url} alt={img.filename} className="w-full h-full object-cover rounded-lg" />
                </a>
              ))}
            </div>
          )}
        </Accordion>

        {/* Files */}
        <Accordion
          title={`File (${files.length})`}
          id="files"
          open={openSection === "files"}
          onToggle={(id) => setOpenSection((v) => v === id ? null : id)}
        >
          {files.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--color-ink-4)" }}>Chưa có file</p>
          ) : (
            <div className="space-y-2 px-4 py-2">
              {files.map((f) => (
                <a key={f.url} href={f.url} download target="_blank"
                  className="flex items-center gap-3 p-2 rounded-xl transition-colors"
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--color-s2)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <span className="text-lg">📎</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--color-ink)" }}>{f.filename}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-ink-4)" }}>
                      {(f.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Accordion>

        {/* Danger zone */}
        <div className="p-4 space-y-2">
          {isGroup && isAdmin && (
            <DangerBtn onClick={() => {}}>
              {/* TODO ②: dissolve group API */}
              Giải tán nhóm
            </DangerBtn>
          )}
          {isGroup && (
            <DangerBtn onClick={() => {}}>
              {/* TODO ②: leave group API */}
              Rời nhóm
            </DangerBtn>
          )}
          {!isGroup && (
            <DangerBtn onClick={() => {}}>
              {/* TODO: block user API */}
              Chặn người dùng
            </DangerBtn>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */
function Accordion({
  title, id, open, onToggle, children,
}: { title: string; id: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid var(--color-s3)" }}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>{title}</span>
        <svg
          className="w-4 h-4 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", color: "var(--color-ink-4)" }}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

function DangerBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 rounded-2xl text-sm font-medium transition-colors"
      style={{ background: "#FEF2F2", color: "var(--color-danger)" }}
      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#FEE2E2"}
      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "#FEF2F2"}
    >
      {children}
    </button>
  );
}

const CloseIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
