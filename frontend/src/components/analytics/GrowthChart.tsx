"use client";

import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import { analyticsService } from "@/services/analytics.service";
import { Loader2 } from "lucide-react";

const PLATFORMS = [
  { id: "all", label: "Overall" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "threads", label: "Threads" },
  { id: "bluesky", label: "Bluesky" },
  { id: "mastodon", label: "Mastodon" },
  { id: "tumblr", label: "Tumblr" },
];

interface GrowthChartProps {
  initialData?: any[];
  period?: string;
  setPeriod?: (period: string) => void;
}

export default function GrowthChart({
  initialData,
  period: propPeriod,
  setPeriod: propSetPeriod,
}: GrowthChartProps) {
  const [data, setData] = useState<any[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [internalPeriod, setInternalPeriod] = useState("30d");
  const [platform, setPlatform] = useState("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const period = propPeriod || internalPeriod;
  const setPeriod = propSetPeriod || setInternalPeriod;
  useEffect(() => {
    // Skip initial fetch if we have initialData and filters are at defaults
    if (initialData && period === "30d" && platform === "all") {
      setData(initialData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await analyticsService.getGrowth(period, platform);
        setData(result || []);
      } catch (error) {
        console.error("Failed to fetch growth data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, platform, initialData]);

  return (
    <div className="bg-white rounded-[2rem] p-6 pb-12 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-black text-slate-800">Growth Over Time</h3>
          <p className="text-xs sm:text-sm text-gray-500">Total followers trend</p>
        </div>

        <div className="flex items-center justify-center sm:justify-end gap-2">
          {/* Platform Select */}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-[10px] sm:text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Period Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["7d", "30d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all ${
                  period === p
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[250px] sm:min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="_id"
                tickFormatter={(str) => {
                  try {
                    return format(parseISO(str), "MMM d");
                  } catch {
                    return str;
                  }
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                width={40}
                hide={isMobile}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={(label) => {
                  try {
                    return format(parseISO(label), "MMM d, yyyy");
                  } catch {
                    return label;
                  }
                }}
              />
              <Area
                type="monotone"
                dataKey="totalFollowers"
                stroke="#0ea5e9"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorGrowth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
