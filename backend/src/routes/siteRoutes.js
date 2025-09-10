import { Hono } from "hono";
import * as dbc from "../db/dbconfig.js";
const site = new Hono();

// --- API route ---
site.post("/chat-session", async (c) => {
  const { masterUserId, userIds, title } = await c.req.json();

  if (!Array.isArray(userIds) || userIds.length < 2) {
    return c.json({ ok: false, error: "At least 2 users required" }, 400);
  }

  //make sure userIds are unique
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length !== userIds.length) {
    return c.json(
      { ok: false, error: "Session must have at least 2 unique users" },
      400
    );
  }

  //check if masterUserId is in userIds
  //this is to ensure the master user is in the session and no one is adding random 2 people to the session
  if (!userIds.includes(masterUserId)) {
    return c.json({ ok: false, error: "Master user id not in user ids" }, 400);
  }

  const session = await dbc.createChatSession(userIds, title);
  return c.json({ ok: true, session });
});

site.get("/search-users", async (c) => {
  const searchTerm = c.req.query("searchTerm");
  const users = await dbc.searchUsers(searchTerm);
  return c.json({ ok: true, users });
});

site.get("/recent-users", async (c) => {
  const users = await dbc.getRecentUsers();
  return c.json({ ok: true, users });
});

// --- API route ---
site.get("/chat-sessions", async (c) => {
  const userId = c.req.query("userId");
  const sessions = await dbc.getChatSessions(userId);
  return c.json({ ok: true, sessions });
});

export default site;
