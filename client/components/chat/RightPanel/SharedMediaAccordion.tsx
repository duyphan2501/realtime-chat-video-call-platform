"use client";

import { FileImage, Loader2 } from "lucide-react";
import Accordion from "./Accordion";
import { useGetInfiniteSharedContent } from "@/services"; // Giả định service của bạn nằm ở đây
import { useState } from "react";
import Lightbox from "../Lightbox";

interface SharedMediaAccordionProps {
  conversationId: string;
}

export default function SharedMediaAccordion({
  conversationId,
}: SharedMediaAccordionProps) {
  // 1. Gọi hook useInfiniteQuery
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetInfiniteSharedContent(conversationId, "media");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 2. Flatten dữ liệu từ các trang thành một mảng phẳng để dễ map
  const allMedia =
    data?.pages
      .flatMap((page) => page.data)
      .filter((item: any) => item?.file?.url) || [];
  const images = allMedia.map((item: any) => item.file);

  // 3. Tính toán số lượng còn lại cho nút hiển thị
  const totalItems = data?.pages[0]?.total || 0;
  const remainingCount = totalItems - allMedia.length;

  if (isLoading) {
    return (
      <Accordion icon={<FileImage />} title="Shared Media">
        <div className="flex justify-center p-6">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      </Accordion>
    );
  }

  return (
    <Accordion icon={<FileImage />} title="Shared Media">
      <div className="p-6">
        <div className="grid grid-cols-3 gap-2">
          {/* Render danh sách ảnh từ API */}
          {allMedia.map((item: any, index: number) => (
            <div
              key={`${item.file.url}-${index}`}
              className="aspect-square rounded-lg bg-cover bg-center bg-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundImage: `url("${item.file.url}")` }}
              role="img"
              aria-label={item.file.name || "Shared media"}
              title={item.file.name || "Shared media"}
              onClick={() => setLightboxIndex(index)}
            />
          ))}

          {/* Nút Xem thêm (+X) tự động tính toán số dư */}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="aspect-square rounded-lg bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors border border-dashed border-slate-300 disabled:cursor-not-allowed"
            >
              {isFetchingNextPage ? (
                <Loader2 className="animate-spin text-primary" size={16} />
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-600">
                    +{remainingCount}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-medium">
                    More
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Trường hợp không có media nào */}
        {allMedia.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-2">
            No shared media
          </p>
        )}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          imgs={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </Accordion>
  );
}
