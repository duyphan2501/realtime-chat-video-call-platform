import {
  selectIsOnline,
  useConversationStore,
  usePresenceStore,
} from "@/store";
import { Conversation, User } from "@/types";
import {
  fmtTime,
  getConvAvatar,
  getConvName,
  getOtherId,
  getPreview,
} from "@/utils/chat.utils";

interface ConversationItemProps {
  conv: Conversation;
  currentUser: User | null;
  isActive: boolean;
  onSelect: (conId: string) => void;
}

const ConversationItem = ({
  conv,
  currentUser,
  isActive,
  onSelect,
}: ConversationItemProps) => {
  const name = getConvName(conv, currentUser);
  const avatar = getConvAvatar(conv, currentUser);
  const isOnline = usePresenceStore(
    selectIsOnline(getOtherId(conv, currentUser)),
  );
  return (
    <div
      key={conv._id}
      onClick={() => onSelect(conv._id)}
      className={`relative flex items-center hover:bg-primary/30 transition gap-3 px-4 py-3 cursor-pointer ${isActive ? " bg-primary/30" : ""}`}
    >
      {isActive && (
        <div className="min-w-1 h-full bg-primary absolute left-0"></div>
      )}
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={
            avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e3e8f0&color=0068FF&bold=true&size=40`
          }
          alt={name}
          className="w-11 h-11 rounded-full object-cover"
        />
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: "var(--color-online)" }}
          />
        )}
        {conv.type === "group" && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            {conv.participants.length}
          </span>
        )}
      </div>

      {/* Info */}
      <div className={`flex-1 min-w-0 ${conv.unreadCount > 0 ? "font-semibold text-white" : "text-white/80"}`}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-sm truncate text-white">
            {name}
          </span>
          {conv.lastMessage && (
            <span
              className="text-[11px] ml-2 shrink-0"
            >
              {fmtTime(conv.updatedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-xs truncate"
            
          >
            {getPreview(conv, currentUser)}
          </span>
          {conv.unreadCount > 0 && (
            <span
              className="ml-2 min-w-4.5 h-4.5 flex items-center justify-center rounded-full text-white font-bold shrink-0 px-1"
              style={{ background: "var(--color-primary)", fontSize: 10 }}
            >
              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
