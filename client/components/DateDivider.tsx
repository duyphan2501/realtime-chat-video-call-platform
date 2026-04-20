export default function DateDivider({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday =
    d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
  const label = isToday
    ? "Today"
    : isYesterday
      ? "Yesterday"
      : d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-[0.5px] bg-slate-600" />
      <span
        className="text-[11px] font-medium px-2"
        style={{ color: "var(--color-ink-4)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-[0.5px] bg-slate-600" />
    </div>
  );
}