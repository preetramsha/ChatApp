import { drizzle } from "drizzle-orm/libsql";
import "dotenv/config";
import * as s from "./schema.js";
import bcrypt from "bcryptjs";
import {
  eq,
  and,
  sql,
  inArray,
  asc,
  count,
  max,
  gt,
  lt,
  gte,
  ne,
  desc,
  or,
  like,
} from "drizzle-orm";

const db = drizzle(process.env.DB_FILE_NAME);

export const insertUser = async (name, username, password) => {
  const passwordHash = await bcrypt.hash(password, 8);
  //check if username is already taken
  const existingUser = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(eq(s.users.username, username.toLowerCase()));
  if (existingUser.length > 0) {
    throw new Error("Username already taken");
  }
  const user = await db
    .insert(s.users)
    .values({ name, username: username.toLowerCase(), password: passwordHash })
    .returning({
      id: s.users.id,
      username: s.users.username,
      name: s.users.name,
    });
  return user[0];
};

export async function validateUser(username, password) {
  const user = await db
    .select({
      id: s.users.id,
      username: s.users.username,
      name: s.users.name,
      password: s.users.password,
    })
    .from(s.users)
    .where(eq(s.users.username, username.toLowerCase()))
    .limit(1);
  if (user.length < 1) {
    throw new Error("user not found");
  }
  if (!(await bcrypt.compare(password, user[0].password))) {
    throw new Error("Invalid email or password");
  }
  delete user[0].password;
  return user[0];
}

// --- Helper function ---
export async function createChatSession(userIds, title = "Group Chat") {
  if (userIds.length === 2) {
    // --- 1. Check if a private chat already exists ---
    const existing = await db
      .select({ session_id: s.chat_participants.session_id })
      .from(s.chat_participants)
      .where(inArray(s.chat_participants.user_id, userIds));

    // Count how many participants per session
    const grouped = existing.reduce((acc, row) => {
      acc[row.session_id] = (acc[row.session_id] || 0) + 1;
      return acc;
    }, {});

    const existingSessionId = Object.keys(grouped).find(
      (id) => grouped[id] === 2
    );

    if (existingSessionId) {
      // return existing session
      const [session] = await db
        .select()
        .from(s.chat_sessions)
        .where(eq(s.chat_sessions.id, existingSessionId));
      return session;
    }
  }

  // --- 2. Create a new session ---
  const sessionId = await db
    .insert(s.chat_sessions)
    .values({
      title: userIds.length > 2 ? title : null, // groups need a title
    })
    .returning({ id: s.chat_sessions.id });

  // --- 3. Insert participants ---
  const participantRows = userIds.map((uid) => ({
    session_id: sessionId[0].id,
    user_id: uid,
  }));
  await db.insert(s.chat_participants).values(participantRows);

  // --- 4. Return the new session ---
  const [session] = await db
    .select()
    .from(s.chat_sessions)
    .where(eq(s.chat_sessions.id, sessionId[0].id));

  return session;
}

export async function getChatSessions(userId) {
  // Step 1: get all sessions user is part of
  const userSessions = await db
    .select({
      sessionId: s.chat_sessions.id,
      sessionTitle: s.chat_sessions.title,
    })
    .from(s.chat_sessions)
    .innerJoin(
      s.chat_participants,
      eq(s.chat_sessions.id, s.chat_participants.session_id)
    )
    .where(eq(s.chat_participants.user_id, userId));

  const results = [];

  // Step 2: resolve titles
  for (const session of userSessions) {
    if (session.sessionTitle) {
      // Group chat → keep the stored title
      results.push({
        sessionId: session.sessionId,
        displayTitle: session.sessionTitle,
      });
    } else {
      // Private chat → get the "other" participant
      const others = await db
        .select({
          otherUserId: s.users.id,
          otherName: s.users.name,
          otherUsername: s.users.username,
        })
        .from(s.chat_participants)
        .innerJoin(s.users, eq(s.chat_participants.user_id, s.users.id))
        .where(
          and(
            eq(s.chat_participants.session_id, session.sessionId),
            ne(s.users.id, userId) // not the current user
          )
        );

      if (others.length > 0) {
        results.push({
          sessionId: session.sessionId,
          displayTitle: others[0].otherName,
        });
      }
    }
  }

  return results;
}

//search for users by username and name using like operator
export async function searchUsers(searchTerm) {
  const results = await db
    .select({
      id: s.users.id,
      username: s.users.username,
      name: s.users.name,
    })
    .from(s.users)
    .where(
      or(
        like(s.users.username, `%${searchTerm}%`),
        like(s.users.name, `%${searchTerm}%`)
      )
    );

  return results;
}

//get 10 recent users
export async function getRecentUsers() {
  const results = await db
    .select({
      id: s.users.id,
      username: s.users.username,
      name: s.users.name,
    })
    .from(s.users)
    .orderBy(desc(s.users.created_at))
    .limit(10);

  return results;
}

//get all messages for a session
export async function getMessagesForSession(sessionId) {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  const messages = await db
    .select({
      id: s.chat_messages.id,
      senderUsername: s.users.username, // <-- join column
      content: s.chat_messages.content,
      createdAt: s.chat_messages.created_at,
    })
    .from(s.chat_messages)
    .innerJoin(s.users, eq(s.chat_messages.sender_id, s.users.id))
    .where(eq(s.chat_messages.session_id, sessionId))
    .orderBy(asc(s.chat_messages.created_at));

  return messages;
}

export const saveMessage = async (sessionId, senderId, content) => {
  if (!sessionId || !senderId || !content) {
    throw new Error("Missing required fields");
  }
  await db.insert(s.chat_messages).values({
    session_id: sessionId,
    sender_id: senderId,
    content,
  });
};
