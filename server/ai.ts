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
  topic: string;
  contacts: Array<{ name: string; company?: string; role?: string }>;
  tasks: Array<{ title: string; description?: string; priority: string; dueDate?: string; contactName?: string }>;
  decisions: string[];
  category: string;
  meetingType: "record" | "schedule";
  scheduledDate?: string;
}

const LANG_MAP: Record<string, { whisper: string; name: string; outputInstruction: string }> = {
  "pt-BR": { whisper: "pt", name: "Português (Brasil)", outputInstruction: "Responda TUDO em português brasileiro." },
  "en": { whisper: "en", name: "English", outputInstruction: "Respond ENTIRELY in English." },
  "es": { whisper: "es", name: "Español", outputInstruction: "Responde TODO en español." },
  "fr": { whisper: "fr", name: "Français", outputInstruction: "Répondez ENTIÈREMENT en français." },
  "de": { whisper: "de", name: "Deutsch", outputInstruction: "Antworten Sie KOMPLETT auf Deutsch." },
  "it": { whisper: "it", name: "Italiano", outputInstruction: "Rispondi INTERAMENTE in italiano." },
  "ja": { whisper: "ja", name: "日本語", outputInstruction: "すべて日本語で回答してください。" },
  "zh": { whisper: "zh", name: "中文", outputInstruction: "请全部用中文回答。" },
  "ko": { whisper: "ko", name: "한국어", outputInstruction: "모든 내용을 한국어로 응답하세요." },
};

async function buildUserPrompt(transcribedText: string, userId: string): Promise<string> {
  const folders = await storage.getMeetingFolders(userId);
  let folderContext = "";
  if (folders.length > 0) {
    const folderTopics = folders
      .filter(f => f.topic)
      .map(f => `- "${f.topic}"`)
      .join("\n");
    if (folderTopics) {
      folderContext = `\n\nPASTAS EXISTENTES (use EXATAMENTE o mesmo nome se o assunto E a empresa forem os mesmos — NÃO agrupe reuniões de empresas diferentes na mesma pasta):\n${folderTopics}\n`;
    }
  }
  return `${folderContext}Transcrição da reunião:\n\n${transcribedText}`;
}

function getTaskExtractionInstruction(level: string): string {
  switch (level) {
    case "conservative":
      return `NÍVEL DE EXTRAÇÃO: CONSERVADOR
Extraia APENAS tarefas que foram EXPLICITAMENTE mencionadas como obrigações diretas.
- Somente frases com verbos de obrigação claros: "preciso fazer", "tenho que", "vou fazer", "prometi entregar"
- NÃO extraia ações implícitas ou sugestões
- NÃO extraia compromissos vagos como "deveríamos pensar em X"
- NÃO crie tarefas de acompanhamento para compromissos de terceiros
- Na dúvida, NÃO extraia a tarefa`;
    case "moderate":
      return `NÍVEL DE EXTRAÇÃO: MODERADO
Extraia tarefas que representam compromissos claros e ações definidas.
- Verbos de obrigação: "preciso", "tenho que", "vou", "ficou combinado"
- Compromissos explícitos assumidos pelo profissional ou pela contraparte
- Próximos passos claramente definidos
- NÃO extraia sugestões vagas ou ideias para o futuro sem compromisso
- Compromissos de terceiros geram tarefas de acompanhamento apenas se o profissional mencionou que vai cobrar`;
    case "aggressive":
    default:
      return `NÍVEL DE EXTRAÇÃO: AGRESSIVO
Extraia ABSOLUTAMENTE TUDO que indica uma ação a ser realizada. Seja AGRESSIVO na extração — é melhor extrair uma tarefa a mais do que perder uma.
- Todos os verbos de obrigação, necessidade e intenção
- Compromissos assumidos e compromissos de terceiros (gerar tarefa de cobrar/acompanhar)
- Ações implícitas: "falta X", "tá pendente X", "tá parado"
- Lembretes e anotações de ação
- Próximos passos mencionados de qualquer forma
- Ideias que soam como intenções: "seria bom fazer X", "deveríamos X"`;
  }
}

export async function processAudioMeeting(
  audioBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<Meeting> {
  const userSettings = await storage.getUserSettings(userId);
  const transcriptionLang = userSettings?.transcriptionLanguage || "pt-BR";
  const extractionLevel = userSettings?.taskExtractionLevel || "aggressive";
  const langConfig = LANG_MAP[transcriptionLang] || LANG_MAP["pt-BR"];

  const file = new File([audioBuffer], "audio.webm", { type: mimeType || "audio/webm" });

  const openai = getOpenAIClient();
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    language: langConfig.whisper,
  });

  const transcribedText = transcription.text;

  const todayDate = new Date().toISOString().split("T")[0];

  const extractionResponse = await openai.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${langConfig.outputInstruction}

Você é o cérebro de um CRM inteligente. Seu trabalho é ouvir a transcrição de um áudio gravado por um profissional (vendedor, gestor, empreendedor, etc.) após qualquer tipo de interação profissional e organizar TUDO no sistema.

IMPORTANTE: O profissional pode falar em QUALQUER idioma no áudio. Independente do idioma falado, você DEVE gerar TODO o output (título, resumo, nomes de tarefas, descrições, decisões) no idioma: ${langConfig.name}. Os nomes de pessoas e empresas devem ser mantidos como foram falados.

O áudio pode ser gravado em QUALQUER contexto — o profissional pode estar:
- Resumindo uma reunião que acabou de acontecer
- Anotando pensamentos rápidos enquanto dirige
- Fazendo um resumo do dia
- Relatando uma ligação telefônica
- Descrevendo uma visita a cliente
- Gravando lembretes pessoais de trabalho
- Fazendo anotações sobre um evento/feira
- Relatando uma negociação em andamento
- AGENDANDO uma reunião/encontro/call FUTURO(A)
- Qualquer outro contexto profissional

Você DEVE entender o contexto e organizar as informações mesmo quando o áudio for informal, confuso, com gírias, interrupções, ou pensamentos desordenados. Profissionais falam naturalmente — seu trabalho é transformar isso em dados organizados.

DATA DE HOJE: ${todayDate} (use para calcular TODAS as datas relativas)

═══════════════════════════════════════
1. TÍTULO DA REUNIÃO
═══════════════════════════════════════
- Crie um título CONCISO e DESCRITIVO (máximo 8-10 palavras)
- O título deve capturar a essência: com quem foi, sobre o que foi
- Exemplos: "Negociação com TechCorp sobre contrato anual", "Visita ao cliente Marcos da Construtora Silva", "Planejamento semanal da equipe comercial"
- Se o áudio é um resumo geral do dia, use algo como "Resumo do dia - [tema principal]"

═══════════════════════════════════════
2. RESUMO
═══════════════════════════════════════
- Escreva um resumo claro, organizado em parágrafos curtos
- Capture os PONTOS PRINCIPAIS discutidos
- Use linguagem profissional mas acessível
- Se houver números, valores, datas — inclua no resumo
- Se houver contexto de negociação, capture o estágio (prospecção, proposta, fechamento, etc.)

═══════════════════════════════════════
3. CONTATOS (PESSOAS)
═══════════════════════════════════════
REGRA FUNDAMENTAL: Identifique TODA E QUALQUER pessoa mencionada no áudio.

Como identificar pessoas:
- "Falei com o João" → pessoa: João
- "O Carlos da TechCorp" → pessoa: Carlos, empresa: TechCorp
- "A Dra. Maria, cardiologista" → pessoa: Maria, cargo: Cardiologista
- "O gerente do banco, Seu Ricardo" → pessoa: Ricardo, cargo: Gerente
- "Reunião com o pessoal da Acme — o Pedro e a Ana" → 2 pessoas, empresa: Acme
- "Liguei pro fornecedor, o Marcos" → pessoa: Marcos, cargo/contexto: Fornecedor
- "O diretor financeiro da empresa, Rodrigo Santos" → pessoa: Rodrigo Santos, cargo: Diretor Financeiro
- "Meu contador, Dr. Silva" → pessoa: Dr. Silva, cargo: Contador

ATENÇÃO com nomes e empresas:
- "João da Silva" é UMA PESSOA (nome completo), NÃO uma pessoa chamada João de uma empresa "Silva"
- "Maria da Acme" é uma pessoa "Maria" da empresa "Acme"
- Use o contexto para diferenciar! Se "da" vem seguido de algo que parece nome de empresa → é empresa. Se parece sobrenome → é nome completo.
- "Construtora Silva", "Grupo XYZ", "Loja do João" → são EMPRESAS
- Apelidos e diminutivos contam: "Zé" (José), "Bia" (Beatriz), "Rafa" (Rafael) — use como o profissional falou
- Se a mesma pessoa é mencionada com variações ("o João", "João Silva", "o Silva"), consolide em UM ÚNICO contato com o nome mais completo

Cargo/Papel — capture QUALQUER informação sobre o que a pessoa faz:
- Cargos formais: "diretor", "gerente", "CEO", "sócio"
- Papéis informais: "fornecedor", "cliente", "parceiro", "investidor"
- Profissões: "advogado", "arquiteto", "contador"
- Relações: "comprador", "responsável pelo projeto"

═══════════════════════════════════════
4. EMPRESAS
═══════════════════════════════════════
Identifique TODAS as empresas/organizações mencionadas:
- Nomes explícitos: "TechCorp", "Construtora Silva", "Magazine Luiza"
- Referências implícitas que indicam uma empresa: "a empresa dele", "lá na fábrica", "a loja"
  - Nesse caso, se não houver nome, NÃO invente — deixe sem empresa
- Tipos de organização: empresas, lojas, escritórios, fábricas, hospitais, escolas, órgãos públicos
- Se uma pessoa é associada a uma empresa, vincule-as: { name: "Carlos", company: "TechCorp" }

═══════════════════════════════════════
5. TAREFAS — SEÇÃO MAIS CRÍTICA
═══════════════════════════════════════
${getTaskExtractionInstruction(extractionLevel)}

PADRÕES DE FALA QUE INDICAM TAREFA:

Verbos de obrigação/necessidade:
- "Preciso fazer X" / "Tenho que fazer X" / "Devo fazer X"
- "Não posso esquecer de X" / "Tenho que lembrar de X"
- "É necessário X" / "Falta X" / "Tá pendente X"

Compromissos assumidos:
- "Vou mandar o email" / "Vou ligar pra ele" / "Vou preparar a proposta"
- "Prometi entregar até sexta" / "Combinei de enviar"
- "Ficou acertado que eu vou X" / "Fiquei de fazer X"

Compromissos de terceiros (a tarefa é ACOMPANHAR):
- "Ele vai mandar o orçamento" → tarefa: "Cobrar orçamento de [nome]"
- "Ela ficou de enviar o contrato" → tarefa: "Acompanhar envio de contrato por [nome]"
- "O João vai verificar" → tarefa: "Cobrar verificação do João"

Ações implícitas:
- "Falta assinar o contrato" → tarefa
- "O projeto tá parado, precisa desbloquear" → tarefa
- "A proposta tá vencendo" → tarefa: renovar/enviar nova proposta
- "Tô esperando retorno do cliente" → tarefa: fazer follow-up
- "Ainda não recebi o pagamento" → tarefa: cobrar pagamento

Lembretes e anotações de ação:
- "Anotar: ligar pro banco amanhã"
- "Lembrete: renovar o seguro"
- "Importante: verificar estoque"

Próximos passos mencionados:
- "O próximo passo é X"
- "Agora falta X"
- "Depois disso, preciso X"

PRIORIDADE — inferir inteligentemente:
- HIGH (urgente):
  - Palavras: "urgente", "prioridade", "ASAP", "o mais rápido possível", "não pode atrasar", "crítico", "imediato", "pra ontem"
  - Contexto: prazos muito curtos (hoje, amanhã), bloqueio de outros processos, risco financeiro
  - Tom: ansiedade, ênfase, repetição da importância
- MEDIUM (normal):
  - Maioria das tarefas sem indicação explícita de urgência
  - Prazos razoáveis (dentro da semana, próxima semana)
- LOW (sem pressa):
  - Palavras: "quando der", "sem pressa", "eventualmente", "um dia", "se sobrar tempo"
  - Contexto: melhorias opcionais, ideias para o futuro

DATAS — interpretar com precisão (hoje é ${todayDate}):
- "Hoje" → ${todayDate}
- "Amanhã" → dia seguinte
- "Depois de amanhã" → 2 dias depois
- "Essa semana" / "Até sexta" → calcule a próxima sexta-feira a partir de hoje
- "Semana que vem" / "Na próxima semana" → segunda-feira da próxima semana
- "Até o final do mês" → último dia do mês atual
- "Mês que vem" → dia 1 do próximo mês
- "Daqui a X dias" → some X dias
- "Daqui a 2 semanas" / "Em 15 dias" → some 14 dias
- "Até dia 20" → dia 20 do mês atual (ou próximo mês se já passou)
- "Em março" → dia 1 de março (ano atual ou próximo se março já passou)
- "No começo do ano" / "Início do ano que vem" → 2027-01-15
- Se NÃO houver data mencionada ou implícita → dueDate: null

CONTATO VINCULADO À TAREFA (contactName):
- Se a tarefa menciona ou envolve uma pessoa específica, preencha contactName com o NOME EXATO como aparece na lista de contacts
- "Ligar pro João" → contactName: "João"
- "Enviar proposta pro Carlos da TechCorp" → contactName: "Carlos"
- "Cobrar a Maria sobre o relatório" → contactName: "Maria"
- Se a tarefa é genérica sem pessoa específica → contactName: null

═══════════════════════════════════════
6. TÓPICO/ASSUNTO PRINCIPAL
═══════════════════════════════════════
Identifique o ASSUNTO CENTRAL da reunião em 2-5 palavras genéricas e reutilizáveis.
O tópico deve ser GENÉRICO o suficiente para agrupar reuniões futuras sobre o MESMO ASSUNTO.

Exemplos:
- "Negociação contrato TechCorp" (se o assunto é um contrato específico com a TechCorp)
- "Projeto Voice CRM" (se estão discutindo o produto Voice CRM)
- "Parceria comercial Acme" (se estão negociando parceria com a Acme)
- "Planejamento semanal equipe" (se é planejamento recorrente da equipe)

REGRAS:
- O tópico deve capturar O QUE está sendo discutido, não apenas com QUEM
- Se duas reuniões são sobre o mesmo projeto/negócio com as mesmas pessoas, devem ter o MESMO tópico
- Use palavras-chave do negócio/projeto, não termos genéricos como "reunião" ou "conversa"
- Mantenha consistência: se um assunto já foi discutido antes, use exatamente o mesmo tópico

═══════════════════════════════════════
7. DECISÕES
═══════════════════════════════════════
Capture TODAS as decisões tomadas ou acordos fechados:
- "Decidimos que X" / "Ficou definido X" / "Combinamos X"
- "Vamos seguir com X" / "Optamos por X" / "Escolhemos X"
- "O preço ficou em X" / "Fechamos em X"
- "Aprovamos X" / "Descartamos X"
- Inclua valores, condições e detalhes relevantes na decisão
- Decisões podem ser implícitas: "Então tá, vamos com o plano B" → decisão: "Seguir com o plano B"

═══════════════════════════════════════
8. TIPO DE ÁUDIO: REGISTRO vs AGENDAMENTO
═══════════════════════════════════════
Determine se o áudio é um REGISTRO de algo que já aconteceu ou um AGENDAMENTO de algo futuro.

meetingType: "record" → O profissional está RELATANDO algo que já aconteceu (reunião, ligação, visita, etc.)
  - Palavras-chave: "tive uma reunião", "falei com", "acabei de sair", "hoje eu", "ontem", "conversei com"
  - Nesse caso, scheduledDate deve ser null

meetingType: "schedule" → O profissional está AGENDANDO/PLANEJANDO algo para o futuro
  - Palavras-chave: "agendar reunião", "marcar reunião", "tenho reunião dia X", "vou me reunir com", "preciso agendar", "colocar na agenda"
  - Nesse caso, scheduledDate DEVE ser preenchida com a data mencionada (formato YYYY-MM-DD)
  - O status deve ser "scheduled" em vez de "completed"

REGRA: Mesmo em agendamentos, SEMPRE extraia contatos, empresas e tarefas normalmente.
Se o profissional disser "Agendar reunião com o João da TechCorp na sexta", você DEVE:
- Criar o contato "João" vinculado à empresa "TechCorp"
- Definir meetingType: "schedule" e scheduledDate com a data da sexta-feira
- Ainda pode ter tarefas implícitas como "Preparar pauta para reunião com João"

═══════════════════════════════════════
9. CATEGORIA DA INTERAÇÃO
═══════════════════════════════════════
Classifique o TIPO de interação baseado no contexto EXPLÍCITO do áudio. Use APENAS pistas claras:
- "meeting" → Reunião formal ou semi-formal. Palavras-chave: "reunião", "reunir", "meeting", "a gente se reuniu", "tive uma reunião", "sala de reunião", "videoconferência", "call de alinhamento"
- "lunch" → Almoço de negócios. Palavras-chave: "almocei com", "durante o almoço", "no restaurante", "almoço"
- "coffee" → Café/encontro informal. Palavras-chave: "tomei um café com", "cafezinho", "bate-papo no café"
- "call" → Ligação telefônica. Palavras-chave: "liguei para", "recebi uma ligação", "falei por telefone", "telefonema"
- "visit" → Visita a cliente/local. Palavras-chave: "visitei", "fui até lá", "passei na empresa dele", "estive no escritório dele", "fui conhecer a empresa"
- "event" → Evento, feira, conferência. Palavras-chave: "no evento", "na feira", "no congresso"
- "casual" → Encontro casual/social. Palavras-chave: "encontrei por acaso", "cruzei com", "esbarrei"
- "whatsapp" → Conversa via WhatsApp. Palavras-chave: "whatsapp", "zap", "zapzap", "pelo zap", "mensagem no whatsapp", "conversa no whatsapp", "mandei mensagem", "me mandou mensagem", "troquei mensagem", "no whats", "pelo whats", "print do whatsapp", "conversa por mensagem"

REGRA IMPORTANTE: Se o título ou a transcrição usam a palavra "reunião" ou "reunir", a categoria DEVE ser "meeting".
Se mencionou "whatsapp", "zap", "mensagem" ou similar, a categoria DEVE ser "whatsapp".
"visit" só deve ser usado se há menção EXPLÍCITA a deslocamento físico até o local do outro ("fui até", "visitei", "passei lá").
Se o contexto não for claro, use "meeting" como padrão.

═══════════════════════════════════════
FORMATO DE RESPOSTA (JSON OBRIGATÓRIO)
═══════════════════════════════════════
{
  "title": "Título conciso e descritivo (máx 10 palavras)",
  "summary": "Resumo completo e organizado do áudio, com todos os pontos relevantes",
  "topic": "Assunto principal + empresa envolvida (ex: 'IA e-commerce - Giassi', 'Projeto Voice CRM - Evehx', 'Contrato TechCorp'). SEMPRE inclua o nome da empresa principal quando houver uma. SE existir uma pasta com tema E empresa similar nas PASTAS EXISTENTES abaixo, use EXATAMENTE o mesmo nome para agrupar. Caso contrário, crie um nome novo.",
  "contacts": [
    {
      "name": "Nome completo ou como foi mencionado",
      "company": "Nome da empresa (se mencionada, senão omitir)",
      "role": "Cargo, profissão ou papel (se mencionado, senão omitir)"
    }
  ],
  "tasks": [
    {
      "title": "Título claro e acionável da tarefa",
      "description": "Contexto adicional, detalhes, observações relevantes",
      "priority": "high|medium|low",
      "dueDate": "YYYY-MM-DD ou null",
      "contactName": "Nome exato da pessoa envolvida ou null"
    }
  ],
  "decisions": ["Descrição completa da decisão tomada"],
  "category": "meeting|lunch|coffee|call|visit|event|casual|whatsapp",
  "meetingType": "record|schedule",
  "scheduledDate": "YYYY-MM-DD ou null"
}

REGRAS FINAIS:
- NUNCA invente informações que não estão no áudio
- Se algo é ambíguo, use o contexto para inferir a melhor interpretação
- Se o áudio é muito curto ou vago, extraia o que for possível sem inventar
- Mantenha consistência: se "João" aparece em contacts, use exatamente "João" em contactName das tasks
- Tarefas devem ter títulos ACIONÁVEIS (começar com verbo quando possível): "Enviar proposta", "Ligar para cliente", "Revisar contrato"
- Não duplique: se a mesma pessoa aparece 3 vezes no áudio, crie APENAS 1 contato
- Se a mesma tarefa é mencionada mais de uma vez, crie APENAS 1 tarefa (com a informação mais completa)`
      },
      {
        role: "user",
        content: await buildUserPrompt(transcribedText, userId)
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
      topic: "",
      contacts: [],
      tasks: [],
      decisions: [],
      category: "meeting",
      meetingType: "record",
    };
  }

  const meetingTopic = extracted.topic || null;

  let folderId: string | null = null;
  if (meetingTopic) {
    const existingFolder = await storage.findFolderByTopic(meetingTopic, userId);
    if (existingFolder) {
      folderId = existingFolder.id;
    } else {
      const newFolder = await storage.createMeetingFolder({
        name: meetingTopic,
        topic: meetingTopic,
        userId,
      });
      folderId = newFolder.id;
    }
  }

  const isSchedule = extracted.meetingType === "schedule";
  // Fix: Ensure scheduledDate is correctly parsed and fallback to null if invalid
  let scheduledDate: Date | null = null;
  if (isSchedule && extracted.scheduledDate) {
    const parsedDate = new Date(extracted.scheduledDate);
    if (!isNaN(parsedDate.getTime())) {
      scheduledDate = parsedDate;
    }
  }

  const meeting = await storage.createMeeting({
    title: extracted.title || "Reunião sem título",
    summary: extracted.summary || "",
    transcription: transcribedText,
    topic: meetingTopic,
    folderId,
    scheduledDate,
    meetingType: isSchedule ? "schedule" : "record",
    status: isSchedule ? "scheduled" : "completed",
    category: extracted.category || "meeting",
    userId,
  });

  const contactNameToIdMap = new Map<string, string>();

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

    contactNameToIdMap.set(contactData.name.toLowerCase(), contact.id);
    await storage.addMeetingContact(meeting.id, contact.id);
  }

  for (const taskData of extracted.tasks || []) {
    if (!taskData.title) continue;

    let taskContactId: string | null = null;
    if (taskData.contactName) {
      const normalizedName = taskData.contactName.toLowerCase();
      taskContactId = contactNameToIdMap.get(normalizedName) || null;

      if (!taskContactId) {
        const entries = Array.from(contactNameToIdMap.entries());
        for (const [mapName, mapId] of entries) {
          if (mapName.includes(normalizedName) || normalizedName.includes(mapName)) {
            taskContactId = mapId;
            break;
          }
        }
      }

      if (!taskContactId) {
        let contact = await storage.createContact({
          name: taskData.contactName,
          userId,
        });
        taskContactId = contact.id;
        contactNameToIdMap.set(normalizedName, contact.id);
        await storage.addMeetingContact(meeting.id, contact.id);
      }
    }

    await storage.createTask({
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority || "medium",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      meetingId: meeting.id,
      contactId: taskContactId,
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

interface ImageAnalysisResult {
  summary: string;
  contacts: Array<{ name: string; company?: string; role?: string }>;
  tasks: Array<{ title: string; description?: string; priority: string; dueDate?: string; contactName?: string }>;
  decisions: string[];
}

export async function analyzeImages(
  imageDataUrls: string[],
  meetingId: string,
  userId: string
): Promise<ImageAnalysisResult> {
  const userSettings = await storage.getUserSettings(userId);
  const transcriptionLang = userSettings?.transcriptionLanguage || "pt-BR";
  const extractionLevel = userSettings?.taskExtractionLevel || "aggressive";
  const langConfig = LANG_MAP[transcriptionLang] || LANG_MAP["pt-BR"];

  const meeting = await storage.getMeeting(meetingId, userId);
  if (!meeting) throw new Error("Meeting not found");

  const todayDate = new Date().toISOString().split("T")[0];

  const imageContent: Array<{ type: "image_url"; image_url: { url: string } }> = imageDataUrls.map(url => ({
    type: "image_url" as const,
    image_url: { url },
  }));

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${langConfig.outputInstruction}

Você é o cérebro de um CRM inteligente. O usuário está anexando imagens (prints de conversas de WhatsApp, documentos, fotos de anotações, etc.) a uma reunião já existente no sistema.

CONTEXTO DA REUNIÃO EXISTENTE:
- Título: ${meeting.title}
- Resumo atual: ${meeting.summary || "Sem resumo"}

Seu trabalho é ANALISAR as imagens e extrair informações COMPLEMENTARES que não estão no resumo atual.

DATA DE HOJE: ${todayDate}

${getTaskExtractionInstruction(extractionLevel)}

INSTRUÇÕES:
1. Leia e interprete TODAS as imagens enviadas
2. Se forem prints de WhatsApp, leia as mensagens e identifique:
   - Pessoas envolvidas na conversa
   - Compromissos, prazos, tarefas combinadas
   - Decisões tomadas
   - Informações relevantes de negócio
3. Se forem fotos de documentos, anotações ou outros materiais, extraia as informações relevantes
4. Gere um RESUMO COMPLEMENTAR (não repita o que já está no resumo da reunião)
5. Extraia NOVOS contatos, tarefas e decisões que aparecem nas imagens

FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):
{
  "summary": "Resumo complementar das informações extraídas das imagens (não repita o que já está no resumo da reunião)",
  "contacts": [
    { "name": "Nome da pessoa", "company": "Empresa (se identificável)", "role": "Cargo (se identificável)" }
  ],
  "tasks": [
    { "title": "Título da tarefa", "description": "Detalhes", "priority": "high|medium|low", "dueDate": "YYYY-MM-DD ou null", "contactName": "Nome da pessoa relacionada ou null" }
  ],
  "decisions": ["Decisão identificada nas imagens"]
}

REGRAS:
- NÃO invente informações que não estão nas imagens
- Se as imagens forem ilegíveis ou não tiverem conteúdo relevante, retorne summary vazio e arrays vazios
- Mantenha consistência com os dados já existentes na reunião`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analise as seguintes imagens anexadas à reunião e extraia informações complementares:" },
          ...imageContent,
        ],
      }
    ],
  });

  const resultText = response.choices[0]?.message?.content || "{}";
  let result: ImageAnalysisResult;
  try {
    result = JSON.parse(resultText);
  } catch {
    result = { summary: "", contacts: [], tasks: [], decisions: [] };
  }

  if (result.summary) {
    const newSummary = meeting.summary
      ? `${meeting.summary}\n\n📎 Análise das imagens:\n${result.summary}`
      : `📎 Análise das imagens:\n${result.summary}`;
    await storage.updateMeeting(meetingId, userId, { summary: newSummary });
  }

  const contactNameToIdMap = new Map<string, string>();

  for (const contactData of result.contacts || []) {
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

    contactNameToIdMap.set(contactData.name.toLowerCase(), contact.id);
    await storage.addMeetingContact(meetingId, contact.id);
  }

  for (const taskData of result.tasks || []) {
    if (!taskData.title) continue;

    let taskContactId: string | null = null;
    if (taskData.contactName) {
      const normalizedName = taskData.contactName.toLowerCase();
      taskContactId = contactNameToIdMap.get(normalizedName) || null;

      if (!taskContactId) {
        const entries = Array.from(contactNameToIdMap.entries());
        for (const [mapName, mapId] of entries) {
          if (mapName.includes(normalizedName) || normalizedName.includes(mapName)) {
            taskContactId = mapId;
            break;
          }
        }
      }
    }

    await storage.createTask({
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority || "medium",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      meetingId,
      contactId: taskContactId,
      status: "pending",
      userId,
    });
  }

  for (const decisionContent of result.decisions || []) {
    if (!decisionContent) continue;
    await storage.createDecision({
      content: decisionContent,
      meetingId,
      userId,
    });
  }

  return result;
}
