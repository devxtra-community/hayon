"use client";

import React, { useEffect } from "react";
import { CheckCircle, Info, AlertCircle, X } from "lucide-react";
import { ToastMessage, ToastType } from "@/types/toast";

interface ToastProps extends ToastMessage {
  onClose: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const styles: Record<
    ToastType,
    {
      iconBg: string;
      iconColor: string;
      icon: React.ReactNode;
      titleColor: string;
      messageColor: string;
    }
  > = {
    success: {
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      icon: <CheckCircle className="w-5 h-5" />,
      titleColor: "text-gray-800",
      messageColor: "text-green-600",
    },
    error: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      icon: <AlertCircle className="w-5 h-5" />,
      titleColor: "text-gray-800",
      messageColor: "text-red-600",
    },
    info: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: <Info className="w-5 h-5" />,
      titleColor: "text-gray-800",
      messageColor: "text-blue-600",
    },
    warning: {
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      icon: <AlertCircle className="w-5 h-5" />,
      titleColor: "text-gray-800",
      messageColor: "text-yellow-600",
    },
  };

  const style = styles[type];

  return (
    <div className="bg-white rounded-full shadow-lg pl-4 pr-6 py-3 mb-3 min-w-96 max-w-md animate-slide-in flex items-center gap-4">
      <div
        className={`${style.iconBg} ${style.iconColor} rounded-full p-3 flex items-center justify-center flex-shrink-0`}
      >
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${style.titleColor} font-semibold text-sm leading-tight`}>{title}</p>
        <p className={`${style.messageColor} font-medium text-sm leading-tight mt-0.5`}>
          {message}
        </p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col items-end">
      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};
