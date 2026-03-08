export default function SystemMsg({ text }: { text: string }) {
  return (
    <div className="text-center my-2">
      <span
        className="text-xs px-3 py-1 rounded-full"
        style={{ background: "var(--color-s3)", color: "var(--color-ink-3)" }}
      >
        {text}
      </span>
    </div>
  );
}
