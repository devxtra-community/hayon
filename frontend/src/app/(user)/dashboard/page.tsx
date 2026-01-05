"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  Header,
  StatsCard,
  ImpressionsChart,
  BestPostCard,
  PlanInfoCard,
  ConnectedPlatformsCard,
  PlatformPerformanceCard,
  UpgradeCard,
} from "@/components/dashboard";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data.user);
        console.log("Fetched user:", data.data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
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
            "absolute left-0 top-0 bottom-0 w-72 bg-none  transition-transform duration-300 transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar />
          {/* <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button> */}
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-2 lg:pb-4">
          <Header
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
        </div>

        {/* Dashboard Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
          {/* Welcome Section */}
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Hi, {user.name.split(" ")[0]}
              </h1>
              <p className="text-gray-500 text-xs lg:text-sm">welcome back</p>
            </div>

            <div className="flex gap-2">
              <Link href="/dashboard/devices">
                <Button variant="outline" className="mr-2">
                  Manage Devices
                </Button>
              </Link>
              <Link href="/create-post" className="hidden lg:block">
                <Button variant="default" className="gap-2">
                  Create a post
                  <Plus size={18} />
                </Button>
              </Link>
            </div>
          </div>
          {/* Wrapper for responsive vertical stacking on mobile */}
          <div className="space-y-5 lg:space-y-0 lg:block">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:mb-8">
              <StatsCard
                title="Total Posts"
                value="25"
                trend="5% increased from last month"
                variant="primary"
              />
              <StatsCard title="Total Drafts" value="17" trend="5% increased from last month" />
              <StatsCard title="Total Schedules" value="33" trend="5% increased from last month" />
              {/* Re-ordered to match image somewhat, or kept logical */}
              <StatsCard title="Total Impression" value="48" trend="5% increased from last month" />
            </div>

            {/* Main Grid - Charts and Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:mb-8">
              {/* Impressions Chart - takes 2 columns on desktop */}
              <div className="lg:col-span-2">
                <ImpressionsChart />
              </div>

              {/* Pie Chart / Platform Performance in the image looks like it corresponds to this slot */}
              {/* In the image, Pie chart is prominent. Let's assume PlatformPerformanceCard is the one or we use another component. 
                     The current codebase has PlatformPerformanceCard. The image shows a Pie Chart. 
                     I will place PlatformPerformanceCard here if it resembles the logic, or BestPostCard.
                     In code, BestPostCard was next. 
                  */}
              <div className="lg:hidden">
                {/* On mobile, stack order: Chart -> Platform Performance (Pie) -> Best Post */}
                <PlatformPerformanceCard />
              </div>

              {/* Best Post Card - takes 1 column */}
              <div className="lg:col-span-1">
                <BestPostCard />
              </div>

              {/* Plan Info Card - takes 1 column */}
              <div className="lg:col-span-1">
                <PlanInfoCard />
              </div>
            </div>

            {/* Bottom Row / Re-arranged for Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Connected Platforms */}
              <ConnectedPlatformsCard />

              {/* Platform Performance - hidden on mobile here if we moved it up? 
                    Actually, let's keep the desktop grid structure but allow mobile to just flow naturally 
                    if we use grid-cols-1.
                */}
              <div className="hidden lg:block">
                <PlatformPerformanceCard />
              </div>

              {/* Upgrade Card */}
              <UpgradeCard />
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <Link href="/create-post" className="fixed bottom-6 right-6 lg:hidden z-40 shadow-xl">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-[#318D62] hover:bg-[#287350] text-white shadow-lg shadow-green-900/20"
        >
          <Plus size={32} />
        </Button>
      </Link>
    </div>
  );
}
