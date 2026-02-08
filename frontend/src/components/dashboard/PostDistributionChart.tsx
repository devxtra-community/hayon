"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const platformColors: Record<string, string> = {
  mastodon: "#6364FF",
  bluesky: "#0585FF",
  threads: "#000000",
  tumblr: "#35465C",
  facebook: "#0866FF",
  instagram: "#E4405F",
};

interface PostDistributionChartProps {
  data?: Array<{ _id: string; postCount: number }>;
}

// function formatNumber(num: number): string {
//     if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
//     if (num >= 1_000) return `${Math.round(num / 1_000)}k`;
//     return num.toString();
// }

export default function PostDistributionChart({ data }: PostDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { name: "Mastodon", value: 0, color: platformColors.mastodon },
        { name: "Bluesky", value: 0, color: platformColors.bluesky },
        { name: "Threads", value: 0, color: platformColors.threads },
        { name: "Tumblr", value: 0, color: platformColors.tumblr },
        { name: "Facebook", value: 0, color: platformColors.facebook },
        { name: "Instagram", value: 0, color: platformColors.instagram },
      ];
    }

    return data.map((item) => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.postCount,
      color: platformColors[item._id] || "#94A3B8",
    }));
  }, [data]);

  const totalPosts = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white rounded-2xl p-6 h-full flex flex-col border border-slate-100 shadow-sm">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-slate-800">Post Distribution</h3>
        <p className="text-sm text-slate-500">Total posts by platform</p>
      </div>

      <div className="flex-1 min-h-[200px] relative mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="40%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              itemStyle={{ color: "#1e293b", fontWeight: 600 }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingLeft: "20px" }}
              formatter={(value) => (
                <span className="text-slate-600 font-medium ml-1 text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total Count in Center - Nudged slightly bottom-left per user request */}
        <div
          className="absolute top-[50%] left-[30%] flex flex-col items-center justify-center pointer-events-none"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <span className="text-2xl font-bold text-slate-800 leading-none">{totalPosts}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Posts
          </span>
        </div>
      </div>
    </div>
  );
}
