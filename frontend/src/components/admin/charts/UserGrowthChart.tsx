"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const data = [
  { month: "Jan", users: 120, newUsers: 45 },
  { month: "Feb", users: 180, newUsers: 60 },
  { month: "Mar", users: 250, newUsers: 70 },
  { month: "Apr", users: 310, newUsers: 60 },
  { month: "May", users: 420, newUsers: 110 },
  { month: "Jun", users: 520, newUsers: 100 },
  { month: "Jul", users: 650, newUsers: 130 },
  { month: "Aug", users: 780, newUsers: 130 },
  { month: "Sep", users: 920, newUsers: 140 },
  { month: "Oct", users: 1050, newUsers: 130 },
  { month: "Nov", users: 1200, newUsers: 150 },
  { month: "Dec", users: 1380, newUsers: 180 },
];

interface UserGrowthChartProps {
  className?: string;
}

export default function UserGrowthChart({ className }: UserGrowthChartProps) {
  const growthRate = useMemo(() => {
    const firstValue = data[0].users;
    const lastValue = data[data.length - 1].users;
    return (((lastValue - firstValue) / firstValue) * 100).toFixed(0);
  }, []);

  return (
    <Card className={`border-gray-100 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">User Growth</CardTitle>
          <CardDescription>Monthly user acquisition trends</CardDescription>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
          <TrendingUp size={14} className="mr-1" />+{growthRate}%
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="newUserGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#userGradient)"
                name="Total Users"
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#newUserGradient)"
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Total Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-600">New Users</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
