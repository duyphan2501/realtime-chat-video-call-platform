import { Attachment } from "@/types";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

export default function Lightbox({
  imgs,
  index,
  onClose,
  onNavigate,
}: {
  imgs: Attachment[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white opacity-80 hover:opacity-100"
        onClick={onClose}
      >
        <XIcon className="w-6 h-6" />
      </button>

      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm opacity-70">
        {index + 1} / {imgs.length}
      </span>

      {imgs.length > 1 && (
        <button
          className="absolute left-4 text-white opacity-80 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index > 0 ? index - 1 : imgs.length - 1);
          }}
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>
      )}

      <img
        src={imgs[index].url}
        alt={imgs[index].name}
        className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {imgs.length > 1 && (
        <button
          className="absolute right-4 text-white opacity-80 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index < imgs.length - 1 ? index + 1 : 0);
          }}
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      )}

      <div className="absolute bottom-4 flex gap-2">
        {imgs.map((img, i) => (
          <img
            key={img.url}
            src={img.url}
            alt={img.name}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(i);
            }}
            className="w-12 h-12 object-cover rounded-lg cursor-pointer transition-opacity"
            style={{ opacity: i === index ? 1 : 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}
