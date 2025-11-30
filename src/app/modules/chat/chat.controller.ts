import catchAsync from "../../../shared/catchAsync";
import * as chatService from "./chat.service";

export const createChat = catchAsync(async (req, res) => {
  const userA = req.user.id;
  const { userB } = req.body;

  const chat = await chatService.createOrGetChat(userA, userB);

  res.json({ success: true, data: chat });
});

export const sendMessage = catchAsync(async (req, res) => {
  const senderId = req.user.id;
  const result = await chatService.sendMessage(senderId, req.body);

  res.json({ success: true, data: result });
});

export const getMessages = catchAsync(async (req, res) => {
  const result = await chatService.getMessages(req.params.chatId);

  res.json({ success: true, data: result });
});

export const getUserChats = catchAsync(async (req, res) => {
  const result = await chatService.getUserChats(req.user.id);

  res.json({ success: true, data: result });
});
