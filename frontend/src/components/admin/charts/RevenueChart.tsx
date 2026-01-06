"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const data = [
  { month: "Jan", revenue: 4200, recurring: 3800 },
  { month: "Feb", revenue: 5100, recurring: 4200 },
  { month: "Mar", revenue: 6800, recurring: 5100 },
  { month: "Apr", revenue: 7200, recurring: 5800 },
  { month: "May", revenue: 8500, recurring: 6800 },
  { month: "Jun", revenue: 9200, recurring: 7500 },
  { month: "Jul", revenue: 10800, recurring: 8200 },
  { month: "Aug", revenue: 11500, recurring: 9000 },
  { month: "Sep", revenue: 12800, recurring: 10200 },
  { month: "Oct", revenue: 14200, recurring: 11500 },
  { month: "Nov", revenue: 15800, recurring: 12800 },
  { month: "Dec", revenue: 18200, recurring: 14500 },
];

interface RevenueChartProps {
  className?: string;
}

export default function RevenueChart({ className }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const currentMonthRevenue = data[data.length - 1].revenue;
  const previousMonthRevenue = data[data.length - 2].revenue;
  const monthlyGrowth = (
    ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
    100
  ).toFixed(1);

  return (
    <Card className={`border-gray-100 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue breakdown</CardDescription>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
            <DollarSign size={20} className="text-green-500" />
            {(totalRevenue / 1000).toFixed(1)}K
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 mt-1">
            <TrendingUp size={12} className="mr-1" />+{monthlyGrowth}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={(value: number) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) =>
                  value !== undefined ? [`$${Number(value).toLocaleString()}`, ""] : ["", ""]
                }
              />
              <Bar
                dataKey="revenue"
                fill="url(#revenueGradient)"
                radius={[6, 6, 0, 0]}
                name="Total Revenue"
              />
              <Bar
                dataKey="recurring"
                fill="url(#recurringGradient)"
                radius={[6, 6, 0, 0]}
                name="Recurring Revenue"
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="recurringGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-b from-red-500 to-orange-500"></div>
            <span className="text-sm text-gray-600">Total Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500"></div>
            <span className="text-sm text-gray-600">Recurring Revenue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
