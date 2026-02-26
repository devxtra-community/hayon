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
      bg: string;
      border: string;
      iconBg: string;
      iconColor: string;
      icon: React.ReactNode;
      titleColor: string;
      messageColor: string;
      accent: string;
    }
  > = {
    success: {
      bg: "bg-[oklch(0.65_0.19_160_/_0.95)]",
      border: "border-[oklch(0.55_0.19_160)]",
      iconBg: "bg-white",
      iconColor: "text-[oklch(0.65_0.19_160)]",
      icon: <CheckCircle className="w-4 h-4" />,
      titleColor: "text-white",
      messageColor: "text-white/80",
      accent: "bg-white/10",
    },
    error: {
      bg: "bg-[oklch(0.6_0.2_20_/_0.95)]",
      border: "border-[oklch(0.5_0.2_20)]",
      iconBg: "bg-white",
      iconColor: "text-[oklch(0.6_0.2_20)]",
      icon: <AlertCircle className="w-4 h-4" />,
      titleColor: "text-white",
      messageColor: "text-white/80",
      accent: "bg-white/10",
    },
    info: {
      bg: "bg-[oklch(0.6_0.17_250_/_0.95)]",
      border: "border-[oklch(0.5_0.17_250)]",
      iconBg: "bg-white",
      iconColor: "text-[oklch(0.6_0.17_250)]",
      icon: <Info className="w-4 h-4" />,
      titleColor: "text-white",
      messageColor: "text-white/80",
      accent: "bg-white/10",
    },
    warning: {
      bg: "bg-[oklch(0.75_0.15_80_/_0.95)]",
      border: "border-[oklch(0.65_0.15_80)]",
      iconBg: "bg-white",
      iconColor: "text-[oklch(0.75_0.15_80)]",
      icon: <AlertCircle className="w-4 h-4" />,
      titleColor: "text-white",
      messageColor: "text-white/80",
      accent: "bg-white/10",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`${style.bg} ${style.border} border-b-4 rounded-xl shadow-2xl p-3 mb-2 w-[calc(100vw-3rem)] sm:w-80 backdrop-blur-md animate-toast-in relative flex items-center gap-3 overflow-hidden group`}
    >
      {/* Background decorations for a premium feel */}
      <div
        className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${style.accent} blur-xl group-hover:scale-150 transition-transform duration-500`}
      ></div>
      <div
        className={`absolute -left-2 -bottom-2 w-8 h-8 rounded-full ${style.accent} blur-lg`}
      ></div>

      {/* Speech bubble icon style */}
      <div className="relative flex-shrink-0">
        <div
          className={`${style.iconBg} ${style.iconColor} rounded-full p-2 flex items-center justify-center shadow-lg relative z-10 transition-transform duration-300 group-hover:scale-110`}
        >
          {style.icon}
        </div>
        {/* The "tail" of the bubble icon */}
        <div
          className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 ${style.iconBg} rounded-sm rotate-45 z-0`}
        ></div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`${style.titleColor} font-bold text-sm leading-tight tracking-tight`}>
          {title}
        </p>
        <p
          className={`${style.messageColor} font-medium text-[11px] leading-tight mt-0.5 opacity-90`}
        >
          {message}
        </p>
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/20 p-1.5 rounded-lg -mr-1"
      >
        <X className="w-3.5 h-3.5" />
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
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            zIndex: toasts.length - index,
            transform:
              index > 0 ? `translateY(-${index * 4}px) scale(${1 - index * 0.03})` : "none",
            opacity: index > 3 ? 0 : 1,
            pointerEvents: index > 0 ? "none" : "auto",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className={index > 0 ? "absolute top-0 w-full" : "relative"}
        >
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
