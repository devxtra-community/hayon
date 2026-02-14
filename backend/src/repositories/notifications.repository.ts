import Notification, { INotification } from "../models/notification.model";

export class NotificationRepository {
  static async create(data: Partial<INotification>) {
    return Notification.create(data);
  }

  static async findByUserId(userId: string, limit: number, skip: number) {
    return Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("relatedResource.id");
  }

  static async countByUserId(userId: string) {
    return Notification.countDocuments({ recipient: userId });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true },
    );
  }

  static async markAllAsRead(userId: string) {
    return Notification.updateMany({ recipient: userId, read: false }, { read: true });
  }
}
