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
import { ChevronLeft, ChevronRight, FileText, CircleAlert } from "lucide-react";
import NextImage from "next/image";
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
      // TODO:: change a limit and fetch with the date
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
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto min-w-0 overflow-hidden">
      {/* Calendar Header matching mockup */}
      <div className="flex items-center justify-between px-1 sm:px-2 pt-2 gap-2">
        {/* Year Label */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight shrink-0">
          {format(currentDate, "yyyy")}
        </h2>

        {/* Month Navigation Pill */}
        <div className="flex items-center bg-white rounded-full px-0.5 sm:px-1 py-1 shadow-sm border border-gray-100 min-w-0">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-50 rounded-full transition-all group"
          >
            <ChevronLeft size={20} className="text-gray-400 group-hover:text-gray-900" />
          </button>

          <span className="px-2 sm:px-4 text-base sm:text-lg md:text-xl font-bold text-gray-900 lowercase min-w-[80px] sm:min-w-[120px] text-center truncate">
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
      <div className="bg-[#F8F9FA] md:bg-[#F9FAFB] rounded-2xl sm:rounded-[2.5rem] p-2 sm:p-4 md:p-8">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {(isMobile
            ? ["sun", "mon", "tue", "wen", "thu", "fri", "sat"]
            : ["Mon", "Tue", "Wen", "Thu", "Fri", "Sat", "Sun"]
          ).map((day) => (
            <div
              key={day}
              className="text-center text-[10px] sm:text-[11px] md:text-[14px] font-semibold text-gray-900 md:text-gray-700 py-1.5 sm:py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-3">
          {calendarDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const hasScheduled = allPosts.some(
              (p) => p.status === "SCHEDULED" && isSameDay(new Date(p.scheduledAt), day),
            );

            const dayPosts = allPosts.filter((p) => {
              const d = p.status === "SCHEDULED" ? p.scheduledAt : p.createdAt;
              return d && isSameDay(new Date(d), day);
            });

            const postedCount = dayPosts.filter((p) => p.status === "COMPLETED").length;
            const scheduledCount = dayPosts.filter((p) => p.status === "SCHEDULED").length;
            const failedCount = dayPosts.filter(
              (p) => p.status === "FAILED" || p.status === "CANCELLED",
            ).length;
            const partialCount = dayPosts.filter((p) => p.status === "PARTIAL_SUCCESS").length;
            const processingCount = dayPosts.filter(
              (p) => p.status === "PROCESSING" || p.status === "PENDING",
            ).length;

            const thumbnails = dayPosts
              .map((p) => p.content?.mediaItems?.[0]?.s3Url)
              .filter(Boolean)
              .slice(0, 2);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative flex items-center justify-center md:flex-col md:items-stretch md:justify-start transition-all duration-300",
                  "aspect-square md:aspect-[1.3/1]",
                  "rounded-full p-1 sm:p-2 md:rounded-[18px] md:p-4",
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
                    "text-[12px] sm:text-[14px] md:text-[15px] font-bold z-20 transition-all duration-300",
                    "md:absolute md:top-3 md:left-4",
                    isSelected
                      ? "text-white drop-shadow-md"
                      : "text-gray-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]",
                  )}
                >
                  {format(day, "dd")}
                </span>

                {/* Desktop Activity Indicators */}
                {!isMobile && (
                  <div className="mt-auto pt-7 flex flex-col gap-1 w-full relative z-10">
                    {dayPosts.length > 0 && (
                      <>
                        {/* Top Line: Thumbnails + Error Alert */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex -space-x-2.5">
                            {thumbnails.map((url, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-7 h-7 rounded-lg border-2 border-white overflow-hidden shadow-sm bg-gray-100 ring-1 ring-black/5",
                                  isSelected && "border-white/20 ring-white/10",
                                )}
                              >
                                <NextImage
                                  src={url}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ))}
                            {dayPosts.filter((p) => p.content?.mediaItems?.[0]?.s3Url).length >
                              2 && (
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg border-2 border-white bg-gray-50 flex items-center justify-center shadow-sm ring-1 ring-black/5",
                                  isSelected && "border-white/20 bg-white/20 ring-white/10",
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-[9px] font-bold text-gray-500",
                                    isSelected && "text-white",
                                  )}
                                >
                                  +
                                  {dayPosts.filter((p) => p.content?.mediaItems?.[0]?.s3Url)
                                    .length - 2}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Critical Error Alert with Count */}
                          {failedCount > 0 && (
                            <div
                              className={cn(
                                "flex items-center gap-1 px-1.5 h-6 rounded-lg bg-red-50 text-red-600 shadow-sm animate-pulse border border-red-100",
                                isSelected && "bg-white/20 text-white border-white/30",
                              )}
                            >
                              <CircleAlert size={12} strokeWidth={2.5} />
                              <span className="text-[10px] font-black">{failedCount}</span>
                            </div>
                          )}
                        </div>

                        {/* Uniform Status Grid */}
                        <div className="grid grid-cols-2 gap-1">
                          {postedCount > 0 && (
                            <div
                              className={cn(
                                "flex items-center justify-center h-4.5 rounded px-1 text-[8px] font-bold uppercase tracking-tight",
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-100",
                              )}
                              title="Posted"
                            >
                              {postedCount} P
                            </div>
                          )}
                          {scheduledCount > 0 && (
                            <div
                              className={cn(
                                "flex items-center justify-center h-4.5 rounded px-1 text-[8px] font-bold uppercase tracking-tight",
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-blue-50 text-blue-600 border border-blue-100",
                              )}
                              title="Scheduled"
                            >
                              {scheduledCount} S
                            </div>
                          )}
                          {processingCount > 0 && (
                            <div
                              className={cn(
                                "flex items-center justify-center h-4.5 rounded px-1 text-[8px] font-bold uppercase tracking-tight animate-pulse",
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-sky-50 text-sky-600 border border-sky-100",
                              )}
                              title="Processing"
                            >
                              {processingCount} ..
                            </div>
                          )}
                          {partialCount > 0 && (
                            <div
                              className={cn(
                                "flex items-center justify-center h-4.5 rounded px-1 text-[8px] font-bold uppercase tracking-tight",
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-orange-50 text-orange-600 border border-orange-100",
                              )}
                              title="Partial Success"
                            >
                              {partialCount} !
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
        <div className="flex items-center justify-between px-1 sm:px-2 mb-2 gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate min-w-0">
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
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 flex flex-col items-center justify-center text-center border border-gray-50 shadow-sm">
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
