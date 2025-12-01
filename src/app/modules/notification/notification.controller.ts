import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { NotificationService } from "./notification.service";

// Create notification (Admin/Moderator)
export const createNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await NotificationService.createNotification(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Notification created successfully",
    data: notification,
  });
});

// Get notifications for logged-in user
export const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const notifications = await NotificationService.getMyNotifications(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    data: notifications,
  });
});

// Mark notification as read
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const notification = await NotificationService.markAsRead(userId, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

// Delete notification (owner or admin/moderator)
export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const notification = await NotificationService.deleteNotification(userId, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification deleted successfully",
    data: notification,
  });
});
