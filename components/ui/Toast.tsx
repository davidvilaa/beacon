"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsMounted(true));
    });
    const timer1 = setTimeout(() => {
      setIsExiting(true);
    }, 2700);
    const timer2 = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between p-4 rounded-md shadow-xl border min-w-[280px] max-w-sm transition-all duration-300 transform ${
        !isMounted ? 'opacity-0 translate-x-8' : 
        isExiting ? 'opacity-0 translate-x-8' : 
        'opacity-100 translate-x-0'
      } ${
        toast.type === 'success' ? 'bg-zinc-900 border-green-500/50 text-green-400' :
        toast.type === 'error' ? 'bg-zinc-900 border-red-500/50 text-red-400' :
        'bg-zinc-900 border-zinc-700 text-zinc-300'
      }`}
    >
      <span className="text-sm font-medium leading-tight mt-0.5">{toast.message}</span>
      <button 
        onClick={handleClose} 
        className="ml-4 text-zinc-500 hover:text-white shrink-0 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
