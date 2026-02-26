"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { HistoryCard } from "@/components/history/HistoryCard";
import { CalendarPostCard } from "./CalendarPostCard";

export default function CalendarComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile to adjust week start and layout
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // Mobile starts Sunday (as per mobile mockup), Desktop starts Monday (as per desktop mockup)
  const weekStartsOn = isMobile ? 0 : 1;

  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  // const setToday = () => {
  //   const today = new Date();
  //   setCurrentDate(today);
  //   setSelectedDate(today);
  // };

  useEffect(() => {
    fetchData();
  }, [selectedDate, currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/posts", { params: { limit: 200 } });
      const fetchedPosts = response.data.data.posts;
      setAllPosts(fetchedPosts);

      const dayPosts = fetchedPosts.filter((post: any) => {
        const postDate =
          post.status === "SCHEDULED" && post.scheduledAt
            ? new Date(post.scheduledAt)
            : new Date(post.createdAt);
        return isSameDay(postDate, selectedDate);
      });

      setPosts(dayPosts.filter((p: any) => p.status !== "SCHEDULED"));
      setScheduledPosts(dayPosts.filter((p: any) => p.status === "SCHEDULED"));
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto">
      {/* Calendar Header matching mockup */}
      <div className="flex items-center justify-between px-2 pt-2">
        {/* Year Label */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {format(currentDate, "yyyy")}
        </h2>

        {/* Month Navigation Pill */}
        <div className="flex items-center bg-white rounded-full px-1 py-1 shadow-sm border border-gray-100">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-50 rounded-full transition-all group"
          >
            <ChevronLeft size={20} className="text-gray-400 group-hover:text-gray-900" />
          </button>

          <span className="px-4 text-lg md:text-xl font-bold text-gray-900 lowercase min-w-[120px] text-center">
            {format(currentDate, "MMMM")}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-50 rounded-full transition-all group"
          >
            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-900" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#F8F9FA] md:bg-[#F9FAFB] rounded-[2.5rem] p-4 md:p-8">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {(isMobile
            ? ["sun", "mon", "tue", "wen", "thu", "fri", "sat"]
            : ["Mon", "Tue", "Wen", "Thu", "Fri", "Sat", "Sun"]
          ).map((day) => (
            <div
              key={day}
              className="text-center text-[11px] md:text-[14px] font-semibold text-gray-900 md:text-gray-700 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-3">
          {calendarDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const hasScheduled = allPosts.some(
              (p) => p.status === "SCHEDULED" && isSameDay(new Date(p.scheduledAt), day),
            );

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative flex flex-col transition-all duration-300",
                  "aspect-square md:aspect-[1.3/1]",
                  "rounded-full p-2 md:rounded-[18px] md:p-4",
                  !isCurrentMonth ? "opacity-30 md:bg-white/40" : "opacity-100",
                  isSelected
                    ? "bg-[#318D62] text-white shadow-lg md:shadow-none"
                    : isToday && !isSelected
                      ? "ring-1 ring-[#318D62]/30 ring-offset-1 text-[#318D62] font-bold md:bg-white"
                      : "md:bg-white md:hover:shadow-md md:hover:scale-[1.01] text-gray-900 border border-transparent md:border-gray-50",
                )}
              >
                {/* Date Number - Top Left on Desktop, Center on Mobile */}
                <span
                  className={cn(
                    "text-[14px] md:text-[15px] font-semibold",
                    "md:absolute md:top-3 md:left-4",
                    isSelected ? "text-white" : "text-gray-900",
                  )}
                >
                  {format(day, "dd")}
                </span>

                {/* Desktop Activity Indicators */}
                {!isMobile && !isSelected && hasScheduled && (
                  <div className="mt-auto flex justify-center w-full pb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#318D62]" />
                  </div>
                )}

                {/* Mobile indicators */}
                {isMobile && !isSelected && hasScheduled && isCurrentMonth && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#318D62] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            {isSameDay(selectedDate, new Date())
              ? "Today's Content"
              : format(selectedDate, "MMMM do")}
          </h3>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {posts.length + scheduledPosts.length} items
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : posts.length > 0 || scheduledPosts.length > 0 ? (
          <div className="space-y-4">
            {/* Mobile View: CalendarPostCard List */}
            <div className="md:hidden flex flex-col">
              {[...scheduledPosts, ...posts].map((post) => (
                <CalendarPostCard
                  key={post._id}
                  id={post._id}
                  imageUrl={post.content?.mediaItems?.[0]?.s3Url}
                  description={post.content?.text || "No description provided"}
                  status={post.status}
                  platformStatuses={post.platformStatuses}
                />
              ))}
            </div>

            {/* Desktop View: Grid of HistoryCards */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...scheduledPosts, ...posts].map((post) => (
                <HistoryCard
                  key={post._id}
                  id={post._id}
                  imageUrl={post.content?.mediaItems?.[0]?.s3Url}
                  description={post.content?.text || "No content"}
                  status={post.status}
                  platformStatuses={post.platformStatuses?.map((p: any) => ({
                    platform: p.platform,
                    status: p.status,
                    platformPostUrl: p.platformPostUrl,
                  }))}
                  mediaCount={post.content?.mediaItems?.length || 1}
                  createdAt={post.scheduledAt || post.createdAt}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center border border-gray-50 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-200" />
            </div>
            <p className="text-gray-500 font-medium">No activity for this day</p>
            <p className="text-sm text-gray-400 mt-1">
              Select another date to view scheduled posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
