import {
  companies, contacts, meetings, meetingContacts, tasks, decisions, userSettings, meetingFolders, meetingAttachments,
  type Company, type InsertCompany,
  type Contact, type InsertContact,
  type Meeting, type InsertMeeting,
  type Task, type InsertTask,
  type Decision, type InsertDecision,
  type UserSettings,
  type MeetingFolder, type InsertMeetingFolder,
  type MeetingAttachment, type InsertMeetingAttachment,
} from "@shared/schema";
import { users, sessions } from "@shared/models/auth";
import { db } from "./db";
import { eq, and, desc, ilike, sql, gte, lte, or } from "drizzle-orm";

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

  getMeetingsByDateRange(userId: string, start: Date, end: Date): Promise<Meeting[]>;

  mergeCompanies(sourceId: string, targetId: string, userId: string): Promise<{ mergedContacts: number; movedContacts: number; movedMeetings: number }>;
  deleteCompany(id: string, userId: string): Promise<void>;

  getAttachments(meetingId: string): Promise<MeetingAttachment[]>;
  createAttachment(data: InsertMeetingAttachment): Promise<MeetingAttachment>;
  deleteAttachment(id: string, userId: string): Promise<void>;

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
    let oldName: string | undefined;
    if (data.name) {
      const existing = await this.getCompany(id, userId);
      if (existing) oldName = existing.name;
    }

    const [company] = await db.update(companies).set(data)
      .where(and(eq(companies.id, id), eq(companies.userId, userId))).returning();

    if (company && data.name && oldName && oldName !== data.name) {
      await db.update(contacts).set({ companyName: data.name })
        .where(and(eq(contacts.companyId, id), eq(contacts.userId, userId)));

      await this.syncFolderCompanyName(oldName, data.name, userId);
    }
    return company;
  }

  private async syncFolderCompanyName(oldName: string, newName: string, userId: string): Promise<void> {
    const allFolders = await db.select().from(meetingFolders)
      .where(eq(meetingFolders.userId, userId));

    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const oldNorm = normalize(oldName);

    for (const folder of allFolders) {
      if (!folder.topic) continue;
      const topicNorm = normalize(folder.topic);
      if (!topicNorm.includes(oldNorm)) continue;

      const newTopic = folder.topic.replace(new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), newName);
      if (newTopic === folder.topic) continue;

      await db.update(meetingFolders).set({ name: newTopic, topic: newTopic })
        .where(eq(meetingFolders.id, folder.id));

      await db.update(meetings).set({ topic: newTopic })
        .where(and(eq(meetings.folderId, folder.id), eq(meetings.userId, userId)));
    }

    await this.mergeDuplicateFolders(userId);
  }

  private async mergeDuplicateFolders(userId: string): Promise<void> {
    const allFolders = await db.select().from(meetingFolders)
      .where(eq(meetingFolders.userId, userId));

    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    const stopWords = new Set(["de","da","do","das","dos","com","para","por","em","no","na","nos","nas","um","uma","o","a","os","as","e","ou","sobre","the","of","for","and","in","on","with","to","at","by","an"]);
    const getKeywords = (s: string) => normalize(s).split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

    const merged = new Set<string>();

    for (let i = 0; i < allFolders.length; i++) {
      if (merged.has(allFolders[i].id)) continue;
      if (!allFolders[i].topic) continue;
      const kw1 = getKeywords(allFolders[i].topic!);
      if (kw1.length === 0) continue;

      for (let j = i + 1; j < allFolders.length; j++) {
        if (merged.has(allFolders[j].id)) continue;
        if (!allFolders[j].topic) continue;
        const kw2 = getKeywords(allFolders[j].topic!);
        if (kw2.length === 0) continue;

        const set1 = new Set(kw1);
        let matchCount = 0;
        const allWords = new Set<string>();
        for (const w of kw1) { allWords.add(w); }
        for (const w of kw2) { allWords.add(w); if (set1.has(w)) matchCount++; }
        const jaccard = matchCount / allWords.size;

        if (jaccard >= 0.5) {
          await db.update(meetings).set({ folderId: allFolders[i].id })
            .where(and(eq(meetings.folderId, allFolders[j].id), eq(meetings.userId, userId)));
          await db.delete(meetingFolders).where(eq(meetingFolders.id, allFolders[j].id));
          merged.add(allFolders[j].id);
        }
      }
    }
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

  async getMeetingsByDateRange(userId: string, start: Date, end: Date): Promise<Meeting[]> {
    // Standardize to start and end of day in UTC to ensure no meetings are missed due to time components
    const startDate = new Date(start);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setUTCHours(23, 59, 59, 999);

    return db.select().from(meetings)
      .where(and(
        eq(meetings.userId, userId),
        or(
          and(gte(meetings.date, startDate), lte(meetings.date, endDate)),
          and(gte(meetings.scheduledDate, startDate), lte(meetings.scheduledDate, endDate))
        )
      ))
      .orderBy(meetings.date);
  }

  async deleteMeeting(id: string, userId: string): Promise<void> {
    const [meeting] = await db.select().from(meetings).where(and(eq(meetings.id, id), eq(meetings.userId, userId)));
    if (!meeting) return;
    await db.delete(meetingContacts).where(eq(meetingContacts.meetingId, id));
    await db.delete(tasks).where(eq(tasks.meetingId, id));
    await db.delete(decisions).where(eq(decisions.meetingId, id));
    await db.delete(meetingAttachments).where(eq(meetingAttachments.meetingId, id));
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

  async mergeCompanies(sourceId: string, targetId: string, userId: string): Promise<{ mergedContacts: number; movedContacts: number; movedMeetings: number }> {
    const sourceContacts = await this.getCompanyContacts(sourceId, userId);
    const targetContacts = await this.getCompanyContacts(targetId, userId);

    let mergedContacts = 0;
    let movedContacts = 0;
    const movedMeetingIds = new Set<string>();

    for (const sourceContact of sourceContacts) {
      const duplicate = targetContacts.find(
        tc => tc.name.toLowerCase().trim() === sourceContact.name.toLowerCase().trim()
      );

      if (duplicate) {
        const sourceLinks = await db.select().from(meetingContacts)
          .where(eq(meetingContacts.contactId, sourceContact.id));
        for (const link of sourceLinks) {
          await db.insert(meetingContacts)
            .values({ meetingId: link.meetingId, contactId: duplicate.id })
            .onConflictDoNothing();
          movedMeetingIds.add(link.meetingId);
        }

        await db.update(tasks).set({ contactId: duplicate.id })
          .where(eq(tasks.contactId, sourceContact.id));

        if (!duplicate.phone && sourceContact.phone) {
          await db.update(contacts).set({ phone: sourceContact.phone }).where(eq(contacts.id, duplicate.id));
        }
        if (!duplicate.email && sourceContact.email) {
          await db.update(contacts).set({ email: sourceContact.email }).where(eq(contacts.id, duplicate.id));
        }
        if (!duplicate.role && sourceContact.role) {
          await db.update(contacts).set({ role: sourceContact.role }).where(eq(contacts.id, duplicate.id));
        }

        await db.delete(meetingContacts).where(eq(meetingContacts.contactId, sourceContact.id));
        await db.delete(contacts).where(eq(contacts.id, sourceContact.id));
        mergedContacts++;
      } else {
        await db.update(contacts).set({ companyId: targetId, companyName: (await this.getCompany(targetId, userId))?.name || null })
          .where(eq(contacts.id, sourceContact.id));

        const sourceLinks = await db.select().from(meetingContacts)
          .where(eq(meetingContacts.contactId, sourceContact.id));
        for (const link of sourceLinks) {
          movedMeetingIds.add(link.meetingId);
        }
        movedContacts++;
      }
    }

    await this.deleteCompany(sourceId, userId);

    return { mergedContacts, movedContacts, movedMeetings: movedMeetingIds.size };
  }

  async deleteCompany(id: string, userId: string): Promise<void> {
    await db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
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
    const [exactFolder] = await db.select().from(meetingFolders)
      .where(and(eq(meetingFolders.userId, userId), ilike(meetingFolders.topic, topic)));
    if (exactFolder) return exactFolder;

    const allFolders = await db.select().from(meetingFolders)
      .where(eq(meetingFolders.userId, userId));
    if (allFolders.length === 0) return undefined;

    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").trim();

    const stopWords = new Set(["de","da","do","das","dos","com","para","por","em","no","na","nos","nas","um","uma","o","a","os","as","e","ou","sobre","the","of","for","and","in","on","with","to","at","by","an"]);

    const getKeywords = (s: string) => {
      return normalize(s).split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    };

    const topicKeywords = getKeywords(topic);
    if (topicKeywords.length === 0) return undefined;

    let bestFolder: MeetingFolder | undefined;
    let bestScore = 0;

    for (const folder of allFolders) {
      if (!folder.topic) continue;
      const folderKeywords = getKeywords(folder.topic);
      if (folderKeywords.length === 0) continue;

      const folderSet = new Set(folderKeywords);
      let matchCount = 0;
      const allWords = new Set<string>();
      for (const w of topicKeywords) { allWords.add(w); if (folderSet.has(w)) matchCount++; }
      for (const w of folderKeywords) { allWords.add(w); }
      const jaccard = matchCount / allWords.size;

      if (jaccard > bestScore) {
        bestScore = jaccard;
        bestFolder = folder;
      }
    }

    if (bestScore >= 0.3 && bestFolder) return bestFolder;
    return undefined;
  }

  async getAttachments(meetingId: string): Promise<MeetingAttachment[]> {
    return db.select().from(meetingAttachments)
      .where(eq(meetingAttachments.meetingId, meetingId))
      .orderBy(desc(meetingAttachments.createdAt));
  }

  async createAttachment(data: InsertMeetingAttachment): Promise<MeetingAttachment> {
    const [attachment] = await db.insert(meetingAttachments).values(data).returning();
    return attachment;
  }

  async deleteAttachment(id: string, userId: string): Promise<void> {
    await db.delete(meetingAttachments)
      .where(and(eq(meetingAttachments.id, id), eq(meetingAttachments.userId, userId)));
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
      await db.delete(meetingAttachments).where(eq(meetingAttachments.meetingId, meeting.id));
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
