import http, { Server } from "http";
import app from "./app";
import { Server as SocketIOServer } from "socket.io";
import seedSuperAdmin from "./helpers/seed";
import config from "./config";
import prisma from "./shared/prisma";

async function bootstrap() {
  let server: Server;

  try {
    await seedSuperAdmin();

    // Create HTTP Server
    server = http.createServer(app);

    // Socket.io Setup
    const io = new SocketIOServer(server, {
      cors: {
        origin: "*",
      },
    });

    // 👉 Store socket instance globally for reuse
    global.io = io;

    // Keep a map of online users
    const onlineUsers = new Map<string, string>();

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("join", (userId: string) => {
        onlineUsers.set(userId, socket.id);
        io.emit("online-users", Array.from(onlineUsers.keys()));
      });

      socket.on("join-chat", (chatId: string) => {
        socket.join(chatId);
      });

      socket.on("typing", ({ chatId, userId }) => {
        socket.to(chatId).emit("typing", userId);
      });

      socket.on("send-message", async ({ chatId, senderId, text }) => {
        const message = await prisma.message.create({
          data: { chatId, senderId, text },
        });
        io.to(chatId).emit("new-message", message);
      });

      socket.on("disconnect", () => {
        for (const [uId, sId] of onlineUsers.entries()) {
          if (sId === socket.id) onlineUsers.delete(uId);
        }
        io.emit("online-users", Array.from(onlineUsers.keys()));
      });
    });

    // Start server
    server.listen(config.port, () => {
      console.log(`🚀 Server running: http://localhost:${config.port}`);
    });

    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log("Server closed gracefully.");
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    process.on("unhandledRejection", (error) => {
      console.log("Unhandled Rejection detected!");
      console.error(error);
      exitHandler();
    });

    process.on("uncaughtException", (error) => {
      console.log("Uncaught Exception detected!");
      console.error(error);
      exitHandler();
    });
  } catch (error) {
    console.error("🔥 Startup Error:", error);
    process.exit(1);
  }
}

bootstrap();
