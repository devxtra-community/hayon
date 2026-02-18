"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { ToastContainer } from "@/components/Toast";
import { ToastMessage, ToastType } from "@/types/toast";

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [{ id, type, title, message }, ...prev]);
  };

  const closeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  };

  useEffect(() => {
    const handleRateLimit = (event: any) => {
      const { retryAfter, message } = event.detail;
      showToast(
        "error",
        "Whoa, slow down!",
        `${message} Please try again in ${formatDuration(retryAfter)}.`,
      );
    };

    window.addEventListener("app:error:ratelimit", handleRateLimit);
    return () => window.removeEventListener("app:error:ratelimit", handleRateLimit);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
