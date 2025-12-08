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
    // Fetch chat with participants
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: { include: { user: { select: { TravelerProfile: { select: { name: true } } } } } } },
    });

    if (!chat) throw new Error("Chat not found");

    // Create message with sender info
    const message = await prisma.message.create({
      data: { chatId, senderId, text },
      include: {
        sender: {
          select: {
            id: true,
            TravelerProfile: { select: { name: true, profilePhoto: true, } },
          },
        },
      },
    });

    // Update sender's lastSeen
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: senderId },
      data: { lastSeen: new Date() },
    });

    // Return message with sender name
    return {
      id: message.id,
      chatId: message.chatId,
      text: message.text,
      senderId: message.senderId,
      senderName: message.sender.TravelerProfile?.name || "Unknown",
      createdAt: message.createdAt,
    };
  },


  // -----------------------------------------------------
  // 4. Get messages (and auto-update lastSeen)
  // -----------------------------------------------------
  // Get messages for a chat with sender info
  // -----------------------------------------------------
  getMessages: async (chatId: string, userId: string) => {
    // Update lastSeen for current user
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId },
      data: { lastSeen: new Date() },
    });

    // Fetch messages with sender info
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            TravelerProfile: { select: { name: true, profilePhoto: true } },
          },
        },
      },
    });

    return messages.map((m) => ({
      id: m.id,
      text: m.text,
      senderId: m.senderId,
      senderName: m.sender.TravelerProfile?.name || "Unknown",
      senderAvatar: m.sender.TravelerProfile?.profilePhoto || "/default-avatar.png",
      createdAt: m.createdAt,
    }));
  },

  // -----------------------------
  // Get user chats with unread count and profilePhoto
  // -----------------------------
  getUserChats: async (userId: string) => {
    const chats = await prisma.chat.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, TravelerProfile: { select: { name: true, profilePhoto: true } } } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, TravelerProfile: { select: { name: true, profilePhoto: true } } } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enhanced = await Promise.all(
      chats.map(async (chat) => {
        const lastSeen = chat.participants.find((p) => p.userId === userId)?.lastSeen;

        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            createdAt: { gt: lastSeen },
            senderId: { not: userId },
          },
        });

        const otherParticipants = chat.participants
          .filter((p) => p.userId !== userId)
          .map((p) => ({
            id: p.userId,
            name: p.user.TravelerProfile?.name || "Unknown",
            avatar: p.user.TravelerProfile?.profilePhoto || "/default-avatar.png",
          }));

        const lastMessage = chat.messages[0]
          ? {
            id: chat.messages[0].id,
            text: chat.messages[0].text,
            senderId: chat.messages[0].senderId,
            senderName: chat.messages[0].sender.TravelerProfile?.name || "Unknown",
            senderAvatar: chat.messages[0].sender.TravelerProfile?.profilePhoto || "/default-avatar.png",
            createdAt: chat.messages[0].createdAt,
          }
          : null;

        return {
          id: chat.id,
          tripId: chat.tripId,
          participants: otherParticipants,
          lastMessage,
          unreadCount,
        };
      })
    );

    return enhanced;
  },
}