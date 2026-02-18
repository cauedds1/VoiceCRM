import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import { insertContactSchema, insertCompanySchema, insertMeetingSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import bcrypt from "bcryptjs";
import { processAudioMeeting } from "./ai";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

function getUserId(req: any): string {
  return req.session?.userId;
}

function paramId(req: any): string {
  return req.params.id as string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // === MEETINGS ===
  app.get("/api/meetings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getMeetings(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const meeting = await storage.getMeeting(paramId(req), userId);
      if (!meeting) return res.status(404).json({ message: "Reunião não encontrada" });
      res.json(meeting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const updateSchema = z.object({
        title: z.string().min(1).optional(),
        summary: z.string().optional(),
        status: z.string().optional(),
      });
      const data = updateSchema.parse(req.body);
      const meeting = await storage.updateMeeting(paramId(req), userId, data);
      if (!meeting) return res.status(404).json({ message: "Reunião não encontrada" });
      res.json(meeting);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await storage.deleteMeeting(paramId(req), userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/meetings/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const meeting = await storage.getMeeting(paramId(req), userId);
      if (!meeting) return res.status(404).json({ message: "Reunião não encontrada" });
      const result = await storage.getTasksByMeeting(paramId(req));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/meetings/:id/decisions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const meeting = await storage.getMeeting(paramId(req), userId);
      if (!meeting) return res.status(404).json({ message: "Reunião não encontrada" });
      const result = await storage.getDecisionsByMeeting(paramId(req));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/meetings/:id/contacts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const meeting = await storage.getMeeting(paramId(req), userId);
      if (!meeting) return res.status(404).json({ message: "Reunião não encontrada" });
      const result = await storage.getMeetingContacts(paramId(req));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meetings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const createSchema = z.object({
        title: z.string().min(1),
        summary: z.string().optional(),
        contactIds: z.array(z.string()).optional(),
        date: z.string().optional(),
      });
      const data = createSchema.parse(req.body);
      const meeting = await storage.createMeeting({
        title: data.title,
        summary: data.summary || null,
        transcription: null,
        status: "completed",
        userId,
        date: data.date ? new Date(data.date) : new Date(),
      });
      if (data.contactIds && data.contactIds.length > 0) {
        for (const contactId of data.contactIds) {
          await storage.addMeetingContact(meeting.id, contactId);
        }
      }
      res.json(meeting);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meetings/process-audio", isAuthenticated, upload.single("audio"), async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!req.file) return res.status(400).json({ message: "Nenhum áudio enviado" });
      const meeting = await processAudioMeeting(req.file.buffer, req.file.mimetype, userId);
      res.json(meeting);
    } catch (error: any) {
      console.error("Error processing audio:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // === MEETING FOLDERS ===
  app.get("/api/meeting-folders", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const folders = await storage.getMeetingFolders(userId);
      res.json(folders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meeting-folders", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({ name: z.string().min(1), topic: z.string().optional() });
      const data = schema.parse(req.body);
      const folder = await storage.createMeetingFolder({ name: data.name, topic: data.topic || null, userId });
      res.json(folder);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0].message });
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/meeting-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({ name: z.string().min(1).optional(), topic: z.string().optional() });
      const data = schema.parse(req.body);
      const folder = await storage.updateMeetingFolder(paramId(req), userId, data);
      if (!folder) return res.status(404).json({ message: "Folder not found" });
      res.json(folder);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0].message });
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/meeting-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await storage.deleteMeetingFolder(paramId(req), userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/meetings/:id/folder", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({ folderId: z.string().nullable() });
      const data = schema.parse(req.body);
      const meeting = await storage.updateMeeting(paramId(req), userId, { folderId: data.folderId });
      if (!meeting) return res.status(404).json({ message: "Meeting not found" });
      res.json(meeting);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0].message });
      res.status(500).json({ message: error.message });
    }
  });

  // === CONTACTS ===
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getContacts(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const contact = await storage.getContact(paramId(req), userId);
      if (!contact) return res.status(404).json({ message: "Contato não encontrado" });
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const createSchema = z.object({
        name: z.string().min(1),
        role: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        companyName: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
      });
      const data = createSchema.parse(req.body);

      let companyId: string | undefined;
      if (data.companyName) {
        let company = await storage.getCompanyByName(data.companyName, userId);
        if (!company) {
          company = await storage.createCompany({ name: data.companyName, userId });
        }
        companyId = company.id;
      }
      const contact = await storage.createContact({
        name: data.name,
        role: data.role || null,
        phone: data.phone || null,
        email: data.email || null,
        companyId: companyId || null,
        companyName: data.companyName || null,
        notes: data.notes || null,
        city: data.city || null,
        state: data.state || null,
        userId,
      });
      res.json(contact);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        role: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        companyName: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
      });
      const data = updateSchema.parse(req.body);
      const updateData: any = { ...data };

      if (data.companyName !== undefined) {
        if (data.companyName) {
          let company = await storage.getCompanyByName(data.companyName, userId);
          if (!company) {
            company = await storage.createCompany({ name: data.companyName, userId });
          }
          updateData.companyId = company.id;
        } else {
          updateData.companyId = null;
        }
      }
      const contact = await storage.updateContact(paramId(req), userId, updateData);
      if (!contact) return res.status(404).json({ message: "Contato não encontrado" });
      res.json(contact);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contacts/:id/meetings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const contact = await storage.getContact(paramId(req), userId);
      if (!contact) return res.status(404).json({ message: "Contato não encontrado" });
      const result = await storage.getContactMeetings(paramId(req));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === COMPANIES ===
  app.get("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getCompanies(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/companies/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const company = await storage.getCompany(paramId(req), userId);
      if (!company) return res.status(404).json({ message: "Empresa não encontrada" });
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/companies/:id/contacts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const company = await storage.getCompany(paramId(req), userId);
      if (!company) return res.status(404).json({ message: "Empresa não encontrada" });
      const result = await storage.getCompanyContacts(paramId(req), userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/companies/:id/meetings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const company = await storage.getCompany(paramId(req), userId);
      if (!company) return res.status(404).json({ message: "Empresa não encontrada" });
      const result = await storage.getCompanyMeetings(paramId(req), userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const createSchema = z.object({
        name: z.string().min(1),
        industry: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
      });
      const data = createSchema.parse(req.body);
      const company = await storage.createCompany({ ...data, userId });
      res.json(company);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/companies/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        industry: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        logoUrl: z.string().optional().nullable(),
      });
      const data = updateSchema.parse(req.body);
      const company = await storage.updateCompany(paramId(req), userId, data);
      if (!company) return res.status(404).json({ message: "Empresa não encontrada" });
      res.json(company);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/companies/:id/logo", isAuthenticated, upload.single("logo"), async (req, res) => {
    try {
      const userId = getUserId(req);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });
      if (file.size > 2 * 1024 * 1024) return res.status(400).json({ message: "File too large (max 2MB)" });
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const company = await storage.updateCompany(paramId(req), userId, { logoUrl: base64 });
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === TASKS ===
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getTasks(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const createSchema = z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
        dueDate: z.string().optional().nullable(),
        status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
        contactId: z.string().optional().nullable(),
      });
      const data = createSchema.parse(req.body);
      const task = await storage.createTask({
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status,
        contactId: data.contactId || null,
        meetingId: null,
        userId,
      });
      res.status(201).json(task);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const updateSchema = z.object({
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        dueDate: z.string().optional().nullable(),
        contactId: z.string().optional().nullable(),
      });
      const data = updateSchema.parse(req.body);
      const updateData: any = { ...data };
      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      }
      const task = await storage.updateTask(paramId(req), userId, updateData);
      if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });
      res.json(task);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
      res.status(500).json({ message: error.message });
    }
  });

  // === REPORTS ===
  app.get("/api/reports/meetings-by-month", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const allMeetings = await storage.getMeetings(userId);
      const monthCounts: Record<string, number> = {};
      for (const m of allMeetings) {
        const d = m.date ? new Date(m.date) : m.createdAt ? new Date(m.createdAt) : null;
        if (!d) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
      const now = new Date();
      const months: { month: string; label: string; count: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
        months.push({ month: key, label, count: monthCounts[key] || 0 });
      }
      const totalMeetings = allMeetings.length;
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const thisMonth = monthCounts[thisMonthKey] || 0;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
      const lastMonth = monthCounts[lastMonthKey] || 0;
      res.json({ months, totalMeetings, thisMonth, lastMonth });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const [allMeetings, allContacts, allCompanies, allTasks] = await Promise.all([
        storage.getMeetings(userId),
        storage.getContacts(userId),
        storage.getCompanies(userId),
        storage.getTasks(userId),
      ]);
      const pendingTasks = allTasks.filter((t) => t.status === "pending").length;
      const completedTasks = allTasks.filter((t) => t.status === "completed").length;
      res.json({
        totalMeetings: allMeetings.length,
        totalContacts: allContacts.length,
        totalCompanies: allCompanies.length,
        totalTasks: allTasks.length,
        pendingTasks,
        completedTasks,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === USER SETTINGS ===
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      let settings = await storage.getUserSettings(userId);
      if (!settings) {
        settings = await storage.upsertUserSettings(userId, {});
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        interfaceLanguage: z.enum(["pt-BR", "en"]).optional(),
        transcriptionLanguage: z.enum(["pt-BR", "en", "es", "fr", "de", "it", "ja", "zh", "ko"]).optional(),
        taskExtractionLevel: z.enum(["aggressive", "moderate", "conservative"]).optional(),
      });
      const data = schema.parse(req.body);
      const settings = await storage.upsertUserSettings(userId, data);
      res.json(settings);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // === ACCOUNT MANAGEMENT ===
  app.patch("/api/account/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        firstName: z.string().min(1, "Nome é obrigatório"),
        lastName: z.string().min(1, "Sobrenome é obrigatório"),
      });
      const data = schema.parse(req.body);
      const user = await authStorage.upsertUser({ id: userId, ...data });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/account/email", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória para confirmar"),
      });
      const data = schema.parse(req.body);

      const user = await authStorage.getUser(userId);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Senha incorreta" });
      }

      const existing = await authStorage.getUserByEmail(data.email);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ message: "Este email já está em uso" });
      }

      const updated = await authStorage.upsertUser({ id: userId, email: data.email });
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/account/password", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
      });
      const data = schema.parse(req.body);

      const user = await authStorage.getUser(userId);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const valid = await bcrypt.compare(data.currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await authStorage.upsertUser({ id: userId, password: hashedPassword });
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/account/export", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await authStorage.getUser(userId);
      const allMeetings = await storage.getMeetings(userId);
      const allContacts = await storage.getContacts(userId);
      const allCompanies = await storage.getCompanies(userId);
      const allTasks = await storage.getTasks(userId);
      const allFolders = await storage.getMeetingFolders(userId);

      const allDecisions: any[] = [];
      for (const meeting of allMeetings) {
        const decisions = await storage.getDecisionsByMeeting(meeting.id);
        allDecisions.push(...decisions);
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          createdAt: user?.createdAt,
        },
        meetings: allMeetings.map(({ userId: _, ...m }) => m),
        contacts: allContacts.map(({ userId: _, ...c }) => c),
        companies: allCompanies.map(({ userId: _, ...c }) => c),
        tasks: allTasks.map(({ userId: _, ...t }) => t),
        meetingFolders: allFolders.map(({ userId: _, ...f }) => f),
        decisions: allDecisions,
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="voicecrm-export-${new Date().toISOString().split("T")[0]}.json"`);
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/account", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        password: z.string().min(1, "Senha é obrigatória para confirmar"),
      });
      const data = schema.parse(req.body);

      const user = await authStorage.getUser(userId);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Senha incorreta" });
      }

      await storage.deleteUserAccount(userId);
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
