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
import { AlertCircle } from "lucide-react";
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
  const [selectedPeriod] = useState("30d");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user
        const { data: userData } = await api.get("/auth/me");
        setUser(userData.data.user);

        // Fetch each endpoint separately to handle partial failures
        const results = await Promise.allSettled([
          analyticsService.getOverview(selectedPeriod),
          analyticsService.getTimeline(selectedPeriod),
          analyticsService.getHeatmap(),
          analyticsService.getTopPosts(5, "totalEngagement"),
        ]);

        const overview = results[0].status === "fulfilled" ? results[0].value : null;
        const timeline = results[1].status === "fulfilled" ? results[1].value : [];
        const heatmap = results[2].status === "fulfilled" ? results[2].value : [];
        const topPosts = results[3].status === "fulfilled" ? results[3].value : [];

        // Check if we got at least overview data
        if (!overview) {
          setError("Failed to load analytics data. Please try again later.");
          setData(null);
        } else {
          setData({ overview, timeline, heatmap, topPosts });
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

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

      {/* Header */}
      <div className="pb-2 lg:pb-4">
        <Header
          userName={user?.name || ""}
          userEmail={user?.email || ""}
          userAvatar={user?.avatar || ""}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
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
          <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-[340px]">
                <PlatformMetricsCard
                  platformStats={data.overview?.platformPerformance || []}
                  followerCounts={data.overview?.followers?.breakdown || {}}
                />
              </div>
              <div className="h-[340px]">
                <FollowersPieChart data={data.overview?.followers?.breakdown || {}} />
              </div>
              <div className="h-[340px]">
                <TopPerformingPostCard initialData={data.topPosts?.[0]} />
              </div>
            </div>

            {/* Growth & Engagement Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[450px]">
              <GrowthChart />
              <AnalyticsEngagementChart />
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
