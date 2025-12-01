import prisma from "../../../shared/prisma";
import { NotificationService } from "../notification/notification.service";

export const createOrGetChat = async (userA: string, userB: string) => {
  // Check for existing 1-to-1 chat
  const existing = await prisma.chat.findFirst({
    where: {
      participants: {
        some: { userId: userA },
      },
      AND: {
        participants: {
          some: { userId: userB },
        },
      },
    },
    include: { participants: true },
  });

  if (existing) return existing;

  // Create new chat
  const chat = await prisma.chat.create({ data: {} });

  await prisma.chatParticipant.createMany({
    data: [
      { chatId: chat.id, userId: userA },
      { chatId: chat.id, userId: userB },
    ],
  });

  return prisma.chat.findUnique({
    where: { id: chat.id },
    include: { participants: true },
  });
};

export const sendMessage = async (senderId: string, chatId: string, text: string) => {
  const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { participants: true } });
  if (!chat) throw new Error("Chat not found");

  const message = await prisma.message.create({
    data: { chatId, senderId, text },
    include: { sender: true },
  });

  // 🔔 Send notification to all other participants
  const recipients = chat.participants.filter(p => p.userId !== senderId);
  for (const participant of recipients) {
    await NotificationService.createNotification({
      userId: participant.userId,
      type: "NEW_MESSAGE",
      message: `New message from ${message.sender.name}`,
      link: `/chats/${chatId}`,
    });
  }

  return message;
};

export const getMessages = async (chatId: string) => {
  return prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    include: { sender: true },
  });
};

// Unread count
export const getUserChats = async (userId: string) => {
  return prisma.chat.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
};

export const ChatService = {
  // Called when buddy request is accepted
  handleBuddyAccept: async (tripId: string, senderId: string, receiverId: string) => {
    // 1. Check if a chat for this trip already exists
    let chat = await prisma.chat.findFirst({
      where: { tripId },
    });

    // 2. If no chat, create one
    if (!chat) {
      chat = await prisma.chat.create({ data: { tripId } });
    }

    // 3. Add both sender & receiver to chat (skip if already exists)
    const participantIds = [senderId, receiverId];
    for (const uid of participantIds) {
      const exists = await prisma.chatParticipant.findFirst({
        where: { chatId: chat.id, userId: uid },
      });
      if (!exists) {
        await prisma.chatParticipant.create({
          data: { chatId: chat.id, userId: uid },
        });
      }
    }

    // 4. Send notifications to both users
    await NotificationService.createNotification({
      userId: senderId,
      type: "BUDDY_ACCEPTED",
      message: "Your buddy request was accepted",
      link: `/chats/${chat.id}`,
    });

    await NotificationService.createNotification({
      userId: receiverId,
      type: "BUDDY_ACCEPTED",
      message: "You accepted a buddy request",
      link: `/chats/${chat.id}`,
    });

    return chat;
  },

  // Send a message and notify all participants except sender
  sendMessage: async (senderId: string, chatId: string, text: string) => {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });
    if (!chat) throw new Error("Chat not found");

    const message = await prisma.message.create({
      data: { chatId, senderId, text },
      include: { sender: true },
    });

    // Notify all participants except sender
    const recipients = chat.participants.filter(p => p.userId !== senderId);
    for (const participant of recipients) {
      await NotificationService.createNotification({
        userId: participant.userId,
        type: "NEW_MESSAGE",
        message: `New message from ${message.sender.name}`,
        link: `/chats/${chatId}`,
      });
    }

    return message;
  },
};