"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { CircleCheck, CircleX, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  stagger: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastAddedAt = useRef(0);
  const batchCounter = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const now = Date.now();
    
    // Si se añade en el mismo lote (a menos de 80ms del anterior), aumentamos el escalón
    if (now - lastAddedAt.current < 80) {
      batchCounter.current += 1;
    } else {
      batchCounter.current = 0;
    }
    lastAddedAt.current = now;

    const id = now + Math.random();
    const stagger = batchCounter.current;
    
    setToasts((prev) => [...prev, { id, message, type, stagger }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none font-[family-name:var(--font-geist-sans)]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: (id: number) => void 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Guardamos la referencia de onRemove para que el efecto nunca se reinicie por re-renders del padre
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  useEffect(() => {
    // Se ejecuta estrictamente UNA sola vez por toast al nacer
    const enterTimer = setTimeout(() => {
      setIsMounted(true);
    }, toast.stagger * 70);

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2600 + toast.stagger * 90);

    const removeTimer = setTimeout(() => {
      onRemoveRef.current(toast.id);
    }, 2900 + toast.stagger * 90);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []); // <<-- Vacío: ¡GARANTIZA que ningún render padre reinicie los temporizadores!

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemoveRef.current(toast.id), 250);
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl min-w-[300px] max-w-sm transition-all duration-300 transform ${
        !isMounted ? 'opacity-0 translate-x-8 scale-95' :
        isExiting ? 'opacity-0 translate-x-8 scale-95' :
        'opacity-100 translate-x-0 scale-100'
      } ${
        toast.type === 'success' 
          ? 'border-b-2 border-b-emerald-400' 
          : toast.type === 'error'
          ? 'border-b-2 border-b-red-400'
          : 'border-b-2 border-b-[#a8dadc]'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {toast.type === 'success' ? (
          <CircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : toast.type === 'error' ? (
          <CircleX className="w-4 h-4 text-red-400 shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-[#a8dadc] shrink-0" />
        )}
        <span className="text-sm font-medium text-zinc-200 truncate">
          {toast.message}
        </span>
      </div>

      <button 
        onClick={handleClose} 
        className="ml-2 text-zinc-500 hover:text-zinc-200 transition-colors shrink-0 p-0.5 rounded hover:bg-zinc-800"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
