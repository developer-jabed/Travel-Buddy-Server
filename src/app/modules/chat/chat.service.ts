import prisma from "../../../shared/prisma";

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

export const sendMessage = async (senderId: string, payload: { chatId: string; text: string }) => {
  return prisma.message.create({
    data: {
      chatId: payload.chatId,
      senderId,
      text: payload.text,
    },
    include: { sender: true },
  });
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
