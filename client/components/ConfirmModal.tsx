"use client";

import { X, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-sm rounded-[2.5rem] bg-surface border border-white/5 shadow-2xl pointer-events-auto overflow-hidden animate-scale-in">
          <div className="p-8 flex flex-col items-center text-center">
            {variant === "danger" ? (
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
                <AlertCircle size={32} />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <AlertCircle size={32} />
              </div>
            )}

            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 text-[15px] leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 px-8 py-6 border-t border-white/10 bg-[#1c1c2e]">
            <button
              onClick={onCancel}
              className="flex-1 py-4 rounded-2xl bg-gray text-slate-300 font-bold hover:bg-[#323245] transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-4 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-lg ${
                variant === "danger"
                  ? "bg-red-500 shadow-red-500/20 hover:bg-red-600"
                  : "bg-primary shadow-primary/20 hover:brightness-110"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
