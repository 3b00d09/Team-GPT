import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("user", {
  id: text("id").primaryKey().notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userSessionsTable = sqliteTable("session", {
  id: text("id").primaryKey().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

export const conversationsTable = sqliteTable("conversations", {
  id: integer("id").primaryKey(),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$default(() => {
    return new Date();
  }),
});

export const messagesTable = sqliteTable("messages", {
  id: integer("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversationsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$default(() => {
    return new Date();
  }),
  user: integer("user", { mode: "boolean" }).default(false).notNull(),
  assistant: integer("assistant", { mode: "boolean" }).default(false).notNull(),
});
