import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { Server } from "socket.io";

// Create a Hono app
const app = new Hono();

// Simple Hono route for testing
app.get("/", (c) => {
  return c.text("Hono + Socket.IO server is running!");
});

// Use the Hono Node.js adapter to create and start the server
const server = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server listening on http://localhost:${info.port}`);
  }
);

// Initialize Socket.IO and attach it to the server instance from the adapter
const io = new Server(server, {
  cors: {
    origin: "*", // Be more specific in production
    methods: ["GET", "POST"],
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for chat messages
  socket.on("chat message", (msg) => {
    console.log("Message received:", msg);
    // Broadcast message to all connected clients
    io.emit("chat message", msg);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
