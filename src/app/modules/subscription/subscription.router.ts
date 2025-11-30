import express from "express";
import auth from "../../middlewares/auth";
import { SubscriptionController } from "./subscription.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/subscribe",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR),
  SubscriptionController.createSubscription
);

router.get(
  "/me",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR),
  SubscriptionController.getMySubscription
);

export const SubscriptionRoutes = router;
