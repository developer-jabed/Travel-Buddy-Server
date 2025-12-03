import prisma from "../../../shared/prisma";
import { BuddyStatus } from "@prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import { ChatService } from "../chat/chat.service";
import { NotificationService } from "../notification/notification.service";

const createBuddyRequest = async (
  userId: string,
  payload: { tripId?: string | null; receiverId: string }
) => {
  const { tripId, receiverId } = payload;

  // 🔍 DUPLICATE CHECK (works for both with & without trip)
  const exists = await prisma.buddyRequest.findFirst({
    where: {
      senderId: userId,
      receiverId,
      status: BuddyStatus.PENDING,
      ...(tripId
        ? { tripId }             // match same trip
        : { tripId: null }),     // match NO trip
    },
  });

  if (exists) {
    throw new Error("You already sent a request to this user.");
  }

  // 🟢 CREATE REQUEST (tripId is optional)
  const buddyRequest = await prisma.buddyRequest.create({
    data: {
      senderId: userId,
      receiverId,
      tripId: tripId ?? null, // ensure null when not provided
      status: BuddyStatus.PENDING,
    },
  });

  // 🔔 Send notification
  await NotificationService.createNotification({
    userId: receiverId,
    type: "BUDDY_REQUEST",
    message: "You received a buddy request",
    link: `/buddies/requests`,
  });

  // 📡 Emit WebSocket event
  if (global.io) {
    global.io.to(receiverId).emit("buddy:received", {
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

  // Ensure only the receiver can update status
  if (request.receiverId !== userId) {
    throw new Error("Unauthorized to update this request");
  }

  let result;

  // ------------------------------
  // ACCEPT REQUEST
  // ------------------------------
  if (status === BuddyStatus.ACCEPTED) {

    // Only create a chat if tripId exists
    if (request.tripId) {
      await ChatService.handleBuddyAccept(
        request.tripId,
        request.senderId,
        request.receiverId
      );
    }

    // Remove the buddy request after it's accepted
    result = await prisma.buddyRequest.delete({
      where: { id: requestId },
    });
  }

  // ------------------------------
  // REJECT REQUEST
  // ------------------------------
  else if (status === BuddyStatus.REJECTED) {
    result = await prisma.buddyRequest.delete({
      where: { id: requestId },
    });
  }

  // ------------------------------
  // OPTIONAL: UPDATE status (Pending → something else)
  // ------------------------------
  else {
    result = await prisma.buddyRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  // ------------------------------
  // SOCKET EVENTS FOR REALTIME UPDATE
  // ------------------------------
  if (global.io) {
    global.io.to(request.senderId).emit("buddy:updated", {
      requestId,
      status,
    });

    global.io.to(request.receiverId).emit("buddy:updated", {
      requestId,
      status,
    });
  }

  // ------------------------------
  // NOTIFICATION FOR SENDER
  // ------------------------------
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
