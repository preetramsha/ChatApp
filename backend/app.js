// your main app.js file

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ulid } from "ulid";
import authRoutes from "./src/routes/authRoutes.js";
import siteRoutes from "./src/routes/siteRoutes.js";
// 1. Import the new websocket initializer
import { initializeSocketIO } from "./src/routes/wsRoutes.js";

const app = new Hono();

// Your CORS middleware remains the same
app.use(
  "/*",
  cors({
    origin: [
      "https://shinemyresume-frontend.pages.dev",
      "https://shinemyresume.com",
      "https://www.shinemyresume.pages.dev",
      "https://www.shinemyresume.com",
      "https://www.shinemycv.com",
      "https://blog-8fi.pages.dev",
      "https://blogs.shinemyresume.com",
      "https://shinemycv.com",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:3000",
    ],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "Cache-Control",
      "Accept",
      "X-Requested-With",
    ],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono! " + ulid());
});

app.route("/auth", authRoutes);
app.route("/site", siteRoutes);

// 2. Remove the old ws route: app.route("/ws", wsRoutes);

// 3. Start the server and get the native http.Server instance
const server = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

// 4. Attach Socket.IO to the running server
initializeSocketIO(server);
