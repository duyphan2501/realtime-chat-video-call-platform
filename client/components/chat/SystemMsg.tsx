export default function SystemMsg({ text }: { text: string }) {
  return (
    <div className="text-center my-4">
      <span
        className="text-xs px-3 py-2 rounded-full bg-primary/20 text-white/80 font-medium"
      >
        {text}
      </span>
    </div>
  );
}
