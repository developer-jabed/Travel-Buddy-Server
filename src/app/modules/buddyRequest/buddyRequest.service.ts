import prisma from "../../../shared/prisma";
import { BuddyStatus, Prisma } from "@prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import { NotificationService } from "../notification/notification.service";

const createBuddyRequest = async (
  userId: string,
  payload: { tripId?: string | null; receiverId: string }
) => {
  const { tripId, receiverId } = payload;
  if (userId === receiverId) {
    throw new Error("You cannot send a buddy request to yourself.");
  }

  // 🔍 DUPLICATE CHECK (for both directions)
  const exists = await prisma.buddyRequest.findFirst({
    where: {
      OR: [
        // Case 1: current user already sent request
        {
          senderId: userId,
          receiverId,
          status: BuddyStatus.PENDING,
          ...(tripId ? { tripId } : { tripId: null }),
        },
        // Case 2: receiver already sent request to current user
        {
          senderId: receiverId,
          receiverId: userId,
          status: BuddyStatus.PENDING,
          ...(tripId ? { tripId } : { tripId: null }),
        },
      ],
    },
  });

  if (exists) {
    throw new Error("A pending buddy request already exists between you and this user.");
  }

  // 🟢 CREATE REQUEST (tripId is optional)
  const buddyRequest = await prisma.buddyRequest.create({
    data: {
      senderId: userId,
      receiverId,
      tripId: tripId ?? null,
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



/// Admin/Moderator: get all received requests with filters & pagination
const getReceivedBuddyRequests = async (
  authUserId: string,
  filters: { tripId?: string; senderId?: string; status?: string },
  options: IPaginationOptions
) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

  const where: any = {
    receiverId: authUserId, // Only received requests
    status: "PENDING",      // 🔥 Filter out ACCEPTED and REJECTED
  };

  if (filters.tripId) where.tripId = filters.tripId;
  if (filters.senderId) where.senderId = filters.senderId;
  if (filters.status) where.status = filters.status; // override if specific status is passed

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
    meta: { page, limit, total },
    data: requests,
  };
};

// Logged-in user: get own sent requests

// Logged-in user: get own sent requests
const getSentBuddyRequests = async (
  userId: string,
  options: IPaginationOptions
) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

  const where: Prisma.BuddyRequestWhereInput = {
    senderId: userId,
    status: BuddyStatus.PENDING, // Use enum instead of string
  };

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
    meta: { page, limit, total },
    data: requests,
  };
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

  // Ensure only receiver can update the request
  if (request.receiverId !== userId) {
    throw new Error("Unauthorized to update this request");
  }

  let result;

  // ------------------------------
  // ACCEPT REQUEST
  // ------------------------------
  if (status === BuddyStatus.ACCEPTED) {

    // ------------------------------
    // 1️⃣ AUTO CREATE CHAT
    // ------------------------------
    let chat = await prisma.chat.findFirst({
      where: {
        tripId: request.tripId ?? null,
        participants: { some: { userId: request.senderId } },
        AND: { participants: { some: { userId: request.receiverId } } },
      },
      include: { participants: true },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          tripId: request.tripId ?? null,
          participants: {
            create: [
              { userId: request.senderId },
              { userId: request.receiverId },
            ],
          },
        },
        include: { participants: true },
      });
    }

    // ------------------------------
    // 2️⃣ DELETE BUDDY REQUEST
    // ------------------------------
    result = await prisma.buddyRequest.update({
      where: { id: requestId },
      data: { status: BuddyStatus.ACCEPTED },
    });


    // ------------------------------
    // 3️⃣ SOCKET EVENTS
    // ------------------------------
    if (global.io) {
      global.io.to(request.senderId).emit("buddy:updated", {
        requestId,
        status,
        chatId: chat.id,
      });

      global.io.to(request.receiverId).emit("buddy:updated", {
        requestId,
        status,
        chatId: chat.id,
      });
    }

    // ------------------------------
    // 4️⃣ NOTIFICATIONS
    // ------------------------------
    await Promise.all([
      NotificationService.createNotification({
        userId: request.senderId,
        type: "BUDDY_ACCEPTED",
        message: "Your buddy request was accepted!",
        link: `/chats/${chat.id}`,
      }),
      NotificationService.createNotification({
        userId: request.receiverId,
        type: "BUDDY_ACCEPTED",
        message: "You accepted a buddy request.",
        link: `/chats/${chat.id}`,
      }),
    ]);
  }

  // ------------------------------
  // REJECT REQUEST
  // ------------------------------
  else if (status === BuddyStatus.REJECTED) {
    result = await prisma.buddyRequest.delete({
      where: { id: requestId },
    });

    // Notify sender
    await NotificationService.createNotification({
      userId: request.senderId,
      type: "BUDDY_REQUEST",
      message: "Your buddy request was rejected.",
      link: `/buddies/requests`,
    });

    // Socket events
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
  }

  // ------------------------------
  // OPTIONAL STATUS UPDATE
  // ------------------------------
  else {
    result = await prisma.buddyRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  return result;
};




export const BuddyService = {
  createBuddyRequest,
  getReceivedBuddyRequests,
  getSentBuddyRequests,

  updateBuddyRequestStatus
};
