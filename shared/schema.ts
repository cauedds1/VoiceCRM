import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
export * from "./models/chat";

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  industry: text("industry"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  city: text("city"),
  state: text("state"),
  logoUrl: text("logo_url"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role"),
  phone: text("phone"),
  email: text("email"),
  companyId: varchar("company_id"),
  companyName: text("company_name"),
  notes: text("notes"),
  city: text("city"),
  state: text("state"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetingFolders = pgTable("meeting_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  topic: text("topic"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary"),
  transcription: text("transcription"),
  audioUrl: text("audio_url"),
  topic: text("topic"),
  folderId: varchar("folder_id"),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull().default("completed"),
  category: text("category").notNull().default("meeting"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetingContacts = pgTable("meeting_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull(),
  contactId: varchar("contact_id").notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  meetingId: varchar("meeting_id"),
  contactId: varchar("contact_id"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const decisions = pgTable("decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  meetingId: varchar("meeting_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  interfaceLanguage: text("interface_language").notNull().default("pt-BR"),
  transcriptionLanguage: text("transcription_language").notNull().default("pt-BR"),
  taskExtractionLevel: text("task_extraction_level").notNull().default("aggressive"),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, { fields: [contacts.companyId], references: [companies.id] }),
  meetingContacts: many(meetingContacts),
}));

export const meetingFoldersRelations = relations(meetingFolders, ({ many }) => ({
  meetings: many(meetings),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  folder: one(meetingFolders, { fields: [meetings.folderId], references: [meetingFolders.id] }),
  meetingContacts: many(meetingContacts),
  tasks: many(tasks),
  decisions: many(decisions),
}));

export const meetingContactsRelations = relations(meetingContacts, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingContacts.meetingId], references: [meetings.id] }),
  contact: one(contacts, { fields: [meetingContacts.contactId], references: [contacts.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  meeting: one(meetings, { fields: [tasks.meetingId], references: [meetings.id] }),
  contact: one(contacts, { fields: [tasks.contactId], references: [contacts.id] }),
}));

export const decisionsRelations = relations(decisions, ({ one }) => ({
  meeting: one(meetings, { fields: [decisions.meetingId], references: [meetings.id] }),
}));

export const insertMeetingFolderSchema = createInsertSchema(meetingFolders).omit({ id: true, createdAt: true });
export type InsertMeetingFolder = z.infer<typeof insertMeetingFolderSchema>;
export type MeetingFolder = typeof meetingFolders.$inferSelect;

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true });
export const insertMeetingContactSchema = createInsertSchema(meetingContacts).omit({ id: true });

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisions.$inferSelect;
export type MeetingContact = typeof meetingContacts.$inferSelect;
