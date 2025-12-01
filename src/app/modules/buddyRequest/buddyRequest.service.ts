import prisma from "../../../shared/prisma";
import { BuddyStatus } from "@prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import { ChatService } from "../chat/chat.service";
import { NotificationService } from "../notification/notification.service";


const createBuddyRequest = async (userId: string, payload: { tripId: string; receiverId: string }) => {

  // Prevent duplicate request
  const exists = await prisma.buddyRequest.findFirst({
    where: {
      senderId: userId,
      receiverId: payload.receiverId,
      tripId: payload.tripId,
      status: BuddyStatus.PENDING,
    }
  });

  if (exists) {
    throw new Error("You already sent a request to this user.");
  }

  const buddyRequest = await prisma.buddyRequest.create({
    data: {
      tripId: payload.tripId,
      senderId: userId,
      receiverId: payload.receiverId,
      status: BuddyStatus.PENDING,
    },
  });

  await NotificationService.createNotification({
    userId: payload.receiverId ,
    type: "BUDDY_REQUEST",
    message: "You received a buddy request",
    link: `/buddies/requests`
  });

  // 🔥 Emit real-time event to receiver
  if (global.io) {
    global.io.to(payload.receiverId).emit("buddy:received", {
      type: "NEW_REQUEST",
      data: buddyRequest,
    });
  }


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

  const deleted = await prisma.buddyRequest.delete({
    where: { id: requestId },
  });

  // 🔥 Notify both users
  if (global.io) {
    global.io.to(request.senderId).emit("buddy:deleted", { requestId });
    global.io.to(request.receiverId).emit("buddy:deleted", { requestId });
  }

  return deleted;
};

// Update status
const updateBuddyRequestStatus = async (
  userId: string,
  requestId: string,
  status: BuddyStatus
) => {
  const request = await prisma.buddyRequest.findUniqueOrThrow({
    where: { id: requestId },
  });

  if (request.receiverId !== userId) {
    throw new Error("Unauthorized to update this request");
  }

  let result;

  if (status === BuddyStatus.ACCEPTED) {
    // When accepted, handle chat
    await ChatService.handleBuddyAccept(request.tripId, request.senderId, request.receiverId);

    // Delete the buddy request after acceptance
    result = await prisma.buddyRequest.delete({
      where: { id: requestId },
    });
  } else if (status === BuddyStatus.REJECTED) {
    // If rejected, delete the request
    result = await prisma.buddyRequest.delete({
      where: { id: requestId },
    });
  } else {
    // Optional: for pending, maybe just update status (if needed)
    result = await prisma.buddyRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  // Notify sender (and receiver if needed)
  if (global.io) {
    global.io.to(request.senderId).emit("buddy:updated", { requestId, status });
    global.io.to(request.receiverId).emit("buddy:updated", { requestId, status });
  }

  // Create notification for sender
  await NotificationService.createNotification({
    userId: request.senderId,
    type: "BUDDY_REQUEST",
    message: `Your buddy request was ${status}`,
    link: `/buddies/requests`,
  });

  return result;
};



export const BuddyService = {
  createBuddyRequest,
  getAllBuddyRequests,
  getOwnBuddyRequests,
  deleteBuddyRequest,
  updateBuddyRequestStatus
};
