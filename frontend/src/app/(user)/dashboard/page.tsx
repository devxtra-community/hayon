"use client";

import { useEffect, useState } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/axios";
import { analyticsService } from "@/services/analytics.service";
import { Button } from "@/components/ui/button";
import { Sidebar, Header } from "@/components/shared";

import {
  DashboardMetrics,
  EngagementChart,
  BestPostCard,
  UpcomingPostsCarousel,
  ConnectedPlatformsCard,
  PostDistributionChart,
  UpgradeCard,
} from "@/components/dashboard";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoadingH } from "@/components/ui/loading-h";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface DashboardData {
  metrics: {
    totalPosts: number;
    scheduled: number;
    totalAudience: number;
    totalEngagement: number;
  };
  timeline: Array<{ _id: string; totalEngagement: number; postCount: number }>;
  topPost: any;
  upcomingPosts: any[];
  platformPerformance: Array<{ _id: string; postCount: number }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      onMessage(messaging, (payload) => {
        console.log("Foreground Message received. ", payload);
        showToast(
          "success",
          payload.notification?.title || "New Message",
          payload.notification?.body || "Check your notifications.",
        );
      });
    }
  }, [showToast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user
        const { data: userData } = await api.get("/auth/me");
        setUser(userData.data.user);

        // Fetch all dashboard data in parallel
        const [overviewRes, timelineRes, topPostsRes, upcomingRes, scheduledCountRes] =
          await Promise.allSettled([
            analyticsService.getOverview("7d"),
            analyticsService.getTimeline("7d"),
            analyticsService.getTopPosts(1),
            analyticsService.getUpcomingPosts(3),
            analyticsService.getScheduledCount(),
          ]);

        const overview = overviewRes.status === "fulfilled" ? overviewRes.value : null;
        const timeline = timelineRes.status === "fulfilled" ? timelineRes.value : [];
        const topPosts = topPostsRes.status === "fulfilled" ? topPostsRes.value : [];
        const upcoming = upcomingRes.status === "fulfilled" ? upcomingRes.value : { posts: [] };
        const scheduledCount =
          scheduledCountRes.status === "fulfilled" ? scheduledCountRes.value : 0;

        setDashboardData({
          metrics: {
            totalPosts: overview?.stats?.totalPosts || 0,
            scheduled: scheduledCount,
            totalAudience: overview?.followers?.total || 0,
            totalEngagement: overview?.stats?.totalEngagement || 0,
          },
          timeline: timeline || [],
          topPost: topPosts?.[0] || null,
          upcomingPosts: upcoming?.posts || [],
          platformPerformance: overview?.platformPerformance || [],
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
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

      {/* Dashboard Content */}
      <main className="flex-1 bg-[#F7F7F7] rounded-[2.5rem] overflow-y-auto overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8 custom-scrollbar">
        {!user || !dashboardData ? (
          <div className="flex items-center justify-center h-full">
            <LoadingH />
          </div>
        ) : (
          <>
            {/* Header with Welcome Text & User Profile */}
            <Header
              userName={user.name}
              userEmail={user.email}
              userAvatar={user.avatar}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              title={`Hi, ${user.name.split(" ")[0]} 👋`}
              subtitle="Here's what's happening today"
            />

            <div className="space-y-8 mt-12">
              {/* 1. Top Metrics */}
              <section>
                <DashboardMetrics data={dashboardData?.metrics} />
              </section>

              {/* 2. Charts & Widgets Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Best Post Card - 1 col - First on Mobile */}
                <div className="lg:col-span-1 min-h-[350px] hover:scale-[1.02] transition-transform duration-500">
                  <BestPostCard post={dashboardData?.topPost} />
                </div>

                {/* Engagement Chart - Spans 2 cols */}
                <div className="lg:col-span-2 min-h-[350px] hover:scale-[1.01] transition-transform duration-500">
                  <EngagementChart data={dashboardData?.timeline} />
                </div>

                {/* Upcoming Posts Carousel - 1 col */}
                <div className="lg:col-span-1 min-h-[350px] hover:scale-[1.02] transition-transform duration-500">
                  <UpcomingPostsCarousel posts={dashboardData?.upcomingPosts} />
                </div>
              </section>

              {/* 3. Bottom Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pb-8">
                {/* Connected Accounts */}
                <div className="lg:col-span-1 min-h-[300px] hover:scale-[1.02] transition-transform duration-500">
                  <ConnectedPlatformsCard />
                </div>

                {/* Post Distribution */}
                <div className="lg:col-span-1 min-h-[300px] hover:scale-[1.02] transition-transform duration-500">
                  <PostDistributionChart data={dashboardData?.platformPerformance} />
                </div>

                {/* Upgrade / Plan Info */}
                <div className="lg:col-span-1 min-h-[300px] hover:scale-[1.02] transition-transform duration-500">
                  <UpgradeCard />
                </div>
              </section>

              {/* Analytics CTA */}
              <div className="bg-white rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4 border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Need deeper insights?</h3>
                  <p className="text-slate-500">
                    Dive into the full analytics suite for granular reporting.
                  </p>
                </div>
                <Link href="/analytics">
                  <Button variant="outline" className="border-slate-200">
                    Go to Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
