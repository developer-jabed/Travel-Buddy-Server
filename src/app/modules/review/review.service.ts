import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

interface CreateReviewInput {
  receiverId: string;
  rating: number;
  comment?: string;
}

interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export const ReviewService = {
  // Create review
  createReview: async (reviewerId: string, data: CreateReviewInput) => {
    const { receiverId, rating } = data;

    if (reviewerId === receiverId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "You cannot review yourself");
    }

    // Prevent duplicate review
    const existing = await prisma.review.findFirst({
      where: { reviewerId, receiverId },
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, "You already reviewed this user");
    }

    return prisma.review.create({
      data: { reviewerId, receiverId, rating, comment: data.comment },
    });
  },

  // Get all reviews
  getAllReviews: async () => {
    return prisma.review.findMany({
      include: { reviewer: true, receiver: true },
      orderBy: { createdAt: "desc" },
    });
  },

  // Get single review
  getReviewById: async (id: string) => {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { reviewer: true, receiver: true },
    });
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    return review;
  },

  // Update review (Admin/Moderator)
  updateReview: async (id: string, data: UpdateReviewInput) => {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found");

    return prisma.review.update({
      where: { id },
      data,
    });
  },

  // Delete review (Admin/Moderator)
  deleteReview: async (id: string) => {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found");

    return prisma.review.delete({ where: { id } });
  },
};
