import OpenAI from "openai";
import { storage } from "./storage";
import type { Meeting } from "@shared/schema";

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

interface ExtractedData {
  title: string;
  summary: string;
  contacts: Array<{ name: string; company?: string; role?: string }>;
  tasks: Array<{ title: string; description?: string; priority: string; dueDate?: string }>;
  decisions: string[];
}

export async function processAudioMeeting(
  audioBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<Meeting> {
  const file = new File([audioBuffer], "audio.webm", { type: mimeType || "audio/webm" });

  const openai = getOpenAIClient();
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    language: "pt",
  });

  const transcribedText = transcription.text;

  const todayDate = new Date().toISOString().split("T")[0];

  const extractionResponse = await openai.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Você é um assistente especializado em organizar informações de reuniões profissionais.
Analise a transcrição de um áudio gravado após uma reunião e extraia as informações de forma estruturada.

REGRAS IMPORTANTES:
- Identifique TODAS as pessoas mencionadas e suas respectivas empresas
- Quando alguém diz "Fulano da Empresa X", "Fulano" é a PESSOA e "Empresa X" é a EMPRESA
- Separe claramente pessoa de empresa
- Crie um título conciso e descritivo para a reunião
- Crie um resumo claro e organizado
- Identifique decisões tomadas durante a reunião

EXTRAÇÃO DE TAREFAS — PRESTE MUITA ATENÇÃO:
- Extraia TODAS as tarefas, ações, compromissos, pendências e coisas a fazer mencionadas
- Qualquer frase que indique algo que precisa ser feito é uma tarefa. Exemplos:
  - "Preciso enviar o relatório" → tarefa
  - "Tenho que ligar pro João até sexta" → tarefa com prazo
  - "Ficou de mandar a proposta" → tarefa
  - "Vou marcar uma reunião com o fornecedor" → tarefa
  - "A gente combinou de revisar o contrato" → tarefa
  - "Não posso esquecer de pagar a fatura" → tarefa
  - "Ele vai preparar a apresentação pra semana que vem" → tarefa com prazo
- Interprete datas relativas com base na data de hoje (${todayDate}):
  - "até sexta" → calcule a próxima sexta-feira
  - "semana que vem" → calcule a data da próxima semana
  - "amanhã" → dia seguinte a hoje
  - "até o final do mês" → último dia do mês atual
  - "daqui 3 dias" → some 3 dias a partir de hoje
- Se a urgência/importância for mencionada ou implícita, defina a prioridade:
  - "urgente", "o mais rápido possível", "prioridade" → high
  - Tarefas normais sem urgência → medium
  - "quando der", "sem pressa", "eventualmente" → low
- Se alguém for mencionado como responsável, inclua no título ou descrição

Responda SEMPRE em JSON com esta estrutura exata:
{
  "title": "Título conciso da reunião",
  "summary": "Resumo claro e organizado do que foi discutido",
  "contacts": [
    { "name": "Nome da pessoa", "company": "Nome da empresa (se mencionada)", "role": "Cargo (se mencionado)" }
  ],
  "tasks": [
    { "title": "Título da tarefa", "description": "Descrição detalhada", "priority": "high|medium|low", "dueDate": "Data se mencionada (formato YYYY-MM-DD) ou null" }
  ],
  "decisions": ["Decisão 1", "Decisão 2"]
}`
      },
      {
        role: "user",
        content: `Transcrição da reunião:\n\n${transcribedText}`
      }
    ],
  });

  const extractedText = extractionResponse.choices[0]?.message?.content || "{}";
  let extracted: ExtractedData;
  try {
    extracted = JSON.parse(extractedText);
  } catch {
    extracted = {
      title: "Reunião sem título",
      summary: transcribedText,
      contacts: [],
      tasks: [],
      decisions: [],
    };
  }

  const meeting = await storage.createMeeting({
    title: extracted.title || "Reunião sem título",
    summary: extracted.summary || "",
    transcription: transcribedText,
    status: "completed",
    userId,
  });

  for (const contactData of extracted.contacts || []) {
    if (!contactData.name) continue;

    let companyId: string | undefined;
    let companyName = contactData.company || null;

    if (companyName) {
      let company = await storage.getCompanyByName(companyName, userId);
      if (!company) {
        company = await storage.createCompany({ name: companyName, userId });
      }
      companyId = company.id;
      companyName = company.name;
    }

    let contact = await storage.getContactByNameAndCompany(contactData.name, companyName, userId);
    if (!contact) {
      contact = await storage.createContact({
        name: contactData.name,
        role: contactData.role || null,
        companyId: companyId || null,
        companyName: companyName,
        userId,
      });
    }

    await storage.addMeetingContact(meeting.id, contact.id);
  }

  for (const taskData of extracted.tasks || []) {
    if (!taskData.title) continue;
    await storage.createTask({
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority || "medium",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      meetingId: meeting.id,
      status: "pending",
      userId,
    });
  }

  for (const decisionContent of extracted.decisions || []) {
    if (!decisionContent) continue;
    await storage.createDecision({
      content: decisionContent,
      meetingId: meeting.id,
      userId,
    });
  }

  return meeting;
}
