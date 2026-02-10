"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface AnalyticsInsightsCardProps {
  heatmapData: Array<{
    day: number; // 0-6
    hour: number; // 0-23
    value: number; // engagement count
  }>;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AnalyticsInsightsCard({ heatmapData }: AnalyticsInsightsCardProps) {
  const bestTime = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return null;

    const best = heatmapData.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      heatmapData[0],
    );

    if (best.value === 0) return null;

    return {
      day: DAYS[best.day],
      hour: best.hour,
      ampm: best.hour >= 12 ? "PM" : "AM",
      displayHour: best.hour % 12 || 12,
    };
  }, [heatmapData]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
      {/* Best Time Section */}
      <div className="flex-1 w-full">
        <h3 className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wide">
          Best Time to Post
        </h3>
        {bestTime ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {bestTime.day}, {bestTime.displayHour} {bestTime.ampm}
            </span>
          </div>
        ) : (
          <div className="text-gray-400 font-medium">Not enough data yet</div>
        )}
        <p className="text-gray-400 text-sm mt-1">Based on your highest engagement periods</p>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-16 bg-gray-100"></div>

      {/* History Link Section */}
      <div className="flex-1 w-full flex flex-col md:items-end">
        <Link
          href="/history"
          className="group bg-black text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors w-full md:w-auto justify-center"
        >
          <span>View Post History</span>
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <p className="text-gray-400 text-sm mt-2 text-right">Analyze individual post performance</p>
      </div>
    </div>
  );
}
