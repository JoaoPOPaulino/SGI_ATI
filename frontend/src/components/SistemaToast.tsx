import React, { createContext, useContext, useState, useCallback } from "react";
import { Check, AlertTriangle, Info, XCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <Check size={16} className="text-emerald-500 shrink-0" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  info: <Info size={16} className="text-blue-500 shrink-0" />,
};

const bgMap: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50",
  error: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};

const textMap: Record<ToastType, string> = {
  success: "text-emerald-800",
  error: "text-red-800",
  warning: "text-amber-800",
  info: "text-blue-800",
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 border rounded-xl shadow-lg animate-slide-up ${bgMap[t.type]}`}
          >
            {iconMap[t.type]}
            <p className={`text-xs font-semibold flex-1 ${textMap[t.type]}`}>
              {t.message}
            </p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-outline hover:text-on-surface shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}
