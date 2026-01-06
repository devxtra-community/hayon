"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { AdminSidebar, AdminHeader, StatsCards } from "@/components/admin";
import {
  UserGrowthChart,
  PlanDistributionChart,
  RevenueChart,
  ActivityChart,
} from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Calendar } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar: string;
}

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState("last-30-days");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

  // Mock stats
  const stats = {
    totalUsers: 1380,
    activeUsers: 1120,
    inactiveUsers: 260,
    paidUsers: 930,
    monthlyGrowth: 15.2,
    topPlan: "Professional",
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-none transition-transform duration-300 transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <AdminSidebar />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-2 lg:pb-4">
          <AdminHeader
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
        </div>

        {/* Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-500 text-xs lg:text-sm mt-1">
                Detailed insights and metrics about your platform performance
              </p>
            </div>

            <div className="flex gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-44 bg-white border-gray-200">
                  <Calendar size={16} className="mr-2 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="all-time">All time</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="gap-2">
                <Download size={16} />
                Export Report
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 lg:mb-8">
            <StatsCards stats={stats} />
          </div>

          {/* Charts Grid - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="lg:col-span-2">
              <UserGrowthChart />
            </div>
            <div className="lg:col-span-1">
              <PlanDistributionChart />
            </div>
          </div>

          {/* Charts Grid - Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RevenueChart />
            <ActivityChart />
          </div>
        </main>
      </div>
    </div>
  );
}
