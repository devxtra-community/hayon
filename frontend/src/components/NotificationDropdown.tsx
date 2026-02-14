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

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

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
    const parts = message.split(/(pending|scheduled)/i);
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
      return part;
    });
  };

  return (
    <DropdownMenu>
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
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-zinc-500 p-4">
              <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-full mb-3">
                <Inbox className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No new notifications for you right now.
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => {
                const postImage =
                  notification.relatedResource?.type === "post"
                    ? notification.relatedResource.id?.content?.mediaItems?.[0]?.s3Url
                    : null;

                return (
                  <DropdownMenuItem
                    key={notification._id}
                    className={cn(
                      "flex items-start gap-3 p-3 mx-1 my-0.5 rounded-md cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800/50 transition-colors",
                      !notification.read
                        ? "bg-blue-50/50 dark:bg-blue-950/10 border-l-2 border-blue-500"
                        : "opacity-80 hover:opacity-100",
                    )}
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    <div className="shrink-0 pt-0.5 relative">
                      {postImage ? (
                        <img
                          src={postImage}
                          alt="Post thumbnail"
                          className="h-20 w-20 object-cover rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm"
                        />
                      ) : (
                        getIcon(notification.type)
                      )}
                      {postImage && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-950 rounded-full p-0.5">
                          {getIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 w-full min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-snug line-clamp-2",
                          !notification.read
                            ? "font-medium text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-600 dark:text-zinc-400",
                        )}
                      >
                        {highlightMessage(notification.message)}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="shrink-0 self-center">
                        <span className="block h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                    )}
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
