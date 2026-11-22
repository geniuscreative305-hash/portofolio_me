"use client";

import { useState } from "react";
import type { ToastMessage, ToastType } from "@/types";

let toastSetterRef: React.Dispatch<React.SetStateAction<ToastMessage[]>> | null = null;

export function showToast(message: string, type: ToastType = "info") {
  if (!toastSetterRef) return;
  const id = Math.random().toString(36).slice(2);
  toastSetterRef((prev) => [...prev, { id, type, message }]);
  setTimeout(() => {
    toastSetterRef?.((prev) => prev.filter((t) => t.id !== id));
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  toastSetterRef = setToasts;

  const TOAST_STYLES: Record<ToastType, string> = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div key={t.id} className={`glass-card border px-4 py-3 text-sm font-medium animate-slide-up ${TOAST_STYLES[t.type]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

