import { INotification } from "../models/notification.model";
import mongoose from "mongoose";
import { io } from "../app";
import { NotificationRepository } from "../repositories/notifications.repository";

export class NotificationService {
  static async createNotification(
    recipientId: string,
    message: string,
    type: INotification["type"] = "info",
    relatedResource?: {
      type: "post" | "login";
      id: string | mongoose.Types.ObjectId;
      model: "Post" | "RefreshToken";
    },
  ) {
    // 1. Prepare data
    const notificationData: Partial<INotification> = {
      recipient: new mongoose.Types.ObjectId(recipientId),
      message,
      type,
      relatedResource: relatedResource
        ? {
            ...relatedResource,
            id: new mongoose.Types.ObjectId(relatedResource.id),
          }
        : undefined,
    };

    // 2. Persist to Database via Repository
    const notification = await NotificationRepository.create(notificationData);

    // 3. Real-time Emission
    if (io) {
      io.to(recipientId).emit("notification", notification);
    }

    return notification;
  }

  static async getUserNotifications(userId: string, limit = 20, page = 1) {
    const skip = (page - 1) * limit;

    // Use repository for data access
    const notifications = await NotificationRepository.findByUserId(userId, limit, skip);
    const total = await NotificationRepository.countByUserId(userId);

    return { notifications, total, page, pages: Math.ceil(total / limit) };
  }

  static async markAsRead(notificationId: string, userId: string) {
    return NotificationRepository.markAsRead(notificationId, userId);
  }

  static async markAllAsRead(userId: string) {
    return NotificationRepository.markAllAsRead(userId);
  }
}
