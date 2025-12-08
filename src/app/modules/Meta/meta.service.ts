import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IJWTPayload } from "../../../types/common";


const fetchDashboardMetaData = async (user: IJWTPayload) => {
    let metadata;

    switch (user.role) {
        case UserRole.ADMIN:
            metadata = await getAdminMetaData();
            break;

        case UserRole.USER: // Traveler Role
            metadata = await getTravelerMetaData(user);
            break;

        default:
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role!");
    }

    return metadata;
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

    const totalRevenue = payments.reduce((a, b) => a + b.amount, 0);

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
    ] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            include: {
                TravelerProfile: true,
                Subscription: true,
            },
        }),

        prisma.trip.count({ where: { userId } }),

        prisma.buddyRequest.count({
            where: { receiverId: userId, status: "PENDING" },
        }),

        prisma.report.count({
            where: { reportedId: userId, status: "PENDING" },
        }),

        prisma.review.findMany({ where: { receiverId: userId } }),
    ]);

    const avgRating =
        reviews.length > 0
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            : 0;

    return {
        profile: traveler?.TravelerProfile,
        subscription: traveler?.Subscription,
        totalTrips,
        pendingBuddyRequests,
        pendingReports,
        totalReviews: reviews.length,
        avgRating,
        isVerified: traveler?.isVerified ?? false,
        safetyScore: traveler?.safetyScore ?? 80,
    };
};

export const MetaService = {
    fetchDashboardMetaData,
};
