import httpStatus from "http-status";
import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IJWTPayload } from "../../../types/common";
import ApiError from "../../errors/ApiError";

// ────────────────────────────────────────────────
//  Unified interface that both admin & user responses follow
// ────────────────────────────────────────────────
interface DashboardMeta {
  role: "ADMIN" | "USER";

  // Admin-only stats (0 or null for users)
  totalUsers?: number;
  totalVerifiedUsers?: number;
  totalTripsGlobal?: number;
  totalBuddyRequestsGlobal?: number;
  pendingBuddyRequestsGlobal?: number;
  totalReports?: number;
  pendingReports?: number;
  totalSuccessfulPayments?: number;
  totalRevenue?: number;

  // Traveler-specific fields (null/0 for admin)
  profile?: any | null;           // TravelerProfile
  subscription?: any | null;
  isVerified?: boolean;
  safetyScore?: number;
  totalTripsPersonal?: number;
  pendingBuddyRequestsForMe?: number;
  pendingReportsAgainstMe?: number;
  totalReviewsReceived?: number;
  averageRating?: number;
  unreadNotifications?: number;

  // Shared weekly stats (always present, arrays of length 4 – last 4 weeks)
  weeklyTrips: number[];
  weeklyBuddyRequests: number[];
  weeklyMessages: number[];
  weeklyReviews: number[];
  weeklyNotifications: number[];
}

// ────────────────────────────────────────────────
// Main service
// ────────────────────────────────────────────────
export const MetaService = {
  fetchDashboardMetaData: async (user: IJWTPayload): Promise<DashboardMeta> => {
    if (user.role === UserRole.ADMIN) {
      return getAdminDashboardData();
    }

    if (user.role === UserRole.USER) {
      return getUserDashboardData(user);
    }

    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role");
  },
};

// ────────────────────────────────────────────────
// Admin dashboard – full platform stats
// ────────────────────────────────────────────────
async function getAdminDashboardData(): Promise<DashboardMeta> {
  const [
    totalUsers,
    totalVerifiedUsers,
    totalTripsGlobal,
    totalBuddyRequestsGlobal,
    pendingBuddyRequestsGlobal,
    totalReports,
    pendingReports,
    successfulPayments,
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

  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

  const [
    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  ] = await Promise.all([
    getWeeklyCount(prisma.trip),
    getWeeklyCount(prisma.buddyRequest),
    getWeeklyCount(prisma.message),
    getWeeklyCount(prisma.review),
    getWeeklyCount(prisma.notification, { isRead: false }),
  ]);

  return {
    role: "ADMIN",

    totalUsers,
    totalVerifiedUsers,
    totalTripsGlobal,
    totalBuddyRequestsGlobal,
    pendingBuddyRequestsGlobal,
    totalReports,
    pendingReports,
    totalSuccessfulPayments: successfulPayments.length,
    totalRevenue,

    // Traveler fields → not applicable
    profile: null,
    subscription: null,
    isVerified: false,
    safetyScore: 0,
    totalTripsPersonal: 0,
    pendingBuddyRequestsForMe: 0,
    pendingReportsAgainstMe: 0,
    totalReviewsReceived: 0,
    averageRating: 0,
    unreadNotifications: 0,

    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  };
}

// ────────────────────────────────────────────────
// Traveler / User dashboard – personal stats
// ────────────────────────────────────────────────
async function getUserDashboardData(user: IJWTPayload): Promise<DashboardMeta> {
  const userId = user.id;

  const traveler = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      TravelerProfile: true,
      Subscription: true,
    },
  });

  if (!traveler) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found");
  }

  const [
    totalTripsPersonal,
    pendingBuddyRequestsForMe,
    pendingReportsAgainstMe,
    reviewsReceived,
    unreadNotifications,
  ] = await Promise.all([
    prisma.trip.count({ where: { userId } }),
    prisma.buddyRequest.count({ where: { receiverId: userId, status: "PENDING" } }),
    prisma.report.count({ where: { reportedId: userId, status: "PENDING" } }),
    prisma.review.findMany({ where: { receiverId: userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const averageRating =
    reviewsReceived.length > 0
      ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length
      : 0;

  const [
    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  ] = await Promise.all([
    getWeeklyCount(prisma.trip, { userId }),
    getWeeklyCount(prisma.buddyRequest, { receiverId: userId }),
    getWeeklyCount(prisma.message, { senderId: userId }),
    getWeeklyCount(prisma.review, { receiverId: userId }),
    getWeeklyCount(prisma.notification, { userId, isRead: false }),
  ]);

  return {
    role: "USER",

    // Admin fields → not applicable
    totalUsers: 0,
    totalVerifiedUsers: 0,
    totalTripsGlobal: 0,
    totalBuddyRequestsGlobal: 0,
    pendingBuddyRequestsGlobal: 0,
    totalReports: 0,
    pendingReports: 0,
    totalSuccessfulPayments: 0,
    totalRevenue: 0,

    // Traveler-specific
    profile: traveler.TravelerProfile,
    subscription: traveler.Subscription,
    isVerified: traveler.isVerified ?? false,
    safetyScore: traveler.safetyScore ?? 80,
    totalTripsPersonal,
    pendingBuddyRequestsForMe,
    pendingReportsAgainstMe,
    totalReviewsReceived: reviewsReceived.length,
    averageRating,
    unreadNotifications,

    weeklyTrips,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
  };
}

// ────────────────────────────────────────────────
// Helper – last 4 full weeks (most recent first)
// ────────────────────────────────────────────────
async function getWeeklyCount(
  model: any,
  extraWhere: Record<string, any> = {},
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

    try {
      const count = await model.count({
        where: {
          ...extraWhere,
          createdAt: { gte: start, lt: end },
        },
      });
      counts.push(count);
    } catch {
      counts.push(0);
    }
  }

  return counts; // [oldest week, ..., most recent week]
}