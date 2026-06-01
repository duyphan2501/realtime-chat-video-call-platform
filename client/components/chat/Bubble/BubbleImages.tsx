import { Attachment } from "@/types";

const MAX_DISPLAY = 6;

type CellConfig = {
  colSpan?: string;
  rowSpan?: string;
  aspect?: string;
};

type LayoutConfig = {
  gridCols: string;
  width: string;
  cells: CellConfig[];
};

function getLayout(count: number): LayoutConfig {
  const n = Math.min(count, MAX_DISPLAY);

  switch (n) {
    case 1:
      return {
        gridCols: "grid-cols-1",
        width: "w-full max-w-full sm:w-fit sm:max-w-60",
        cells: [{ aspect: "" }],
      };
    case 2:
      return {
        gridCols: "grid-cols-2",
        width: "w-full max-w-full sm:max-w-60",
        cells: [{}, {}],
      };
    case 3:
      return {
        gridCols: "grid-cols-2",
        width: "w-full max-w-full sm:max-w-64",
        cells: [{ colSpan: "col-span-2", aspect: "aspect-video" }, {}, {}],
      };
    case 4:
      return {
        gridCols: "grid-cols-2",
        width: "w-full max-w-full sm:max-w-64",
        cells: [{}, {}, {}, {}],
      };
    case 5:
      return {
        gridCols: "grid-cols-6",
        width: "w-full max-w-full sm:max-w-72",
        cells: [
          { colSpan: "col-span-4", aspect: "aspect-video" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
          { colSpan: "col-span-2", aspect: "aspect-square" },
        ],
      };
    default:
      return {
        gridCols: "grid-cols-6",
        width: "w-full max-w-full sm:max-w-72",
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
  const isSingleImage = safeImages.length === 1;

  return (
    <div
      className={`grid max-w-full gap-1 overflow-hidden rounded-xl ${layout.width} ${layout.gridCols}`}
    >
      {display.map((img, i) => {
        const cell = layout.cells[i] || {};
        const isOverflowCell = i === MAX_DISPLAY - 1 && overflow > 0;

        return (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={() => onClickIndex(i)}
            className={`
              relative overflow-hidden bg-gray-200 transition-opacity hover:opacity-90
              ${cell.colSpan || ""}
              ${cell.rowSpan || ""}
              ${cell.aspect || "aspect-square"}
            `}
          >
            <img
              src={img.url}
              alt={`img-${i}`}
              className={
                isSingleImage
                  ? "block max-h-60 w-full object-contain sm:w-auto sm:max-w-60"
                  : "block h-full w-full object-cover"
              }
            />

            {isOverflowCell && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-medium text-white">
                +{overflow}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
