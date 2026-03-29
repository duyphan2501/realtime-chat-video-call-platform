
export default function BubbleText({
  content,
  bubbleBase,
}: {
  content: string;
  bubbleBase: React.CSSProperties;
}) {
  return (
    <div style={{ ...bubbleBase, padding: "8px 12px" }}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}
