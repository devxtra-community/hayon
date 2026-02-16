"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Image from "next/image";

const emeraldShades = [
  "#064e3b", // 900
  "#065f46", // 800
  "#047857", // 700
  "#059669", // 600
  "#10b981", // 500
  "#34d399", // 400
  "#6ee7b7", // 300
  "#a7f3d0", // 200
  "#d1fae5", // 100
];

interface FollowersPieChartProps {
  data?: Record<string, number>;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}k`;
  return num.toString();
}

export default function FollowersPieChart({ data }: FollowersPieChartProps) {
  const { chartData, totalFollowers } = useMemo(() => {
    const rawData =
      !data || Object.keys(data).length === 0
        ? [
            { name: "Mastodon", value: 320, key: "mastodon" },
            { name: "Bluesky", value: 850, key: "bluesky" },
            { name: "Threads", value: 420, key: "threads" },
            { name: "Tumblr", value: 150, key: "tumblr" },
            { name: "Facebook", value: 1200, key: "facebook" },
            { name: "Instagram", value: 1800, key: "instagram" },
          ]
        : Object.entries(data)
            .filter(([_, count]) => count > 0) // Filter out 0 value platforms for the chart
            .map(([platform, count]) => ({
              name: platform.charAt(0).toUpperCase() + platform.slice(1),
              value: count,
              key: platform.toLowerCase(),
            }));

    // Sort by value descending
    const sortedData = [...rawData].sort((a, b) => b.value - a.value);

    // Spread colors across the spectrum to make them distinct
    const dataWithColors = sortedData.map((item, index) => ({
      ...item,
      color:
        emeraldShades[
          Math.floor((index / Math.max(1, sortedData.length - 1)) * (emeraldShades.length - 1))
        ],
    }));

    const total = dataWithColors.reduce((acc, curr) => acc + curr.value, 0);

    return { chartData: dataWithColors, totalFollowers: total };
  }, [data]);

  return (
    <div className="bg-white rounded-[2rem] p-8 h-full flex flex-col border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="mb-4">
        <h3 className="text-xl font-black text-slate-800">Follower Breakdown</h3>
        <p className="text-sm text-slate-500">
          Audience by platform <span className="mx-2">•</span>
          <span className="font-bold text-emerald-600">{formatNumber(totalFollowers)} Total</span>
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center gap-6">
        {/* Donut Chart Area */}
        <div className="w-full h-[220px] relative mt-2 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={105}
                paddingAngle={chartData.length > 1 ? 4 : 0}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={1200}
                cornerRadius={6}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  padding: "12px",
                }}
                itemStyle={{ fontWeight: 800, fontSize: "14px", color: "#064e3b" }}
                formatter={(value: any) => [formatNumber(value || 0), "Followers"]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Total in center of donut */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
              {formatNumber(totalFollowers)}
            </div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1.5 ml-1">
              Followers
            </div>
          </div>
        </div>

        {/* Platform Grid Legend */}
        <div className="w-full grid grid-cols-2 gap-4 mt-2">
          {chartData.map((item) => {
            const percentage =
              totalFollowers > 0 ? ((item.value / totalFollowers) * 100).toFixed(0) : 0;
            return (
              <div
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-md transition-all duration-300 group cursor-default"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-white shrink-0 group-hover:scale-110 transition-transform">
                  <Image
                    src={`/images/platform-logos/${item.key}.png`}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-black text-emerald-600">{percentage}%</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({formatNumber(item.value)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
