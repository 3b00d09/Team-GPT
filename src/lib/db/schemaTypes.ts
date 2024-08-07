import { conversationsTable, messagesTable, usersTable } from "./schema";

export type messageRow = typeof messagesTable.$inferSelect;
export type conversationRow = typeof conversationsTable.$inferSelect;
export type userRow = typeof usersTable.$inferSelect;