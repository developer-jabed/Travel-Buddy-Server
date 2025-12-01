import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ReviewService } from "./review.service";

export const createReview = catchAsync(async (req: Request, res: Response) => {
  const reviewerId = req.user.id;
  const review = await ReviewService.createReview(reviewerId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

export const getAllReviews = catchAsync(async (_req, res) => {
  const reviews = await ReviewService.getAllReviews();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully",
    data: reviews,
  });
});

export const getReviewById = catchAsync(async (req, res) => {
  const review = await ReviewService.getReviewById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review retrieved successfully",
    data: review,
  });
});

export const updateReview = catchAsync(async (req, res) => {
  const review = await ReviewService.updateReview(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review updated successfully",
    data: review,
  });
});

export const deleteReview = catchAsync(async (req, res) => {
  const review = await ReviewService.deleteReview(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
    data: review,
  });
});
