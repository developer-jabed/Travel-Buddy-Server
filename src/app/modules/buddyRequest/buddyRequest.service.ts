import prisma from "../../../shared/prisma";
import { BuddyStatus } from "@prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";


const createBuddyRequest = async (userId: string, payload: { tripId: string; receiverId: string }) => {
  const buddyRequest = await prisma.buddyRequest.create({
    data: {
      tripId: payload.tripId,
      senderId: userId,
      receiverId: payload.receiverId,
      status: BuddyStatus.PENDING,
    },
  });

  return buddyRequest;
};

// Admin/Moderator: get all with filters & pagination
const getAllBuddyRequests = async (
  filters: { tripId?: string; senderId?: string; receiverId?: string; status?: string },
  options: IPaginationOptions
) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

  const where: any = {};
  if (filters.tripId) where.tripId = filters.tripId;
  if (filters.senderId) where.senderId = filters.senderId;
  if (filters.receiverId) where.receiverId = filters.receiverId;
  if (filters.status) where.status = filters.status;

  const total = await prisma.buddyRequest.count({ where });

  const requests = await prisma.buddyRequest.findMany({
    where,
    include: {
      trip: true,
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: requests,
  };
};

// Logged-in user: get own requests (sent or received)
const getOwnBuddyRequests = async (userId: string, options: IPaginationOptions) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

  const total = await prisma.buddyRequest.count({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });

  const requests = await prisma.buddyRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      trip: true,
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return {
    meta: { page, limit, total },
    data: requests,
  };
};

const deleteBuddyRequest = async (userId: string, requestId: string) => {
  const request = await prisma.buddyRequest.findUniqueOrThrow({
    where: { id: requestId },
  });

  if (request.senderId !== userId && request.receiverId !== userId) {
    throw new Error("Unauthorized to delete this request");
  }

  return prisma.buddyRequest.delete({
    where: { id: requestId },
  });
};

export const BuddyService = {
  createBuddyRequest,
  getAllBuddyRequests,
  getOwnBuddyRequests,
  deleteBuddyRequest,
};
