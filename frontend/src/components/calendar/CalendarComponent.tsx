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
import { ChevronLeft, ChevronRight, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { HistoryCard } from "@/components/history/HistoryCard";

export default function CalendarComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const setToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

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
    <div className="flex flex-col gap-8">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2.5 hover:bg-white rounded-full transition-all hover:shadow-md bg-white/50 border border-transparent hover:border-gray-100"
          >
            <ChevronLeft size={22} className="text-gray-700" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2.5 hover:bg-white rounded-full transition-all hover:shadow-md bg-white/50 border border-transparent hover:border-gray-100"
          >
            <ChevronRight size={22} className="text-gray-700" />
          </button>
          <button
            onClick={setToday}
            className="ml-4 px-6 py-2.5 bg-white border border-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#F7F7F7] rounded-[2rem] p-8">
        <div className="grid grid-cols-7 mb-6">
          {["Mon", "Tue", "Wen", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="text-center text-[13px] font-bold text-gray-900 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {calendarDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-[4/3] rounded-[16px] p-4 flex flex-col items-start justify-start transition-all duration-300 relative group",
                  isCurrentMonth ? "bg-white" : "bg-white/40 opacity-40",
                  isSelected
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                    : "hover:bg-white/80 hover:shadow-sm",
                  !isSelected && isToday && "ring-2 ring-primary/20 ring-offset-2",
                )}
              >
                <span
                  className={cn(
                    "text-[14px] font-bold",
                    isSelected ? "text-white" : "text-gray-900",
                  )}
                >
                  {format(day, "dd")}
                </span>

                {/* Content indicators */}
                <div className="mt-auto flex gap-1">
                  {allPosts.some(
                    (p) => p.status === "SCHEDULED" && isSameDay(new Date(p.scheduledAt), day),
                  ) && (
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-white" : "bg-primary",
                      )}
                    />
                  )}
                  {allPosts.some(
                    (p) => p.status !== "SCHEDULED" && isSameDay(new Date(p.createdAt), day),
                  ) && (
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-white/60" : "bg-gray-300",
                      )}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-[2rem] p-10 shadow-sm min-h-[400px]">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Posts for {format(selectedDate, "MMMM do, yyyy")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Review your content activity for this day</p>
          </div>
          <span className="text-sm font-bold text-primary bg-primary/5 px-6 py-2 rounded-full border border-primary/10">
            {posts.length} {posts.length === 1 ? "Post" : "Posts"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
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
                mediaCount={post.media?.length}
                createdAt={post.createdAt}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <FileText size={40} className="text-gray-200" />
            </div>
            <p className="text-lg font-medium">No posts found for this day</p>
            <p className="text-sm">Try selecting a different date or schedule a new post.</p>
          </div>
        )}

        {/* Scheduled Posts Bottom Section */}
        {scheduledPosts.length > 0 && (
          <div className="mt-12 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-primary" size={24} />
                Scheduled for this day
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledPosts.map((post) => (
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
                  mediaCount={post.content?.mediaItems?.length}
                  createdAt={post.scheduledAt || post.createdAt}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
