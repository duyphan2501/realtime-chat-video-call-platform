import Accordion from "./Accordion";
import { Attachment } from "@/types";
import { fmtSize } from "@/utils/chat.utils"; // Use fmtSize from chat.utils
import { FileImage, FileText } from "lucide-react";
import { JSX } from "react";

interface DocumentsAccordionProps {
  conversationId: string;
}

// Dummy data for now, replace with actual API call
const DUMMY_DOCUMENTS: Attachment[] = [
  {
    url: "/path/to/Q4_Strategy_Roadmap.pdf",
    type: "file",
    name: "Q4_Strategy_Roadmap.pdf",
    size: 2400000, // in bytes
    format: "pdf",
    createdAt: new Date().toISOString(), // Add createdAt for dummy data
  },
  {
    url: "/path/to/User_Feedback_Report.docx",
    type: "file",
    name: "User_Feedback_Report.docx",
    size: 845000, // in bytes
    format: "docx",
    createdAt: new Date().toISOString(), // Add createdAt for dummy data
  },
];

const FILE_ICONS: Record<string, { icon: JSX.Element; color: string; bgColor: string }> = {
  pdf: { icon: <FileImage />, color: "text-red-500", bgColor: "bg-red-500/10" },
  docx: { icon: <FileText />, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  // Add more file types as needed
};

export default function DocumentsAccordion({ conversationId }: DocumentsAccordionProps) {
  const documents = DUMMY_DOCUMENTS.filter((doc) => doc.type === "file");

  return (
    <Accordion icon={<FileText />} title="Documents">
      <div className="px-6 pb-4 flex flex-col gap-3">
        {documents.map((doc) => {
          const fileIcon = FILE_ICONS[doc.format] || { icon: "insert_drive_file", color: "text-slate-500", bgColor: "bg-slate-500/10" };
          return (
            <div
              key={doc.url} // Using url as key for now, ideally should be a unique ID from backend
              className="flex items-center gap-3 group/doc cursor-pointer"
            >
              <div
                className={`h-10 w-10 rounded flex items-center justify-center shrink-0 ${
                  fileIcon.bgColor
                }`}
              >
                <span className={`material-symbols-outlined ${fileIcon.color}`}>
                  {fileIcon.icon}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium truncate group-hover/doc:text-primary transition-colors">
                  {doc.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {fmtSize(doc.size)} • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            </div>
          );
        })}
        <button className="text-xs font-semibold text-primary hover:underline py-2 text-left">
          View all files
        </button>
      </div>
    </Accordion>
  );
}
