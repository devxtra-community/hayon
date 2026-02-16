"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Fallback static data
const fallbackData = [
  { day: "Mon", engagement: 0, posts: 0 },
  { day: "Tue", engagement: 0, posts: 0 },
  { day: "Wed", engagement: 0, posts: 0 },
  { day: "Thu", engagement: 0, posts: 0 },
  { day: "Fri", engagement: 0, posts: 0 },
  { day: "Sat", engagement: 0, posts: 0 },
  { day: "Sun", engagement: 0, posts: 0 },
];

interface EngagementChartProps {
  data?: Array<{ _id: string; totalEngagement: number; postCount: number }>;
}

export default function EngagementChart({ data }: EngagementChartProps) {
  // Transform timeline data into chart format
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return fallbackData;

    // Map API data to chart format
    // _id is date string like "2024-02-06"
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return data
      .map((item) => {
        const date = new Date(item._id);
        const dayName = dayNames[date.getDay()];
        return {
          day: dayName,
          engagement: item.totalEngagement,
          posts: item.postCount,
        };
      })
      .slice(-7); // Last 7 days
  }, [data]);

  return (
    <div className="bg-white rounded-2xl p-8 h-full flex flex-col border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Engagement vs Posts</h3>
          <p className="text-sm text-slate-500">Last 7 Days</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 13, fontWeight: 500 }}
              dy={15}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                padding: "12px",
              }}
              cursor={{ fill: "#F8FAFC" }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "20px", top: -60 }}
              iconType="circle"
              iconSize={8}
            />

            {/* Engagement Bar */}
            <Bar
              yAxisId="left"
              dataKey="engagement"
              name="Engagement"
              fill="#2D885D"
              radius={[6, 6, 0, 0]}
              barSize={24}
            />

            {/* Posts Bar */}
            <Bar
              yAxisId="left"
              dataKey="posts"
              name="Posts"
              fill="#94A3B8"
              radius={[6, 6, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
