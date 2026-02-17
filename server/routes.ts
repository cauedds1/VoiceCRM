import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertContactSchema, insertCompanySchema, insertMeetingSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
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

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const updateSchema = z.object({
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        priority: z.enum(["high", "medium", "low"]).optional(),
      });
      const data = updateSchema.parse(req.body);
      const task = await storage.updateTask(paramId(req), userId, data);
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

  return httpServer;
}
