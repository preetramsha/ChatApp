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
  try {
    const session = await dbc.createChatSession(userIds, title);
    return c.json({ ok: true, session });
  } catch (e) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

site.get("/search-users", async (c) => {
  const searchTerm = c.req.query("searchTerm");
  try {
    const users = await dbc.searchUsers(searchTerm);
    return c.json({ ok: true, users });
  } catch (e) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

site.get("/recent-users", async (c) => {
  try {
    const users = await dbc.getRecentUsers();
    return c.json({ ok: true, users });
  } catch (e) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

// --- API route ---
site.get("/chat-sessions", async (c) => {
  const userId = c.req.query("userId");
  try {
    console.log("userId", userId);
    const sessions = await dbc.getChatSessions(userId);
    return c.json({ ok: true, sessions });
  } catch (e) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

//get all messages for a session
site.get("/messages", async (c) => {
  const sessionId = c.req.query("sessionId");
  try {
    const messages = await dbc.getMessagesForSession(sessionId);
    return c.json({ ok: true, messages });
  } catch (e) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

export default site;
