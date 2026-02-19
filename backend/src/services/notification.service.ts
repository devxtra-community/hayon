import { INotification } from "../models/notification.model";
import mongoose from "mongoose";
import { io } from "../app";
import { NotificationRepository } from "../repositories/notifications.repository";
import admin from "../config/firebase";
import User from "../models/user.model";

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
    options?: {
      image?: string;
      link?: string;
    },
  ) {
    // 1. Prepare data
    const notificationData: Partial<INotification> = {
      recipient: new mongoose.Types.ObjectId(recipientId),
      message,
      type,
      image: options?.image,
      link: options?.link,
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

    // 4. Send Push Notification
    const title =
      type === "success"
        ? "Hayon - Your post has been approved "
        : type === "error"
          ? "Hayon - Your post has been rejected"
          : "Hayon - New Notification";
    await this.sendPushNotification(recipientId, message, title, options?.image, options?.link);

    return notification;
  }

  static async sendPushNotification(
    recipientId: string,
    message: string,
    title: string = "New Notification",
    image?: string,
    link?: string,
  ) {
    try {
      const user = await User.findById(recipientId).select("fcmTokens");

      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        return;
      }

      const messagePayload: any = {
        notification: {
          title,
          body: message,
        },
        tokens: user.fcmTokens,
      };

      if (image) {
        messagePayload.notification.image = image;
      }

      if (link) {
        messagePayload.webpush = {
          fcm_options: {
            link,
          },
        };
      }

      const response = await admin.messaging().sendEachForMulticast(messagePayload);

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(user.fcmTokens[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await User.updateOne(
            { _id: recipientId },
            { $pull: { fcmTokens: { $in: failedTokens } } },
          );
        }
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
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
