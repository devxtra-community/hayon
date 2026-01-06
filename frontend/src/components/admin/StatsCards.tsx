"use client";

import { Users, UserCheck, UserX, CreditCard, TrendingUp, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  paidUsers: number;
  monthlyGrowth: number;
  topPlan: string;
}

interface StatsCardsProps {
  stats: AdminStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: <Users size={22} />,
      bgGradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: `+${stats.monthlyGrowth}% this month`,
      trendUp: true,
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: <UserCheck size={22} />,
      bgGradient: "from-green-500 to-emerald-600",
      lightBg: "bg-green-50",
      iconColor: "text-green-600",
      percentage: `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%`,
    },
    {
      title: "Inactive Users",
      value: stats.inactiveUsers.toLocaleString(),
      icon: <UserX size={22} />,
      bgGradient: "from-red-500 to-rose-600",
      lightBg: "bg-red-50",
      iconColor: "text-red-600",
      percentage: `${((stats.inactiveUsers / stats.totalUsers) * 100).toFixed(1)}%`,
    },
    {
      title: "Paid Users",
      value: stats.paidUsers.toLocaleString(),
      icon: <CreditCard size={22} />,
      bgGradient: "from-purple-500 to-violet-600",
      lightBg: "bg-purple-50",
      iconColor: "text-purple-600",
      trend: stats.topPlan,
      trendIcon: <Crown size={12} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="p-5 border-gray-100 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl ${card.lightBg} flex items-center justify-center`}
            >
              <span className={card.iconColor}>{card.icon}</span>
            </div>
          </div>

          {card.trend && (
            <div className="mt-3 flex items-center gap-1.5">
              {card.trendUp && <TrendingUp size={14} className="text-green-500" />}
              {card.trendIcon && <span className="text-amber-500">{card.trendIcon}</span>}
              <span
                className={`text-xs font-medium ${card.trendUp ? "text-green-600" : "text-amber-600"}`}
              >
                {card.trend}
              </span>
            </div>
          )}

          {card.percentage && (
            <div className="mt-3">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${card.bgGradient}`}
                  style={{ width: card.percentage }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{card.percentage} of total</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
