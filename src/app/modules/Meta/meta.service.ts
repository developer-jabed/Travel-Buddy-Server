import httpStatus from "http-status";
import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IJWTPayload } from "../../../types/common";
import ApiError from "../../errors/ApiError";

// Main function
export const MetaService = {
  fetchDashboardMetaData: async (user: IJWTPayload) => {
    if (user.role === UserRole.ADMIN) return getAdminMetaData();
    if (user.role === UserRole.USER) return getTravelerMetaData(user);
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role!");
  },
};

// ------------------ ADMIN DASHBOARD ------------------
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
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.trip.count(),
    prisma.buddyRequest.count(),
    prisma.buddyRequest.count({ where: { status: "PENDING" } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Weekly counts
  const weeklyUsers = await getWeeklyCount(prisma.user);
  const weeklyTrips = await getWeeklyCount(prisma.trip);
  const weeklyBuddyRequests = await getWeeklyCount(prisma.buddyRequest);
  const weeklyMessages = await getWeeklyCount(prisma.message);
  const weeklyReviews = await getWeeklyCount(prisma.review);
  const weeklyNotifications = await getWeeklyCount(prisma.notification, { isRead: false });

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

// ------------------ TRAVELER DASHBOARD ------------------
const getTravelerMetaData = async (user: IJWTPayload) => {
  const userId = user.id;

  const traveler = await prisma.user.findUnique({
    where: { id: userId },
    include: { TravelerProfile: true, Subscription: true },
  });

  const totalTrips = await prisma.trip.count({ where: { userId } });
  const pendingBuddyRequests = await prisma.buddyRequest.count({ where: { receiverId: userId, status: "PENDING" } });
  const pendingReports = await prisma.report.count({ where: { reportedId: userId, status: "PENDING" } });
  const reviews = await prisma.review.findMany({ where: { receiverId: userId } });
  const unreadNotifications = await prisma.notification.count({ where: { userId, isRead: false } });

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Weekly counts
  const weeklyTrips = await getWeeklyCount(prisma.trip, { userId });
  const weeklyBuddyRequests = await getWeeklyCount(prisma.buddyRequest, { receiverId: userId });
  const weeklyMessages = await getWeeklyCount(prisma.message, { senderId: userId });
  const weeklyReviews = await getWeeklyCount(prisma.review, { receiverId: userId });
  const weeklyNotifications = await getWeeklyCount(prisma.notification, { userId, isRead: false });

  return {
    profile: traveler?.TravelerProfile,
    subscription: traveler?.Subscription,
    totalTrips,
    pendingBuddyRequests,
    pendingReports,
    totalReviews: reviews.length,
    avgRating,
    unreadNotifications,
    isVerified: traveler?.isVerified ?? false,
    safetyScore: traveler?.safetyScore ?? 80,
    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  };
};

// ------------------ HELPER: WEEKLY COUNTS ------------------
async function getWeeklyCount(modelClient: any, where: any = {}) {
  const counts: number[] = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);

    try {
      const count = await modelClient.count({ where: { ...where, createdAt: { gte: start, lt: end } } });
      counts.push(count);
    } catch {
      counts.push(0);
    }
  }

  return counts;
}
