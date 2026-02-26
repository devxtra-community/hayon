import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import logger from "../utils/logger";

interface AuthTokenPayload {
  id: string;
  role: string;
}

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [ENV.APP.FRONTEND_URL, "localhost:3000"],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, ENV.AUTH.ACCESS_TOKEN_SECRET) as AuthTokenPayload;
      socket.data.user = decoded;
      return next();
    } catch (err) {
      logger.error("Authentication error", err);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
      logger.info(`User connected to socket 🗃️ ☑️: ${userId}`);
      socket.join(userId);
    }

    socket.on("disconnect", () => {
      logger.info(`User disconnected �️ ☐: ${userId}`);
    });
  });

  return io;
};
