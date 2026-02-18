import {
  companies, contacts, meetings, meetingContacts, tasks, decisions, userSettings, meetingFolders,
  type Company, type InsertCompany,
  type Contact, type InsertContact,
  type Meeting, type InsertMeeting,
  type Task, type InsertTask,
  type Decision, type InsertDecision,
  type UserSettings,
  type MeetingFolder, type InsertMeetingFolder,
} from "@shared/schema";
import { users, sessions } from "@shared/models/auth";
import { db } from "./db";
import { eq, and, desc, ilike, sql } from "drizzle-orm";

export interface IStorage {
  getCompanies(userId: string): Promise<Company[]>;
  getCompany(id: string, userId: string): Promise<Company | undefined>;
  getCompanyByName(name: string, userId: string): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;
  updateCompany(id: string, userId: string, data: Partial<Company>): Promise<Company | undefined>;

  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: string, userId: string): Promise<Contact | undefined>;
  getContactByNameAndCompany(name: string, companyName: string | null, userId: string): Promise<Contact | undefined>;
  createContact(data: InsertContact): Promise<Contact>;
  updateContact(id: string, userId: string, data: Partial<Contact>): Promise<Contact | undefined>;

  getMeetings(userId: string): Promise<Meeting[]>;
  getMeeting(id: string, userId: string): Promise<Meeting | undefined>;
  createMeeting(data: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, userId: string, data: Partial<Meeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string, userId: string): Promise<void>;

  getMeetingContacts(meetingId: string): Promise<Contact[]>;
  addMeetingContact(meetingId: string, contactId: string): Promise<void>;

  getTasks(userId: string): Promise<Task[]>;
  getTasksByMeeting(meetingId: string): Promise<Task[]>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, userId: string, data: Partial<Task>): Promise<Task | undefined>;

  getDecisionsByMeeting(meetingId: string): Promise<Decision[]>;
  createDecision(data: InsertDecision): Promise<Decision>;

  getContactMeetings(contactId: string): Promise<Meeting[]>;
  getCompanyContacts(companyId: string, userId: string): Promise<Contact[]>;
  getCompanyMeetings(companyId: string, userId: string): Promise<Meeting[]>;

  getMeetingFolders(userId: string): Promise<MeetingFolder[]>;
  getMeetingFolder(id: string, userId: string): Promise<MeetingFolder | undefined>;
  createMeetingFolder(data: InsertMeetingFolder): Promise<MeetingFolder>;
  updateMeetingFolder(id: string, userId: string, data: Partial<MeetingFolder>): Promise<MeetingFolder | undefined>;
  deleteMeetingFolder(id: string, userId: string): Promise<void>;
  getMeetingsByFolder(folderId: string, userId: string): Promise<Meeting[]>;
  findFolderByTopic(topic: string, userId: string): Promise<MeetingFolder | undefined>;

  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;
  deleteUserAccount(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCompanies(userId: string): Promise<Company[]> {
    return db.select().from(companies).where(eq(companies.userId, userId)).orderBy(companies.name);
  }

  async getCompany(id: string, userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
    return company;
  }

  async getCompanyByName(name: string, userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.userId, userId), ilike(companies.name, name)));
    return company;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  async updateCompany(id: string, userId: string, data: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db.update(companies).set(data)
      .where(and(eq(companies.id, id), eq(companies.userId, userId))).returning();
    return company;
  }

  async getContacts(userId: string): Promise<Contact[]> {
    return db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(contacts.name);
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact;
  }

  async getContactByNameAndCompany(name: string, companyName: string | null, userId: string): Promise<Contact | undefined> {
    if (companyName) {
      const [contact] = await db.select().from(contacts)
        .where(and(eq(contacts.userId, userId), ilike(contacts.name, name), ilike(contacts.companyName, companyName)));
      return contact;
    }
    const [contact] = await db.select().from(contacts)
      .where(and(eq(contacts.userId, userId), ilike(contacts.name, name)));
    return contact;
  }

  async createContact(data: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(data).returning();
    return contact;
  }

  async updateContact(id: string, userId: string, data: Partial<Contact>): Promise<Contact | undefined> {
    const [contact] = await db.update(contacts).set(data)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId))).returning();
    return contact;
  }

  async getMeetings(userId: string): Promise<Meeting[]> {
    return db.select().from(meetings).where(eq(meetings.userId, userId)).orderBy(desc(meetings.createdAt));
  }

  async getMeeting(id: string, userId: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(and(eq(meetings.id, id), eq(meetings.userId, userId)));
    return meeting;
  }

  async createMeeting(data: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values(data).returning();
    return meeting;
  }

  async updateMeeting(id: string, userId: string, data: Partial<Meeting>): Promise<Meeting | undefined> {
    const [meeting] = await db.update(meetings).set(data)
      .where(and(eq(meetings.id, id), eq(meetings.userId, userId))).returning();
    return meeting;
  }

  async deleteMeeting(id: string, userId: string): Promise<void> {
    const [meeting] = await db.select().from(meetings).where(and(eq(meetings.id, id), eq(meetings.userId, userId)));
    if (!meeting) return;
    await db.delete(meetingContacts).where(eq(meetingContacts.meetingId, id));
    await db.delete(tasks).where(eq(tasks.meetingId, id));
    await db.delete(decisions).where(eq(decisions.meetingId, id));
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  async getMeetingContacts(meetingId: string): Promise<Contact[]> {
    const links = await db.select().from(meetingContacts).where(eq(meetingContacts.meetingId, meetingId));
    if (links.length === 0) return [];
    const result: Contact[] = [];
    for (const link of links) {
      const [c] = await db.select().from(contacts).where(eq(contacts.id, link.contactId));
      if (c) result.push(c);
    }
    return result;
  }

  async addMeetingContact(meetingId: string, contactId: string): Promise<void> {
    await db.insert(meetingContacts).values({ meetingId, contactId }).onConflictDoNothing();
  }

  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByMeeting(meetingId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.meetingId, meetingId));
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async updateTask(id: string, userId: string, data: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(data)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
    return task;
  }

  async getDecisionsByMeeting(meetingId: string): Promise<Decision[]> {
    return db.select().from(decisions).where(eq(decisions.meetingId, meetingId));
  }

  async createDecision(data: InsertDecision): Promise<Decision> {
    const [decision] = await db.insert(decisions).values(data).returning();
    return decision;
  }

  async getContactMeetings(contactId: string): Promise<Meeting[]> {
    const links = await db.select().from(meetingContacts).where(eq(meetingContacts.contactId, contactId));
    if (links.length === 0) return [];
    const result: Meeting[] = [];
    for (const link of links) {
      const [m] = await db.select().from(meetings).where(eq(meetings.id, link.meetingId));
      if (m) result.push(m);
    }
    return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getCompanyContacts(companyId: string, userId: string): Promise<Contact[]> {
    return db.select().from(contacts)
      .where(and(eq(contacts.companyId, companyId), eq(contacts.userId, userId)))
      .orderBy(contacts.name);
  }

  async getCompanyMeetings(companyId: string, userId: string): Promise<Meeting[]> {
    const companyContacts = await this.getCompanyContacts(companyId, userId);
    if (companyContacts.length === 0) return [];
    const meetingIds = new Set<string>();
    const result: Meeting[] = [];
    for (const contact of companyContacts) {
      const links = await db.select().from(meetingContacts).where(eq(meetingContacts.contactId, contact.id));
      for (const link of links) {
        if (!meetingIds.has(link.meetingId)) {
          meetingIds.add(link.meetingId);
          const [m] = await db.select().from(meetings)
            .where(and(eq(meetings.id, link.meetingId), eq(meetings.userId, userId)));
          if (m) result.push(m);
        }
      }
    }
    return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getMeetingFolders(userId: string): Promise<MeetingFolder[]> {
    return db.select().from(meetingFolders).where(eq(meetingFolders.userId, userId)).orderBy(desc(meetingFolders.createdAt));
  }

  async getMeetingFolder(id: string, userId: string): Promise<MeetingFolder | undefined> {
    const [folder] = await db.select().from(meetingFolders).where(and(eq(meetingFolders.id, id), eq(meetingFolders.userId, userId)));
    return folder;
  }

  async createMeetingFolder(data: InsertMeetingFolder): Promise<MeetingFolder> {
    const [folder] = await db.insert(meetingFolders).values(data).returning();
    return folder;
  }

  async updateMeetingFolder(id: string, userId: string, data: Partial<MeetingFolder>): Promise<MeetingFolder | undefined> {
    const [folder] = await db.update(meetingFolders).set(data)
      .where(and(eq(meetingFolders.id, id), eq(meetingFolders.userId, userId))).returning();
    return folder;
  }

  async deleteMeetingFolder(id: string, userId: string): Promise<void> {
    await db.update(meetings).set({ folderId: null })
      .where(and(eq(meetings.folderId, id), eq(meetings.userId, userId)));
    await db.delete(meetingFolders).where(and(eq(meetingFolders.id, id), eq(meetingFolders.userId, userId)));
  }

  async getMeetingsByFolder(folderId: string, userId: string): Promise<Meeting[]> {
    return db.select().from(meetings)
      .where(and(eq(meetings.folderId, folderId), eq(meetings.userId, userId)))
      .orderBy(desc(meetings.createdAt));
  }

  async findFolderByTopic(topic: string, userId: string): Promise<MeetingFolder | undefined> {
    const [folder] = await db.select().from(meetingFolders)
      .where(and(eq(meetingFolders.userId, userId), ilike(meetingFolders.topic, topic)));
    return folder;
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [updated] = await db.update(userSettings).set(data)
        .where(eq(userSettings.userId, userId)).returning();
      return updated;
    }
    const [created] = await db.insert(userSettings).values({ userId, ...data }).returning();
    return created;
  }

  async deleteUserAccount(userId: string): Promise<void> {
    const userMeetings = await db.select().from(meetings).where(eq(meetings.userId, userId));
    for (const meeting of userMeetings) {
      await db.delete(meetingContacts).where(eq(meetingContacts.meetingId, meeting.id));
      await db.delete(tasks).where(eq(tasks.meetingId, meeting.id));
      await db.delete(decisions).where(eq(decisions.meetingId, meeting.id));
    }
    await db.delete(meetings).where(eq(meetings.userId, userId));
    await db.delete(meetingFolders).where(eq(meetingFolders.userId, userId));
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(contacts).where(eq(contacts.userId, userId));
    await db.delete(companies).where(eq(companies.userId, userId));
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    await db.delete(sessions).where(sql`(sess->>'passport')::jsonb->>'user' = ${userId}`);
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
