import httpStatus from "http-status";
import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IJWTPayload } from "../../../types/common";
import ApiError from "../../errors/ApiError";

/* -------------------- HELPER: Weekly Counts -------------------- */
const getWeeklyCounts = async (model: any, field: string, userId?: string) => {
  const today = new Date();
  const counts: number[] = [];

  for (let i = 3; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const where: any = { createdAt: { gte: start, lt: end } };
    if (userId) where[field] = userId;

    const count = await (prisma[model] as any).count({ where });
    counts.push(count);
  }

  return counts;
};

/* -------------------- MAIN SERVICE -------------------- */
const fetchDashboardMetaData = async (user: IJWTPayload) => {
  switch (user.role) {
    case UserRole.ADMIN:
      return await getAdminMetaData();
    case UserRole.USER:
      return await getTravelerMetaData(user.id);
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role!");
  }
};

/* -------------------- ADMIN DASHBOARD -------------------- */
const getAdminMetaData = async () => {
  const [
    totalUsers,
    totalVerifiedUsers,
    totalTrips,
    totalBuddyRequests,
    pendingBuddyRequests,
    totalReports,
    pendingReports,
    totalMessages,
    totalReviews,
    totalNotifications,
    payments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.trip.count(),
    prisma.buddyRequest.count(),
    prisma.buddyRequest.count({ where: { status: "PENDING" } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.message.count(),
    prisma.review.count(),
    prisma.notification.count(),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const weeklyUsers = await getWeeklyCounts("user", "id");
  const weeklyBuddyRequests = await getWeeklyCounts("buddyRequest", "id");
  const weeklyMessages = await getWeeklyCounts("message", "id");
  const weeklyReviews = await getWeeklyCounts("review", "id");
  const weeklyNotifications = await getWeeklyCounts("notification", "id");
  const weeklyTrips = await getWeeklyCounts("trip", "id");

  return {
    totalUsers,
    totalVerifiedUsers,
    totalTrips,
    totalBuddyRequests,
    pendingBuddyRequests,
    totalReports,
    pendingReports,
    totalMessages,
    totalReviews,
    notificationCount: totalNotifications,
    totalRevenue,
    weeklyUsers,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
    weeklyTrips,
  };
};

/* -------------------- TRAVELER DASHBOARD -------------------- */
const getTravelerMetaData = async (userId: string) => {
  const [
    traveler,
    totalTrips,
    pendingBuddyRequests,
    pendingReports,
    reviews,
    notifications,
    totalMessages,
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
    prisma.message.count({ where: { senderId: userId } }),
  ]);

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const weeklyTrips = await getWeeklyCounts("trip", "userId", userId);
  const weeklyBuddyRequests = await getWeeklyCounts("buddyRequest", "receiverId", userId);
  const weeklyMessages = await getWeeklyCounts("message", "senderId", userId);
  const weeklyReviews = await getWeeklyCounts("review", "receiverId", userId);
  const weeklyNotifications = await getWeeklyCounts("notification", "userId", userId);
  const weeklyUsers = await getWeeklyCounts("user", "id"); // total users for context

  return {
    profile: traveler?.TravelerProfile,
    subscription: traveler?.Subscription,
    totalTrips,
    pendingBuddyRequests,
    pendingReports,
    totalMessages,
    totalReviews: reviews.length,
    avgRating,
    notificationCount: notifications,
    isVerified: traveler?.isVerified ?? false,
    safetyScore: traveler?.safetyScore ?? 80,
    weeklyUsers,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
    weeklyTrips,
  };
};

export const MetaService = { fetchDashboardMetaData };
