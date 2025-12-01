import { Router } from "express";
import * as NotificationController from "./notification.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Create notification (Admin/Moderator only)
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.MODERATOR),
  NotificationController.createNotification
);

// Get notifications for logged-in user
router.get(
  "/me",
  auth(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN),
  NotificationController.getMyNotifications
);

// Mark notification as read
router.put(
  "/:id/read",
  auth(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN),
  NotificationController.markAsRead
);

// Delete notification (owner or admin/moderator)
router.delete(
  "/:id",
  auth(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN),
  NotificationController.deleteNotification
);

export const notificationRouter = router;
