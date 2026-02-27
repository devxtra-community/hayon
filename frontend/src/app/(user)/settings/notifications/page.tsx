"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, Inbox } from "lucide-react";
import PlatformIcon from "@/components/ui/PlatformIcon";
import { Sidebar, Header } from "@/components/shared";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

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

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500 mt-1" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 mt-1" />;
    }
  };

  const highlightMessage = (message: string) => {
    const platforms = ["bluesky", "threads", "tumblr", "mastodon", "facebook", "instagram"];
    const statusKeywords = ["pending", "scheduled", "posted"];
    const allKeywords = [...platforms, ...statusKeywords];

    const regex = new RegExp(`(${allKeywords.join("|")})`, "gi");
    const parts = message.split(regex);

    return parts.map((part, i) => {
      const lowerPart = part.toLowerCase();

      if (lowerPart === "pending") {
        return (
          <span
            key={i}
            className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tight"
          >
            {part}
          </span>
        );
      }
      if (lowerPart === "scheduled") {
        return (
          <span
            key={i}
            className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-tight"
          >
            {part}
          </span>
        );
      }
      if (lowerPart === "posted") {
        return (
          <span
            key={i}
            className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight"
          >
            {part}
          </span>
        );
      }

      if (platforms.includes(lowerPart)) {
        const colors: Record<string, string> = {
          bluesky: "text-[#0085ff]",
          threads: "text-zinc-900 dark:text-zinc-100",
          instagram: "text-[#E1306C]",
          facebook: "text-[#1877F2]",
          mastodon: "text-[#6364FF]",
          tumblr: "text-[#35465c]",
        };
        return (
          <span key={i} className={cn("font-bold", colors[lowerPart])}>
            {part}
          </span>
        );
      }

      return part;
    });
  };

  const extractPlatform = (message: string) => {
    const platforms = ["bluesky", "threads", "tumblr", "mastodon", "facebook", "instagram"];
    return platforms.find((p) => message.toLowerCase().includes(p));
  };

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

      <div className="flex-1 flex flex-col h-full bg-[#F7F7F7] lg:bg-white rounded-[2.5rem] overflow-hidden">
        {user && (
          <div className="px-4 pt-6 lg:px-6 lg:bg-white bg-[#F7F7F7] ">
            <Header
              userName={user.name}
              userEmail={user.email}
              userAvatar={user.avatar}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              title={<span className="text-center">Notifications</span>}
              subtitle="Stay updated with your social performance"
              hideDesktop={true}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 lg:py-6 custom-scrollbar rounded-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 lg:mb-10">
              <div className="hidden lg:block">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Notifications</h1>
                <p className="text-gray-500 text-sm">Stay updated with your social performance</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-all ml-auto lg:ml-0"
                >
                  <CheckCheck size={18} strokeWidth={2.5} />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <div className="bg-gray-50 p-6 rounded-full mb-6 ring-8 ring-gray-50/50">
                  <Inbox className="h-12 w-12 text-gray-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                <p className="text-sm mt-2 text-center max-w-[250px]">
                  We'll let you know when something important happens on your platforms.
                </p>
                <Button
                  className="mt-8 rounded-full px-8"
                  onClick={() => router.push("/dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const postImage =
                    notification.image ||
                    (notification.relatedResource?.type === "post"
                      ? notification.relatedResource.id?.content?.mediaItems?.[0]?.s3Url
                      : null);
                  const platform = extractPlatform(notification.message);
                  const isSuccess = notification.type === "success";
                  const isPosted = notification.message
                    .toLowerCase()
                    .includes("successfully posted");
                  const useRichLayout = isPosted && postImage;

                  return (
                    <div
                      key={notification._id}
                      className={cn(
                        "group relative flex flex-col md:flex-row items-stretch bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden cursor-pointer",
                        !notification.read
                          ? isSuccess
                            ? "border-emerald-200 shadow-lg shadow-emerald-500/5 bg-emerald-50/10"
                            : "border-primary/20 shadow-lg shadow-primary/5 bg-primary/5"
                          : "border-gray-100 hover:border-gray-200 hover:shadow-md",
                      )}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification._id);
                        if (notification.link) {
                          if (notification.link.startsWith("http")) {
                            window.open(notification.link, "_blank");
                          } else {
                            router.push(notification.link);
                          }
                        }
                      }}
                    >
                      {/* Rich Image Layout */}
                      {useRichLayout && (
                        <div className="relative w-full md:w-48 aspect-video md:aspect-square shrink-0 overflow-hidden">
                          <img
                            src={postImage}
                            alt="Post thumbnail"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                          {platform && (
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-white/20">
                              <PlatformIcon platform={platform} size={20} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1 flex gap-4 p-6 lg:p-8">
                        {!useRichLayout && (
                          <div className="shrink-0 relative">
                            {postImage ? (
                              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-gray-100">
                                <img
                                  src={postImage}
                                  alt="Post thumbnail"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "h-14 w-14 flex items-center justify-center rounded-2xl border transition-colors",
                                  isSuccess
                                    ? "bg-emerald-50 border-emerald-100"
                                    : "bg-gray-50 border-gray-100",
                                )}
                              >
                                {platform ? (
                                  <PlatformIcon platform={platform} size={32} />
                                ) : (
                                  <div className="scale-125">{getIcon(notification.type)}</div>
                                )}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-gray-50">
                              {getIcon(notification.type)}
                            </div>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                              {platform && (
                                <span className="text-[9px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-primary/30" />
                                  {platform}
                                </span>
                              )}
                            </div>
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className={cn(
                                  "flex items-center justify-center h-8 w-8 rounded-full transition-all hover:scale-110",
                                  isSuccess
                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                    : "bg-primary/10 text-primary hover:bg-primary/20",
                                )}
                                title="Mark as read"
                              >
                                <CheckCheck size={16} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                          <p
                            className={cn(
                              "text-base lg:text-lg leading-relaxed",
                              !notification.read
                                ? "font-bold text-gray-900"
                                : "text-gray-600 font-medium",
                            )}
                          >
                            {highlightMessage(notification.message)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
