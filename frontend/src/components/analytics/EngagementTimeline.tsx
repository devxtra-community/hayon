"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface EngagementTimelineProps {
  data: Array<{
    _id: string; // date string YYYY-MM-DD
    totalEngagement: number;
    postCount: number;
  }>;
}

export default function EngagementTimeline({ data }: EngagementTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 h-[400px] flex items-center justify-center text-gray-400">
        No data available for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Engagement Overview</h3>
        {/* Legend / Info could go here */}
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#318D62" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#318D62" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
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
              tick={{ fill: "#6B7280", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelFormatter={(label) => format(parseISO(label), "MMMM d, yyyy")}
            />
            <Area
              type="monotone"
              dataKey="totalEngagement"
              stroke="#318D62"
              fillOpacity={1}
              fill="url(#colorEngagement)"
              strokeWidth={3}
              activeDot={{ r: 6, fill: "#318D62", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
