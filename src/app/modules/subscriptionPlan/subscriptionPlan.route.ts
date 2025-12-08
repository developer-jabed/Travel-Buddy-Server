import express from "express";
import { SubscriptionPlanController } from "./subscriptionPlan.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Only admin can create/update/delete plan
router.post("/", auth(UserRole.ADMIN), SubscriptionPlanController.createPlan);
router.get("/", auth(UserRole.ADMIN,UserRole.USER), SubscriptionPlanController.getAllPlans);
router.get("/:id", auth(), SubscriptionPlanController.getPlanById);
router.patch("/:id", auth(UserRole.ADMIN), SubscriptionPlanController.updatePlan);
router.delete("/:id", auth(UserRole.ADMIN), SubscriptionPlanController.deletePlan);

export const SubscriptionPlanRoutes = router;
