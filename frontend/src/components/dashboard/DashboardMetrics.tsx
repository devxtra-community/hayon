"use client";

import { ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  isPrimary?: boolean;
}

function MetricCard({ title, value, isPrimary }: MetricCardProps) {
  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-200 border ${
        isPrimary
          ? "bg-[#2D885D] text-white border-transparent shadow-lg shadow-green-900/10"
          : "bg-white border-slate-100 text-[#1A1C1E] shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <p className={`text-sm font-medium ${isPrimary ? "text-white/90" : "text-slate-500"}`}>
          {title}
        </p>
        <div
          className={`p-1.5 rounded-full flex items-center justify-center ${
            isPrimary ? "bg-white/20" : "bg-[#F4F7F9]"
          }`}
        >
          <ArrowUpRight size={18} className={isPrimary ? "text-white" : "text-slate-600"} />
        </div>
      </div>

      <div>
        <h3 className="text-4xl font-bold tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

// Format large numbers: 1000 -> 1k, 1000000 -> 1M
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}k`;
  return num.toString();
}

interface DashboardMetricsProps {
  data?: {
    totalPosts: number;
    scheduled: number;
    totalAudience: number;
    totalEngagement: number;
  };
}

export default function DashboardMetrics({ data }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Posts"
        value={data ? formatNumber(data.totalPosts) : "—"}
        isPrimary={true}
      />

      <MetricCard title="Scheduled" value={data ? formatNumber(data.scheduled) : "—"} />

      <MetricCard title="Total Audience" value={data ? formatNumber(data.totalAudience) : "—"} />

      <MetricCard
        title="Total Engagement"
        value={data ? formatNumber(data.totalEngagement) : "—"}
      />
    </div>
  );
}
