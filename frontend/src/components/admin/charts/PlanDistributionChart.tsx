"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { name: "Free", value: 450, color: "#9ca3af" },
  { name: "Starter", value: 280, color: "#3b82f6" },
  { name: "Professional", value: 420, color: "#a855f7" },
  { name: "Enterprise", value: 230, color: "#f59e0b" },
];

interface PlanDistributionChartProps {
  className?: string;
}

export default function PlanDistributionChart({ className }: PlanDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={`border-gray-100 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Plan Distribution</CardTitle>
        <CardDescription>Users by subscription plan</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) => (value !== undefined ? [`${value} users`, ""] : ["", ""])}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-600">{item.name}</span>
              <span className="text-sm font-semibold text-gray-900 ml-auto">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
