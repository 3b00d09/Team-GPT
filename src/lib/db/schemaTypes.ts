import { conversationsTable, messagesTable } from "./schema";

export type messageRow = typeof messagesTable.$inferSelect;
export type conversationRow = typeof conversationsTable.$inferSelect;