export default function ControlButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 group">
      <button
        onClick={onClick}
        className={`flex items-center justify-center rounded-2xl h-14 w-14 transition-all border ${
          active
            ? "bg-white/20 border-white/20"
            : "bg-white/5 hover:bg-white/10 border-white/10"
        } text-white`}
      >
        {icon}
      </button>
      <span className="text-[10px] font-bold uppercase text-[#9d9db9] group-hover:text-white">
        {label}
      </span>
    </div>
  );
}