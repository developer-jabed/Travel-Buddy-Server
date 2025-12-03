/*
  Warnings:

  - A unique constraint covering the columns `[chatId,userId]` on the table `chat_participants` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_chatId_userId_key" ON "chat_participants"("chatId", "userId");
