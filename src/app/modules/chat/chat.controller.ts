import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ChatService } from "./chat.service";

// ======================================================
// Create or Get Existing Chat
// ======================================================
export const createChat = catchAsync(async (req, res) => {
  const userA = req.user.id;
  const { userB } = req.body;

  const chat = await ChatService.createOrGetChat(userA, userB);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chat fetched successfully",
    data: chat,
  });
});

// ======================================================
// Send Message
// ======================================================
export const sendMessage = catchAsync(async (req, res) => {
  const senderId = req.user.id;
  const { chatId, text } = req.body;

  if (!chatId || !text) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "chatId and text are required",
      data:""
    });
  }

  const result = await ChatService.sendMessage(senderId, chatId, text);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

// ======================================================
// Get Messages of a Chat
// ======================================================
export const getMessages = catchAsync(async (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.user.id;

  if (!chatId) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "chatId is required",
      data:""
    });
  }

  const result = await ChatService.getMessages(chatId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});

// ======================================================
// Get All Chats for Logged In User
// ======================================================
export const getUserChats = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await ChatService.getUserChats(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User chats retrieved successfully",
    data: result,
  });
});
