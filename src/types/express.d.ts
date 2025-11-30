import { IAuthUser } from "../interfaces/common";
import { Server as SocketIOServer } from "socket.io";

declare global {
  // Global socket.io instance
  var io: SocketIOServer;

  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export {};
