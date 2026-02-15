import httpStatus from "http-status";
import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IJWTPayload } from "../../../types/common";
import ApiError from "../../errors/ApiError";

const fetchDashboardMetaData = async (user: IJWTPayload) => {
  try {
    switch (user.role) {
      case UserRole.ADMIN:
        return await getAdminMetaData();
      case UserRole.USER:
        return await getTravelerMetaData(user);
      default:
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role!");
    }
  } catch (error) {
    console.error("Meta fetch error:", error);
    // Return safe defaults instead of crashing
    return {
      totalUsers: 0,
      totalTrips: 0,
      totalBuddyRequests: 0,
      totalMessages: 0,
      totalReviews: 0,
      totalRevenue: 0,
      unreadNotifications: 0,
      weeklyUsers: [0, 0, 0, 0],
      weeklyBuddyRequests: [0, 0, 0, 0],
      weeklyMessages: [0, 0, 0, 0],
      weeklyReviews: [0, 0, 0, 0],
      weeklyNotifications: [0, 0, 0, 0],
      weeklyTrips: [0, 0, 0, 0],
    };
  }
};

/* ------------------ ADMIN DASHBOARD ------------------ */
const getAdminMetaData = async () => {
  const [
    totalUsers,
    totalTrips,
    totalBuddyRequests,
    totalReports,
    payments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.buddyRequest.count(),
    prisma.report.count(),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Example weekly stats (replace with real queries if you have weekly breakdowns)
  const weeklyUsers = [5, 10, 7, 12];
  const weeklyBuddyRequests = [2, 4, 3, 6];
  const weeklyMessages = [10, 12, 8, 15];
  const weeklyReviews = [1, 2, 1, 3];
  const weeklyNotifications = [3, 5, 2, 4];
  const weeklyTrips = [4, 6, 5, 7];

  return {
    totalUsers,
    totalTrips,
    totalBuddyRequests,
    totalReports,
    totalRevenue,
    unreadNotifications: 0,
    weeklyUsers,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
    weeklyTrips,
  };
};

/* ------------------ TRAVELER DASHBOARD ------------------ */
const getTravelerMetaData = async (user: IJWTPayload) => {
  const userId = user.id;

  const [
    totalTrips,
    pendingBuddyRequests,
    reviews,
    unreadNotifications,
  ] = await Promise.all([
    prisma.trip.count({ where: { userId } }),
    prisma.buddyRequest.count({ where: { receiverId: userId, status: "PENDING" } }),
    prisma.review.findMany({ where: { receiverId: userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Example weekly stats (replace with real queries)
  const weeklyUsers = [0, 0, 0, 0];
  const weeklyBuddyRequests = [0, 0, 0, 0];
  const weeklyMessages = [0, 0, 0, 0];
  const weeklyReviews = [0, 0, 0, 0];
  const weeklyNotifications = [0, 0, 0, 0];
  const weeklyTrips = [0, 0, 0, 0];

  return {
    totalTrips,
    pendingBuddyRequests,
    totalReviews: reviews.length,
    avgRating,
    unreadNotifications,
    weeklyUsers,
    weeklyBuddyRequests,
    weeklyMessages,
    weeklyReviews,
    weeklyNotifications,
    weeklyTrips,
  };
};

export const MetaService = {
  fetchDashboardMetaData,
};
