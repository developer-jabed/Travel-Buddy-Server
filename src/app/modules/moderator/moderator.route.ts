import express from "express";
import { ModeratorController } from "./moderator.controller";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { moderatorValidationSchemas } from "./moderator.validation";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  ModeratorController.createModerator
);

router.get(
  "/",
  auth(UserRole.ADMIN),
  ModeratorController.getAllFromDB
);

router.get(
  "/:id",
  auth(UserRole.ADMIN),
  ModeratorController.getByIdFromDB
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(moderatorValidationSchemas.update),
  ModeratorController.updateIntoDB
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN),
  ModeratorController.deleteFromDB
);

router.delete(
  "/soft/:id",
  auth(UserRole.ADMIN),
  ModeratorController.softDeleteFromDB
);

export const ModeratorRoutes = router;
