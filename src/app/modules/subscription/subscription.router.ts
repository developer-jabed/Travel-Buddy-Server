import express from "express";
import { SubscriptionController } from "./subscription.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

// USER: Create subscription
router.post(
  "/",
  auth("USER", "ADMIN"),
  SubscriptionController.createSubscription
);

// ADMIN: Get all subscriptions
router.get(
  "/",
  auth("ADMIN"),
  SubscriptionController.getAllSubscriptions
);

// USER/ADMIN: Get subscription by ID
router.get(
  "//:id",
  auth("USER", "ADMIN"),
  SubscriptionController.getSubscriptionById
);

// ADMIN: Update
router.patch(
  "/:id",
  auth("ADMIN"),
  SubscriptionController.updateSubscription
);

// ADMIN: Delete
router.delete(
  "/:id",
  auth("ADMIN"),
  SubscriptionController.deleteSubscription
);

export const SubscriptionRoutes = router;
