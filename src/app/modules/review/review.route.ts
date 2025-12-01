import { Router } from "express";
import * as ReviewController from "./review.controller";

const router = Router();

router.post("/", ReviewController.createReview);
router.get("/", ReviewController.getAllReviews);
router.get("/:id", ReviewController.getReviewById);
router.put("/:id", ReviewController.updateReview);
router.delete("/:id", ReviewController.deleteReview);

export const reviewRouter = router;
