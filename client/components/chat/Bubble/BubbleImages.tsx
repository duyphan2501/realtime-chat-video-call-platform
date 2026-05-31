import { Attachment } from "@/types";

const MAX_DISPLAY = 6;

type CellConfig = {
  colSpan?: string;
  rowSpan?: string;
  aspect?: string;
};

type LayoutConfig = {
  gridCols: string;
  cells: CellConfig[];
};

function getLayout(count: number): LayoutConfig {
  const n = Math.min(count, MAX_DISPLAY);
  switch (n) {
    case 1:
      // 1 ảnh: Không ép aspect ratio để hiện theo khung ảnh gốc
      return { gridCols: "grid-cols-1", cells: [{ aspect: "aspect-auto" }] };
    case 2:
      return { gridCols: "grid-cols-2", cells: [{}, {}] };
    case 3:
      return {
        gridCols: "grid-cols-3",
        cells: [{}, {}, {}],
      };
    case 4:
      return { gridCols: "grid-cols-2", cells: [{}, {}, {}, {}] };
    case 5:
      return {
        gridCols: "grid-cols-6", 
        cells: [
          { colSpan: "col-span-4", aspect: "aspect-video" }, 
          { colSpan: "col-span-2", aspect: "aspect-auto" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
        ],
      };
    default:
      return {
        gridCols: "grid-cols-6",
        cells: [
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
        ],
      };
  }
}

export default function BubbleImages({
  imgs,
  onClickIndex,
}: {
  imgs: Attachment[];
  onClickIndex: (i: number) => void;
}) {
  const safeImages = imgs.filter((img) => img?.url);
  const layout = getLayout(safeImages.length);
  const display = safeImages.slice(0, MAX_DISPLAY);
  const overflow = safeImages.length - MAX_DISPLAY;

  return (
    <div
      className={`grid gap-1 overflow-hidden rounded-xl w-full max-w-120 ${layout.gridCols}`}
    >
      {display.map((img, i) => {
        const cell = layout.cells[i] || {};
        const isOverflowCell = i === MAX_DISPLAY - 1 && overflow > 0;

        return (
          <div
            key={`${img.url}-${i}`}
            onClick={() => onClickIndex(i)}
            className={`
              relative cursor-pointer overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity
              ${cell.colSpan || ""} 
              ${cell.rowSpan || ""} 
              ${cell.aspect || "aspect-square"}
            `}
          >
            <img
              src={img.url}
              alt={`img-${i}`}
              className="h-full w-full object-cover block"
              // Đối với 1 ảnh duy nhất, ta để max-h để tránh ảnh quá dài
              style={
                safeImages.length === 1 ? { maxHeight: "500px", width: "auto" } : {}
              }
            />

            {/* Overlay số lượng ảnh còn lại */}
            {isOverflowCell && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-medium pointer-events-none">
                +{overflow}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
