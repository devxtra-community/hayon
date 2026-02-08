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

interface FollowersPieChartProps {
  data?: Record<string, number>;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}k`;
  return num.toString();
}

export default function FollowersPieChart({ data }: FollowersPieChartProps) {
  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      // Fallback data
      return [
        { name: "Mastodon", value: 0, color: platformColors.mastodon },
        { name: "Bluesky", value: 0, color: platformColors.bluesky },
        { name: "Threads", value: 0, color: platformColors.threads },
        { name: "Tumblr", value: 0, color: platformColors.tumblr },
        { name: "Facebook", value: 0, color: platformColors.facebook },
        { name: "Instagram", value: 0, color: platformColors.instagram },
      ];
    }

    return Object.entries(data).map(([platform, count]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: count,
      color: platformColors[platform] || "#94A3B8",
    }));
  }, [data]);

  const totalFollowers = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white rounded-2xl p-6 h-full flex flex-col border border-slate-100 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Follower Breakdown</h3>
        <p className="text-sm text-slate-500">
          Audience by platform <span className="mx-2">•</span>
          <span className="font-semibold text-slate-700">{formatNumber(totalFollowers)} Total</span>
        </p>
      </div>

      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="40%"
              cy="50%"
              innerRadius={0}
              outerRadius={80}
              paddingAngle={2}
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
              formatter={(value) => (
                <span className="text-slate-600 font-medium ml-1 text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
