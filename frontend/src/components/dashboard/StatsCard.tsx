"use client";

import { ArrowUpRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  trend: string;
  variant?: "default" | "primary";
}

export default function StatsCard({ title, value, trend, variant = "default" }: StatsCardProps) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={`relative p-5 rounded-2xl transition-all duration-300 ${
        isPrimary ? "bg-primary text-white shadow-lg" : "bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${isPrimary ? "text-white/90" : "text-gray-500"}`}>
          {title}
        </h3>
        <div className={`p-2 rounded-full ${isPrimary ? "bg-white/20" : "bg-gray-100"}`}>
          <ArrowUpRight size={16} className={isPrimary ? "text-white" : "text-gray-600"} />
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <span className="text-4xl font-bold">{value}</span>
      </div>

      {/* Trend */}
      <p className={`text-xs ${isPrimary ? "text-white/80" : "text-gray-500"}`}>{trend}</p>
    </div>
  );
}
