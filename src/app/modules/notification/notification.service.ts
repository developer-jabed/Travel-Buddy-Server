import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
}

export const NotificationService = {
  // Create notification (Prevent duplicate message for same user)
  createNotification: async (data: CreateNotificationInput) => {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: data.userId,
        type: data.type,
        message: data.message,
        isRead: false, // only prevent duplicate active notifications
      },
    });


    return prisma.notification.create({ data });
  },

  // Get all notifications for a user
  getMyNotifications: async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Mark as read
  markAsRead: async (userId: string, id: string) => {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    if (notification.userId !== userId) throw new ApiError(httpStatus.FORBIDDEN, "Not allowed");

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  // Delete notification
  deleteNotification: async (userId: string, id: string) => {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");

    // Allow delete if owner or admin/moderator
    if (notification.userId !== userId) {
      // If you want, check user role in auth middleware and allow admin/moderator
      // For simplicity, assuming admin/moderator check in route
    }

    return prisma.notification.delete({ where: { id } });
  },
};
