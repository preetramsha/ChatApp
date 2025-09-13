import { Server } from "socket.io";
import * as dbc from "../db/dbconfig.js";
import jwt from "@tsndr/cloudflare-worker-jwt";

export let io; // Export the io instance

export function initializeSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "https://chatapp.donationflex.com",
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (chatSessionId) => {
      socket.join(chatSessionId);
      console.log(`Socket ${socket.id} joined room: ${chatSessionId}`);
    });

    socket.on("chat-message", async (data) => {
      const { chatSessionId, userId, message, senderUsername, token } = data;

      if (!chatSessionId || !userId || !message || !senderUsername || !token) {
        console.error("Invalid message data received:", data);
        socket.emit("error", "Message data is incomplete.");
        return;
      }

      //ignore if message is empty
      if (!message || message.trim() === "") {
        return;
      }

      // Verify token
      const isValid = await jwt.verify(token, process.env.jwtsecret);
      if (!isValid) {
        socket.emit("error", "Invalid token");
        return;
      }
      const decoded = jwt.decode(token).payload;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTimestamp) {
        socket.emit("error", "Token has expired");
        return;
      }

      console.log(`Message received in room ${chatSessionId}:`, message);

      try {
        await dbc.saveMessage(chatSessionId, userId, message);
        io.to(chatSessionId).emit("chat-message", {
          userId,
          message,
          chatSessionId,
          senderUsername,
        });
      } catch (error) {
        console.error("Failed to save or broadcast message:", error);
        socket.emit("error", "Could not process your message.");
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  console.log("Socket.IO initialized");
  return io;
}
