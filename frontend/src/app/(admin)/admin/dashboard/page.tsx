"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { AdminSidebar, AdminHeader, StatsCards } from "@/components/admin";
import { ActivityChart } from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingH } from "@/components/ui/loading-h";
import Link from "next/link";
import { RefreshCw, Users, BarChart3, ArrowRight } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar: string;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    paidUsers: 0,
    monthlyGrowth: 0,
    topPlan: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data.user);
        console.log("Fetched admin user:", data.data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/analytics");
        setStats(data.data);
        console.log("Fetched dashboard stats:", data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingH theme="admin" />
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

        {/* Dashboard Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 text-xs lg:text-sm">
                Welcome back, {user.name.split(" ")[0]}! Here{"'"}s an overview of your platform.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 lg:mb-8">
            <StatsCards stats={stats} />
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 lg:mb-8">
            <Link href="/admin/users" className="group">
              <Card className="p-5 border-gray-100 hover:shadow-md hover:border-red-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                      <Users size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Manage Users</h3>
                      <p className="text-sm text-gray-500">
                        Enable/disable accounts & change plans
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </Card>
            </Link>

            <Link href="/admin/analytics" className="group">
              <Card className="p-5 border-gray-100 hover:shadow-md hover:border-red-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <BarChart3 size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">View Analytics</h3>
                      <p className="text-sm text-gray-500">Detailed insights & reports</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </Card>
            </Link>
          </div>

          {/* Activity Chart */}
          <div className="grid grid-cols-1">
            <ActivityChart />
          </div>
        </main>
      </div>
    </div>
  );
}
