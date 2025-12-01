import { Router } from "express";
import * as ReportController from "./report.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Create report (Only User/Admin/Moderator)
router.post(
  "/",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR),
  ReportController.createReport
);

// Get all reports (Admin + Moderator)
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.MODERATOR),
  ReportController.getAllReports
);

// Get single report (Admin + Moderator)
router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.MODERATOR),
  ReportController.getReportById
);

// Update status (Admin + Moderator)
router.put(
  "/:id/status",
  auth(UserRole.ADMIN, UserRole.MODERATOR),
  ReportController.updateReportStatus
);

// Delete report (Admin + Moderator)
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.MODERATOR),
  ReportController.deleteReport
);

export const reportRoute = router;
