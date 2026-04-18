"use client";

import { FileImage, FileText, FileCode, FileArchive, Loader2, ChevronRight } from "lucide-react";
import Accordion from "./Accordion";
import { useGetInfiniteSharedContent } from "@/services"; // Hook đã viết ở bước trước
import { fmtSize } from "@/utils/chat.utils";
import { JSX } from "react";

interface DocumentsAccordionProps {
  conversationId: string;
}

// Map các format file với Icon và Màu sắc tương ứng
const FILE_ICONS: Record<string, { icon: JSX.Element; color: string; bgColor: string }> = {
  pdf: { icon: <FileText size={18} />, color: "text-red-500", bgColor: "bg-red-500/10" },
  docx: { icon: <FileText size={18} />, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  doc: { icon: <FileText size={18} />, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  xlsx: { icon: <FileText size={18} />, color: "text-green-600", bgColor: "bg-green-600/10" },
  xls: { icon: <FileText size={18} />, color: "text-green-600", bgColor: "bg-green-600/10" },
  zip: { icon: <FileArchive size={18} />, color: "text-yellow-600", bgColor: "bg-yellow-600/10" },
  rar: { icon: <FileArchive size={18} />, color: "text-yellow-600", bgColor: "bg-yellow-600/10" },
  txt: { icon: <FileText size={18} />, color: "text-slate-500", bgColor: "bg-slate-500/10" },
  default: { icon: <FileCode size={18} />, color: "text-slate-500", bgColor: "bg-slate-500/10" },
};

export default function DocumentsAccordion({ conversationId }: DocumentsAccordionProps) {
  // 1. Gọi hook lấy dữ liệu thực tế (tab="file")
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGetInfiniteSharedContent(conversationId, "file");

  // 2. Flatten dữ liệu
  const allFiles = data?.pages.flatMap((page) => page.data) || [];
  const totalFiles = data?.pages[0]?.total || 0;

  return (
    <Accordion icon={<FileText size={20} />} title="Documents">
      <div className="px-6 flex flex-col gap-4 py-3">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-slate-300" size={20} />
          </div>
        ) : (
          allFiles.map((item: any, idx: number) => {
            const doc = item.file; // Dữ liệu file từ Backend
            const fileConfig = FILE_ICONS[doc.format.toLowerCase()] || FILE_ICONS.default;

            return (
              <div
                key={doc.url+idx || idx}
                className="flex items-center gap-3 group/doc cursor-pointer"
                onClick={() => window.open(doc.url, "_blank")} // Mở file trong tab mới
              >
                {/* Icon Box */}
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/doc:scale-105 ${fileConfig.bgColor}`}
                >
                  <span className={`${fileConfig.color}`}>
                    {fileConfig.icon}
                  </span>
                </div>

                {/* File Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-slate-700 group-hover/doc:text-primary transition-colors">
                    {doc.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {fmtSize(doc.size)} • {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Nút Xem thêm / View All */}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs font-bold text-primary hover:text-primary/80 py-2 flex items-center gap-1 transition-all disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <Loader2 className="animate-spin size-3" />
            ) : (
              <>
                View more ({totalFiles - allFiles.length} files left)
                <ChevronRight size={14} />
              </>
            )}
          </button>
        )}

        {/* Trạng thái trống */}
        {!isLoading && allFiles.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-2">No documents shared</p>
        )}
      </div>
    </Accordion>
  );
}