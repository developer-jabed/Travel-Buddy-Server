import { Router } from "express";
import * as ReviewController from "./review.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Create review (user, moderator, admin)
router.post(
  "/",
  auth(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN),
  ReviewController.createReview
);

// Get all reviews (moderator, admin)
router.get(
  "/",
  auth(),
  ReviewController.getAllReviews
);

// Get one review (moderator, admin)
router.get(
  "/:id",
  auth(),
  ReviewController.getReviewById
);

// Update review (moderator, admin)
router.put(
  "/:id",
  auth(),
  ReviewController.updateReview
);

// Delete review (moderator, admin)
router.delete(
  "/:id",
  auth(),
  ReviewController.deleteReview
);

export const reviewRouter = router;
