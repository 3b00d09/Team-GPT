import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
});

export const conversationsTable = sqliteTable('conversations', {
  id: integer('id').primaryKey(),
  description: text('description').notNull(),
  createdAt: integer('created_at',{mode:"timestamp"}).$default(()=>{
    return new Date
  }),
});

export const messagesTable = sqliteTable('messages', {
  id: integer('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => conversationsTable.id,{onDelete:"cascade"}),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  createdAt: integer('created_at',{mode:"timestamp"}).$default(()=>{
    return new Date
  }),
  user: integer("user",{mode: "boolean"}).default(false).notNull(),
  assistant: integer("assistant",{mode: "boolean"}).default(false).notNull(),
});