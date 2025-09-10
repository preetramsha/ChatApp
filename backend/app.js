import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { createId } from "@paralleldrive/cuid2";
import authRoutes from "./src/routes/authRoutes.js";
import siteRoutes from "./src/routes/siteRoutes.js";
import { cors } from "hono/cors";

const app = new Hono();

app.use(logger());

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
    ], // Allow specific origin
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
  return c.text("Hello Hono! " + createId());
});

app.route("/auth", authRoutes);
app.route("/site", siteRoutes);
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
