export default function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="size-10 aspect-square shrink-0 rounded-full flex items-center justify-center transition-colors text-slate-400 hover:bg-primary/20 cursor-pointer active:bg-primary/60"
    >
      {children}
    </button>
  );
}
