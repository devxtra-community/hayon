"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/shared";
import {
  PlatformMetricsCard,
  FollowersPieChart,
  TopPerformingPostCard,
  GrowthChart,
  AnalyticsEngagementChart,
  AnalyticsInsightsCard,
} from "@/components/analytics";
import { analyticsService } from "@/services/analytics.service";
import { AlertCircle, Calendar } from "lucide-react";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { LoadingH } from "@/components/ui/loading-h";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user and analytics data
        const [userDataResults, results] = await Promise.all([
          api.get("/auth/me"),
          Promise.allSettled([
            analyticsService.getOverview("30d"),
            analyticsService.getTimeline("30d"),
            analyticsService.getHeatmap(),
            analyticsService.getTopPosts(5, "totalEngagement"),
            analyticsService.getGrowth("30d"),
          ]),
        ]);

        setUser(userDataResults.data.data.user);

        const overview = results[0].status === "fulfilled" ? results[0].value : null;
        const timeline = results[1].status === "fulfilled" ? results[1].value : [];
        const heatmap = results[2].status === "fulfilled" ? results[2].value : [];
        const topPosts = results[3].status === "fulfilled" ? results[3].value : [];
        const growth = results[4].status === "fulfilled" ? results[4].value : [];

        // Check if we got at least overview data
        if (!overview) {
          setError("Failed to load analytics data. Please try again later.");
          setData(null);
        } else {
          setData({ overview, timeline, heatmap, topPosts, growth });
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
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
          <Sidebar />
        </div>
      </div>

      <main className="flex-1 bg-[#F1F5F9]/50 rounded-[2.5rem] overflow-y-auto px-4 py-4 lg:px-8 lg:py-6 scrollbar-hide flex flex-col gap-6">
        {loading || !user ? (
          <div className="flex items-center justify-center h-full">
            <LoadingH />
          </div>
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <AlertCircle className="text-red-400" size={48} />
            <p className="text-gray-600">{error || "No data available"}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto w-full space-y-6 lg:space-y-10 pb-10">
            {/* Header Integrated */}
            <Header
              userName={user?.name || ""}
              userEmail={user?.email || ""}
              userAvatar={user?.avatar || ""}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              className="bg-transparent h-auto py-2 px-0 shadow-none border-none"
            />

            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-1.5 px-1">
                <h1 className="text-3xl lg:text-5xl font-extrabold text-[#111827] tracking-tight">
                  Your Performance <span className="text-[#10B981] italic">Snapshot</span>
                </h1>
                <p className="text-gray-500 text-sm lg:text-lg font-medium">
                  Track, analyze and optimize your cross-platform strategy.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                  <Calendar size={18} className="text-primary" />
                  Last 30 Days
                </button>
                <button className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 3l1.912 5.885h6.188l-5.007 3.638 1.912 5.885-5.005-3.638-5.005 3.638 1.912-5.885-5.007-3.638h6.188L12 3z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Analytics Card */}
              <div className="xl:col-span-1 hover:scale-[1.02] transition-transform duration-500">
                <PlatformMetricsCard
                  platformStats={data.overview?.platformPerformance || []}
                  followerCounts={data.overview?.followers?.breakdown || {}}
                />
              </div>

              {/* Follower Breakdown Chart */}
              <div className="xl:col-span-1 hover:scale-[1.02] transition-transform duration-500">
                <FollowersPieChart data={data.overview?.followers?.breakdown || {}} />
              </div>

              {/* Best Content Card */}
              <div className="xl:col-span-1 hover:scale-[1.02] transition-transform duration-500">
                <TopPerformingPostCard initialData={data.topPosts?.[0]} />
              </div>
            </div>

            {/* Growth & Engagement Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[450px] transition-all duration-700 ease-in-out lg:col-span-1">
                <GrowthChart initialData={data.growth} />
              </div>
              <div className="h-[450px] transition-all duration-700 ease-in-out lg:col-span-1">
                <AnalyticsEngagementChart initialData={data.timeline} />
              </div>
            </div>

            {/* Bottom Row - Unified Insights Card */}
            <div className="pb-6">
              <AnalyticsInsightsCard heatmapData={data.heatmap || []} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
