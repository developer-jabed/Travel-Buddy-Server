import httpStatus from "http-status";
import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IJWTPayload } from "../../../types/common";
import ApiError from "../../errors/ApiError";

/**
 * Fetch dashboard metadata for admin or traveler
 */
const fetchDashboardMetaData = async (user: IJWTPayload) => {
  switch (user.role) {
    case UserRole.ADMIN:
      return await getAdminMetaData();
    case UserRole.USER:
      return await getTravelerMetaData(user);
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role!");
  }
};

/* ------------------ ADMIN DASHBOARD ------------------ */
const getAdminMetaData = async () => {
  const [
    totalUsers,
    totalVerifiedUsers,
    totalTrips,
    totalBuddyRequests,
    pendingBuddyRequests,
    totalReports,
    pendingReports,
    payments,
    weeklyUsers,
    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.trip.count(),
    prisma.buddyRequest.count(),
    prisma.buddyRequest.count({ where: { status: "PENDING" } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
    getWeeklyCount("user"),
    getWeeklyCount("trip"),
    getWeeklyCount("buddyRequest"),
    getWeeklyCount("message"),
    getWeeklyCount("review"),
    getWeeklyCount("notification", { where: { isRead: false } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalUsers,
    totalVerifiedUsers,
    totalTrips,
    totalBuddyRequests,
    pendingBuddyRequests,
    totalReports,
    pendingReports,
    totalPayments: payments.length,
    totalRevenue,
    weeklyUsers,
    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  };
};

/* ------------------ TRAVELER DASHBOARD ------------------ */
const getTravelerMetaData = async (user: IJWTPayload) => {
  const userId = user.id;

  const [
    traveler,
    totalTrips,
    pendingBuddyRequests,
    pendingReports,
    reviews,
    notifications,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { TravelerProfile: true, Subscription: true },
    }),
    prisma.trip.count({ where: { userId } }),
    prisma.buddyRequest.count({ where: { receiverId: userId, status: "PENDING" } }),
    prisma.report.count({ where: { reportedId: userId, status: "PENDING" } }),
    prisma.review.findMany({ where: { receiverId: userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const weeklyTrips = await getWeeklyCount("trip", { where: { userId } });
  const weeklyBuddyRequests = await getWeeklyCount("buddyRequest", { where: { receiverId: userId } });
  const weeklyMessages = await getWeeklyCount("message", { where: { senderId: userId } });
  const weeklyReviews = await getWeeklyCount("review", { where: { receiverId: userId } });
  const weeklyNotifications = await getWeeklyCount("notification", { where: { userId, isRead: false } });

  return {
    profile: traveler?.TravelerProfile,
    subscription: traveler?.Subscription,
    totalTrips,
    pendingBuddyRequests,
    pendingReports,
    totalReviews: reviews.length,
    avgRating,
    unreadNotifications: notifications,
    isVerified: traveler?.isVerified ?? false,
    safetyScore: traveler?.safetyScore ?? 80,
    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  };
};

/* ------------------ HELPER ------------------ */
/**
 * Returns count for last 4 weeks for given model
 */
async function getWeeklyCount(
  model: string,
  options: { where?: any } = {}
): Promise<number[]> {
  const counts: number[] = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);

    const where = { ...options.where, createdAt: { gte: start, lt: end } };

    const count = await (prisma as any)[model].count({ where });
    counts.push(count);
  }

  return counts;
}

export const MetaService = {
  fetchDashboardMetaData,
};
