"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const data = [
  { day: "Mon", logins: 320, posts: 145, interactions: 580 },
  { day: "Tue", logins: 380, posts: 168, interactions: 620 },
  { day: "Wed", logins: 420, posts: 192, interactions: 710 },
  { day: "Thu", logins: 390, posts: 175, interactions: 680 },
  { day: "Fri", logins: 450, posts: 210, interactions: 780 },
  { day: "Sat", logins: 280, posts: 120, interactions: 420 },
  { day: "Sun", logins: 240, posts: 95, interactions: 350 },
];

interface ActivityChartProps {
  className?: string;
}

export default function ActivityChart({ className }: ActivityChartProps) {
  const totalLogins = data.reduce((sum, item) => sum + item.logins, 0);
  const avgDailyLogins = Math.round(totalLogins / data.length);

  return (
    <Card className={`border-gray-100 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Weekly Activity</CardTitle>
          <CardDescription>User engagement this week</CardDescription>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
          <Activity size={14} className="mr-1" />
          {avgDailyLogins} avg/day
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
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
              <Line
                type="monotone"
                dataKey="logins"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="Logins"
              />
              <Line
                type="monotone"
                dataKey="posts"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="Posts"
              />
              <Line
                type="monotone"
                dataKey="interactions"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="Interactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Logins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600">Interactions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
