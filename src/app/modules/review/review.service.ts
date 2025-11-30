import prisma from "../../../shared/prisma";

interface CreateReviewInput {
  reviewerId: string;
  receiverId: string;
  rating: number;
  comment?: string;
}

interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export const ReviewService = {
  createReview: async (data: CreateReviewInput) => {
    return prisma.review.create({ data });
  },

  getAllReviews: async () => {
    return prisma.review.findMany({
      include: { reviewer: true, receiver: true },
    });
  },

  getReviewById: async (id: string) => {
    return prisma.review.findUnique({
      where: { id },
      include: { reviewer: true, receiver: true },
    });
  },

  updateReview: async (id: string, data: UpdateReviewInput) => {
    return prisma.review.update({
      where: { id },
      data,
    });
  },

  deleteReview: async (id: string) => {
    return prisma.review.delete({ where: { id } });
  },
};
