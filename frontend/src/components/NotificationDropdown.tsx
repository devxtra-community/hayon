"use client";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, Inbox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useState } from "react";
import PlatformIcon from "@/components/ui/PlatformIcon";
import { DropdownMenuPortal } from "@/components/ui/dropdown-menu";

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500 mt-1" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 mt-1" />;
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

      // Status Highlights
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

      // Platform Highlights
      if (lowerPart === "bluesky") {
        return (
          <span key={i} className="text-[#0085ff] font-bold">
            {part}
          </span>
        );
      }
      if (lowerPart === "threads") {
        return (
          <span key={i} className="text-zinc-900 dark:text-zinc-100 font-bold">
            {part}
          </span>
        );
      }
      if (lowerPart === "instagram") {
        return (
          <span key={i} className="text-[#E1306C] font-bold">
            {part}
          </span>
        );
      }
      if (lowerPart === "facebook") {
        return (
          <span key={i} className="text-[#1877F2] font-bold">
            {part}
          </span>
        );
      }
      if (lowerPart === "mastodon") {
        return (
          <span key={i} className="text-[#6364FF] font-bold">
            {part}
          </span>
        );
      }
      if (lowerPart === "tumblr") {
        return (
          <span key={i} className="text-[#35465c] font-bold">
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
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        {isOpen && (
          <div className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] z-40 animate-in fade-in duration-300" />
        )}
      </DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        className="w-[420px] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-base tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-blue-500/20">
                {unreadCount} NEW
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[550px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[350px] text-zinc-500 p-8">
              <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-full mb-4 ring-8 ring-zinc-50 dark:ring-zinc-900/30">
                <Inbox className="h-8 w-8 text-zinc-400" />
              </div>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                All caught up!
              </p>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-[200px]">
                We'll let you know when something important happens.
              </p>
            </div>
          ) : (
            <div className="px-2 py-3 space-y-2">
              {notifications.map((notification) => {
                const postImage =
                  notification.relatedResource?.type === "post"
                    ? notification.relatedResource.id?.content?.mediaItems?.[0]?.s3Url
                    : null;
                const platform = extractPlatform(notification.message);
                const isSuccess = notification.type === "success";
                const isPosted = notification.message.toLowerCase().includes("successfully posted");

                // Only use "Rich Media" layout for actually posted messages
                const useRichLayout = isPosted && postImage;

                return (
                  <DropdownMenuItem
                    key={notification._id}
                    className={cn(
                      "flex flex-col items-stretch p-0 mx-0 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden border border-transparent",
                      !notification.read
                        ? isSuccess
                          ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/50 shadow-sm"
                          : "bg-blue-50/40 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800/50 shadow-sm"
                        : "opacity-90 hover:opacity-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-800",
                      "focus:bg-transparent focus:ring-2 focus:ring-blue-500/20",
                    )}
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    {useRichLayout && (
                      <div className="relative w-full aspect-video group/img overflow-hidden">
                        <img
                          src={postImage}
                          alt="Post thumbnail"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                        {platform && (
                          <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-white/20 ring-1 ring-black/5">
                            <PlatformIcon platform={platform} size={24} />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg ring-2 ring-white dark:ring-zinc-950 animate-in fade-in zoom-in duration-500">
                          <CheckCircle2 className="h-3 w-3" />
                          POSTED
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4 p-4">
                      {!useRichLayout && (
                        <div className="shrink-0 relative mt-0.5">
                          {postImage ? (
                            <div className="relative group/img h-14 w-14">
                              <img
                                src={postImage}
                                alt="Post thumbnail"
                                className="h-14 w-14 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform duration-500 group-hover/img:scale-105"
                              />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "h-12 w-12 flex items-center justify-center rounded-2xl border transition-colors",
                                isSuccess
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800/50"
                                  : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50",
                              )}
                            >
                              {platform ? (
                                <PlatformIcon platform={platform} size={28} />
                              ) : (
                                <div className="scale-125">{getIcon(notification.type)}</div>
                              )}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-950 rounded-full p-1 shadow-md border border-zinc-100 dark:border-zinc-800">
                            {getIcon(notification.type)}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 w-full min-w-0">
                        <p
                          className={cn(
                            "text-[13px] leading-relaxed",
                            !notification.read
                              ? "font-semibold text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-600 dark:text-zinc-400 font-medium",
                          )}
                        >
                          {highlightMessage(notification.message)}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded-md">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            {platform && !useRichLayout && (
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                {platform}
                              </span>
                            )}
                          </div>
                          {!notification.read && (
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                isSuccess
                                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                  : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
