import { storage } from "./storage";
import { db } from "./db";
import { meetings, contacts, companies, tasks, decisions, meetingContacts } from "@shared/schema";
import { sql } from "drizzle-orm";

const DEMO_USER_ID = "demo-seed-user";

export async function seedDatabase() {
  const existingMeetings = await db.select({ count: sql<number>`count(*)` }).from(meetings);
  if (Number(existingMeetings[0].count) > 0) return;

  console.log("Seeding database with demo data...");

  const company1 = await storage.createCompany({
    name: "Duel Construtora",
    industry: "Construção Civil",
    phone: "(11) 3456-7890",
    email: "contato@duel.com.br",
    address: "Av. Paulista, 1000 - São Paulo, SP",
    userId: DEMO_USER_ID,
  });

  const company2 = await storage.createCompany({
    name: "MegaSteel Estruturas",
    industry: "Engenharia Estrutural",
    phone: "(21) 2345-6789",
    email: "comercial@megasteel.com.br",
    userId: DEMO_USER_ID,
  });

  const company3 = await storage.createCompany({
    name: "Arqplan Design",
    industry: "Arquitetura",
    phone: "(11) 9876-5432",
    email: "projetos@arqplan.com.br",
    userId: DEMO_USER_ID,
  });

  const contact1 = await storage.createContact({
    name: "Ramiro Oliveira",
    role: "Diretor de Obras",
    phone: "(11) 99876-5432",
    email: "ramiro@duel.com.br",
    companyId: company1.id,
    companyName: "Duel Construtora",
    userId: DEMO_USER_ID,
  });

  const contact2 = await storage.createContact({
    name: "Fernanda Costa",
    role: "Engenheira Estrutural",
    phone: "(21) 98765-4321",
    email: "fernanda@megasteel.com.br",
    companyId: company2.id,
    companyName: "MegaSteel Estruturas",
    userId: DEMO_USER_ID,
  });

  const contact3 = await storage.createContact({
    name: "Carlos Mendes",
    role: "Arquiteto Sênior",
    phone: "(11) 97654-3210",
    email: "carlos@arqplan.com.br",
    companyId: company3.id,
    companyName: "Arqplan Design",
    userId: DEMO_USER_ID,
  });

  const contact4 = await storage.createContact({
    name: "Juliana Santos",
    role: "Gerente de Projetos",
    companyId: company1.id,
    companyName: "Duel Construtora",
    userId: DEMO_USER_ID,
  });

  const meeting1 = await storage.createMeeting({
    title: "Reunião sobre prazo da obra do Bloco C",
    summary: "Discussão com Ramiro da Duel sobre o cronograma da obra do Bloco C. O prazo de entrega foi confirmado para março. Foi solicitado o envio do orçamento atualizado até sexta-feira. Ramiro mencionou possíveis atrasos na entrega do aço estrutural pela MegaSteel.",
    transcription: "Estive em reunião com o Ramiro da Duel, conversamos sobre o prazo da obra do bloco C, ele disse que vai entregar até março, preciso mandar o orçamento atualizado pra ele até sexta. Ele mencionou que pode ter atraso na entrega do aço da MegaSteel.",
    status: "completed",
    userId: DEMO_USER_ID,
  });

  await storage.addMeetingContact(meeting1.id, contact1.id);

  await storage.createTask({
    title: "Enviar orçamento atualizado para Ramiro",
    description: "Preparar e enviar o orçamento atualizado do Bloco C",
    priority: "high",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    meetingId: meeting1.id,
    contactId: contact1.id,
    status: "pending",
    userId: DEMO_USER_ID,
  });

  await storage.createTask({
    title: "Verificar entrega do aço com MegaSteel",
    description: "Entrar em contato com a MegaSteel para confirmar prazos de entrega do aço estrutural",
    priority: "medium",
    meetingId: meeting1.id,
    status: "pending",
    userId: DEMO_USER_ID,
  });

  await storage.createDecision({
    content: "Prazo de entrega do Bloco C confirmado para março",
    meetingId: meeting1.id,
    userId: DEMO_USER_ID,
  });

  const meeting2 = await storage.createMeeting({
    title: "Análise estrutural - Projeto Residencial Park View",
    summary: "Reunião com Fernanda da MegaSteel para discutir a análise estrutural do projeto Park View. As fundações precisam ser refeitas conforme nova norma técnica. Carlos da Arqplan vai ajustar o projeto arquitetônico para acomodar as mudanças estruturais.",
    transcription: "Conversei com a Fernanda da MegaSteel sobre a análise estrutural do projeto Park View. Ela disse que as fundações precisam ser refeitas por causa da nova norma técnica. O Carlos da Arqplan vai precisar ajustar o projeto arquitetônico para encaixar as mudanças.",
    status: "completed",
    userId: DEMO_USER_ID,
  });

  await storage.addMeetingContact(meeting2.id, contact2.id);
  await storage.addMeetingContact(meeting2.id, contact3.id);

  await storage.createTask({
    title: "Revisar fundações do projeto Park View",
    description: "Refazer cálculo das fundações conforme nova norma técnica",
    priority: "high",
    meetingId: meeting2.id,
    contactId: contact2.id,
    status: "in_progress",
    userId: DEMO_USER_ID,
  });

  await storage.createDecision({
    content: "Fundações do Park View serão refeitas conforme nova norma técnica",
    meetingId: meeting2.id,
    userId: DEMO_USER_ID,
  });

  await storage.createDecision({
    content: "Projeto arquitetônico será ajustado pela Arqplan",
    meetingId: meeting2.id,
    userId: DEMO_USER_ID,
  });

  const meeting3 = await storage.createMeeting({
    title: "Alinhamento de cronograma com equipe Duel",
    summary: "Reunião com Juliana Santos e Ramiro da Duel para alinhar o cronograma geral das obras. Três projetos em andamento precisam de atenção. Definido que reuniões semanais acontecerão todas as terças-feiras.",
    transcription: "Tive reunião com a Juliana e o Ramiro da Duel pra alinhar o cronograma geral. Temos três projetos em andamento que precisam de atenção. Ficou definido que vamos ter reuniões semanais todas as terças.",
    status: "completed",
    userId: DEMO_USER_ID,
  });

  await storage.addMeetingContact(meeting3.id, contact1.id);
  await storage.addMeetingContact(meeting3.id, contact4.id);

  await storage.createTask({
    title: "Agendar reuniões semanais com Duel",
    description: "Configurar reuniões recorrentes todas as terças-feiras",
    priority: "low",
    meetingId: meeting3.id,
    status: "completed",
    userId: DEMO_USER_ID,
  });

  console.log("Seed data inserted successfully!");
}
