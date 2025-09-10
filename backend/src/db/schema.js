import { sql } from "drizzle-orm";
import { text, sqliteTable, index, primaryKey } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

// --- USERS ---
export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()), // Cuid2 ID
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    created_at: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (user) => [
    index("users_username_idx").on(user.username),
    index("users_id_idx").on(user.id),
  ]
);

// --- CHAT SESSIONS ---
export const chat_sessions = sqliteTable(
  "chat_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()), // Cuid2 ID
    title: text("title"), // can be null for private 1-1
    created_at: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (session) => [index("chat_sessions_id_idx").on(session.id)]
);

// --- CHAT PARTICIPANTS (session <-> users) ---
export const chat_participants = sqliteTable(
  "chat_participants",
  {
    session_id: text("session_id")
      .notNull()
      .references(() => chat_sessions.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joined_at: text("joined_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (cp) => [
    primaryKey({ columns: [cp.session_id, cp.user_id] }),
    index("chat_participants_user_idx").on(cp.user_id),
    index("chat_participants_session_idx").on(cp.session_id),
  ]
);

// --- CHAT MESSAGES ---
export const chat_messages = sqliteTable(
  "chat_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()), // Cuid2 ID
    session_id: text("session_id")
      .notNull()
      .references(() => chat_sessions.id, { onDelete: "cascade" }),
    sender_id: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    created_at: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (msg) => [
    index("chat_messages_session_idx").on(msg.session_id),
    index("chat_messages_sender_idx").on(msg.sender_id),
  ]
);
