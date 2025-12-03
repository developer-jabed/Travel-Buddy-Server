import prisma from "../../../shared/prisma";
import { NotificationService } from "../notification/notification.service";

export const ChatService = {

  // -----------------------------------------------------
  // 1. Create or get existing 1-to-1 chat
  // -----------------------------------------------------
  createOrGetChat: async (userA: string, userB: string) => {
    const existing = await prisma.chat.findFirst({
      where: {
        participants: {
          some: { userId: userA }
        },
        AND: {
          participants: {
            some: { userId: userB }
          }
        }
      },
      include: { participants: true }
    });

    if (existing) return existing;

    const chat = await prisma.chat.create({ data: {} });

    await prisma.chatParticipant.createMany({
      data: [
        { chatId: chat.id, userId: userA },
        { chatId: chat.id, userId: userB }
      ]
    });

    return prisma.chat.findUnique({
      where: { id: chat.id },
      include: { participants: true }
    });
  },

  // -----------------------------------------------------
  // 2. Buddy Accept → create trip chat + participants
  // -----------------------------------------------------
  handleBuddyAccept: async (tripId: string | null, senderId: string, receiverId: string) => {
    let chat = null;

    // If tripId exists → match trip chat
    if (tripId) {
      chat = await prisma.chat.findFirst({
        where: { tripId },
        include: { participants: true }
      });
    }

    // If no existing chat → create
    if (!chat) {
      chat = await prisma.chat.create({
        data: { tripId: tripId || null },
        include: { participants: true }
      });
    }

    // Upsert participants (avoid duplicates)
    const userIds = [senderId, receiverId];

    await Promise.all(
      userIds.map(uid =>
        prisma.chatParticipant.upsert({
          where: {
            // Composite unique (we will add in schema if missing)
            chatId_userId: { chatId: chat.id, userId: uid }
          },
          create: { chatId: chat.id, userId: uid },
          update: {}
        })
      )
    );

    // Send notifications to both users
    await Promise.all([
      NotificationService.createNotification({
        userId: senderId,
        type: "BUDDY_ACCEPTED",
        message: "Your buddy request was accepted!",
        link: `/chats/${chat.id}`
      }),
      NotificationService.createNotification({
        userId: receiverId,
        type: "BUDDY_ACCEPTED",
        message: "You accepted a buddy request.",
        link: `/chats/${chat.id}`
      })
    ]);

    return chat;
  },

  // -----------------------------------------------------
  // 3. Send message (update lastSeen for sender)
  // -----------------------------------------------------
  sendMessage: async (senderId: string, chatId: string, text: string) => {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!chat) throw new Error("Chat not found");

    // Create message
    const message = await prisma.message.create({
      data: { chatId, senderId, text },
      include: { sender: true }
    });

    // Update sender lastSeen
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: senderId },
      data: { lastSeen: new Date() }
    });

    // Notify all recipients
    const recipients = chat.participants.filter(p => p.userId !== senderId);

    await Promise.all(
      recipients.map(p =>
        NotificationService.createNotification({
          userId: p.userId,
          type: "NEW_MESSAGE",
          message: `New message from ${message.sender.name}`,
          link: `/chats/${chatId}`
        })
      )
    );

    return message;
  },

  // -----------------------------------------------------
  // 4. Get messages (and auto-update lastSeen)
  // -----------------------------------------------------
  getMessages: async (chatId: string, userId: string) => {
    // Update lastSeen when user opens a chat
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId },
      data: { lastSeen: new Date() }
    });

    return prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: { sender: true }
    });
  },

  // -----------------------------------------------------
  // 5. List chats with unread count
  // -----------------------------------------------------
  getUserChats: async (userId: string) => {
    const chats = await prisma.chat.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    // Add unreadCount to each chat
    const enhanced = await Promise.all(
      chats.map(async chat => {
        const lastSeen = chat.participants.find(p => p.userId === userId)?.lastSeen;

        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            createdAt: { gt: lastSeen },
            senderId: { not: userId }
          }
        });

        return { ...chat, unreadCount };
      })
    );

    return enhanced;
  }
};
