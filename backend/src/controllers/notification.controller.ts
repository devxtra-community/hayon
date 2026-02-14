import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import { NotificationService } from "../services/notification.service";
import logger from "../utils/logger";

export default class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      if (!req.auth) {
        return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      }
      const userId = req.auth.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await NotificationService.getUserNotifications(
        userId,
        Number(limit),
        Number(page),
      );

      return new SuccessResponse("Notifications fetched successfully", {
        data: result,
      }).send(res);
    } catch (error) {
      logger.error("Get notifications error", error);
      return new ErrorResponse("Failed to get notifications").send(res);
    }
  }

  static async markRead(req: Request, res: Response) {
    try {
      if (!req.auth) {
        return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      }
      const userId = req.auth.id;
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(id, userId);

      if (!notification) {
        return new ErrorResponse("Notification not found", { status: 404 }).send(res);
      }

      return new SuccessResponse("Notification marked as read", {
        data: notification,
      }).send(res);
    } catch (error) {
      logger.error("Mark notification read error", error);
      return new ErrorResponse("Failed to mark notification as read").send(res);
    }
  }

  static async markAllRead(req: Request, res: Response) {
    try {
      if (!req.auth) {
        return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      }
      const userId = req.auth.id;

      await NotificationService.markAllAsRead(userId);

      return new SuccessResponse("All notifications marked as read").send(res);
    } catch (error) {
      logger.error("Mark all notifications read error", error);
      return new ErrorResponse("Failed to mark all notifications as read").send(res);
    }
  }
}
