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
