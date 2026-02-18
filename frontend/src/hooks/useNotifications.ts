import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/axios";

export interface Notification {
  _id: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  image?: string;
  link?: string;
  relatedResource?: {
    type: "post" | "login";
    id: any; // Populated post or login data
    model: string;
  };
  createdAt: string;
}

export const useNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications`);
        console.log(res);
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.notifications.filter((n: any) => !n.read).length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, []);

  // Listen for real-time
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};
