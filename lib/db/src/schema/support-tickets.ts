import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const supportTicketsTable = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("open"),
  summary: text("summary").notNull(),
  originalMessage: text("original_message").notNull(),
  assistantReply: text("assistant_reply").notNull(),
});

export const insertSupportTicketSchema = createInsertSchema(
  supportTicketsTable,
).omit({ createdAt: true });

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTicketsTable.$inferSelect;
