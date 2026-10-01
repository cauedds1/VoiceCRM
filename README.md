# VoiceCRM — CRM Inteligente por Voz

O VoiceCRM é um CRM para profissionais que fazem muitas reuniões, ligações e visitas. Depois de uma conversa, você grava um áudio contando o que aconteceu. A IA transcreve o áudio e cria sozinha os **contatos**, **empresas**, **tarefas** e **decisões** mencionados, sem precisar preencher formulários.

---

## ✨ Funcionalidades

### 🎙️ Gravação por voz
- No celular, a tela inicial já é a tela de gravação, pronta para começar.
- Mostra a forma de onda em tempo real e permite **pausar e retomar**.
- A gravação pausa sozinha quando a tela apaga, quando chega uma ligação ou quando você troca de app. Ela só termina quando você manda parar.
- Avisa antes de fechar a página no meio de uma gravação, para você não perder o áudio.
- **Funciona offline:** o áudio fica salvo no IndexedDB antes do envio e é reenviado automaticamente quando a conexão volta. A barra lateral mostra quantos envios estão pendentes.

### 🤖 Inteligência artificial
- **Transcrição** com `gpt-4o-mini-transcribe`, em 9 idiomas configuráveis.
- **Extração de entidades** com `gpt-5-mini`: contatos, empresas, tarefas, decisões, categoria e assunto da conversa.
- Entende datas relativas ("até sexta", "semana que vem") e define a prioridade das tarefas pelo tom e pela urgência da fala.
- Associa cada tarefa ao contato certo, mesmo quando o nome não bate exatamente.
- Percebe quando a fala está no futuro ("vou me reunir com…") e cria uma **reunião agendada** em vez de uma reunião já realizada.
- **Análise de imagens** com `gpt-4o`: anexe fotos ou prints a uma reunião e a IA extrai contatos, tarefas e decisões delas.
- O nível de extração de tarefas é configurável: agressivo, moderado ou conservador.

### 📇 CRM
- Cadastro completo (criar, ver, editar e excluir) de contatos, empresas, reuniões e tarefas.
- Contatos agrupados por empresa, com cidade e estado.
- **Unificação de empresas:** se você renomeia uma empresa para o nome de outra que já existe, as duas são mescladas. Os contatos duplicados são removidos e as reuniões passam para a empresa que ficou.
- Upload do logo da empresa (até 2 MB).
- As reuniões têm **categorias** (reunião, almoço, café, ligação, visita, evento, conversa informal, WhatsApp) e **pastas por assunto**, criadas pela IA. As pastas também podem ser organizadas manualmente.
- Página de **Tarefas** com filtros por status e prioridade e destaque para as atrasadas.
- **Agenda:** calendário mensal que mostra reuniões realizadas e agendadas.

### 📊 Relatórios
- Gráfico de reuniões por mês nos últimos 12 meses.
- Distribuição das reuniões por categoria.
- Os 5 contatos e as 5 empresas com mais reuniões.
- Taxa de conclusão das tarefas e alerta de tarefas atrasadas.

### ⚙️ Configurações e privacidade (LGPD)
- Interface em **português (pt-BR)** e **inglês**.
- Alteração de nome, e-mail e senha.
- **Exportação de todos os dados** em JSON (portabilidade).
- Exclusão da conta com remoção completa dos dados.
- Página de Política de Privacidade (`/privacy`), aceite obrigatório dos termos no cadastro e aviso de consentimento para gravação.

### 📱 PWA
- Pode ser instalado na tela inicial do celular. No Android a instalação é feita com um toque; no iOS o app mostra um passo a passo.

---

## 🛠️ Stack

| Camada         | Tecnologias |
|----------------|-------------|
| Frontend       | React 18, Vite, TailwindCSS, shadcn/ui (Radix), wouter, TanStack Query, Recharts, i18next |
| Backend        | Node.js, Express 5, TypeScript |
| Banco de dados | PostgreSQL + Drizzle ORM |
| IA             | OpenAI (transcrição, extração de entidades e visão) |
| Autenticação   | E-mail e senha (bcrypt + express-session, sessões guardadas no Postgres) |
| Integrações    | Stripe e SendGrid (estrutura pronta em `server/integrations/`) |

---

## 📁 Estrutura do projeto

```
client/src/
  pages/         Páginas (dashboard, reuniões, contatos, empresas, tarefas, agenda, relatórios, configurações)
  components/    Componentes reutilizáveis (sidebar, tema, idioma, componentes ui do shadcn)
  hooks/         Hooks (autenticação, toasts, uploads pendentes)
  lib/           Query client, utilitários de auth, armazenamento offline de áudio
  i18n/          Traduções (pt-BR.json, en.json)
server/
  index.ts       Ponto de entrada do servidor Express
  routes.ts      Endpoints da API
  storage.ts     Acesso ao banco de dados
  ai.ts          Integração com a OpenAI (transcrição, extração, visão)
  seed.ts        Dados de demonstração
  integrations/  Stripe e SendGrid
shared/
  schema.ts      Schema do Drizzle, validadores Zod e tipos TypeScript
  models/        Modelos de autenticação e chat
script/
  build.ts       Script de build de produção
```

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 20 ou superior
- Um banco PostgreSQL (local ou na nuvem, como o Neon)
- Uma chave da API da OpenAI

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure as variáveis de ambiente

| Variável                          | Obrigatória | Descrição |
|-----------------------------------|:-----------:|-----------|
| `DATABASE_URL`                    | ✅ | String de conexão do PostgreSQL |
| `SESSION_SECRET`                  | ✅ | Segredo usado para assinar as sessões |
| `AI_INTEGRATIONS_OPENAI_API_KEY`  | ✅ | Chave da API da OpenAI |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | ➖ | URL base da API da OpenAI (se usar um proxy ou gateway) |
| `PORT`                            | ➖ | Porta do servidor (padrão: `5000`) |
| `STRIPE_SECRET_KEY`               | ➖ | Necessária só para ativar pagamentos |
| `SENDGRID_API_KEY`                | ➖ | Necessária só para ativar o envio de e-mails |

### 3. Crie as tabelas no banco
```bash
npm run db:push
```

### 4. Inicie em modo de desenvolvimento
```bash
npm run dev
```
Abra **http://localhost:5000**. O mesmo servidor entrega a API e o frontend, com o Vite em modo middleware.

### Build e produção
```bash
npm run build   # gera dist/
npm start       # sincroniza o schema e inicia em produção
```

### Outros comandos
```bash
npm run check   # checagem de tipos com TypeScript
```

---

## 🔌 Principais endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/meetings/process-audio` | Envia o áudio, transcreve, extrai as entidades e cria a reunião |
| `GET/PATCH/DELETE` | `/api/meetings/:id` | Ver, editar e excluir reunião |
| `GET` | `/api/meetings/:id/tasks` · `/decisions` · `/contacts` | Dados ligados à reunião |
| `PATCH` | `/api/meetings/:id/folder` | Mover a reunião de pasta |
| `GET/POST/PATCH` | `/api/contacts` | Contatos |
| `GET` | `/api/contacts/:id/meetings` | Histórico de reuniões do contato |
| `GET/POST/PATCH` | `/api/companies` | Empresas |
| `GET` | `/api/companies/check-name` | Verifica se já existe empresa com o nome (para unificação) |
| `POST` | `/api/companies/:id/merge` | Mescla duas empresas |
| `POST` | `/api/companies/:id/logo` | Upload do logo |
| `GET/PATCH` | `/api/tasks` | Tarefas |
| `GET/POST/PATCH/DELETE` | `/api/meeting-folders` | Pastas de reuniões |
| `GET` | `/api/reports/meetings-by-month` · `/api/reports/summary` | Relatórios |
| `GET/PATCH` | `/api/settings` | Preferências do usuário |
| `PATCH` | `/api/account/profile` · `/email` · `/password` | Dados da conta |
| `GET` | `/api/account/export` | Exportação de dados (LGPD) |
| `DELETE` | `/api/account` | Exclusão da conta |

---

## 🗄️ Modelo de dados

Tabelas principais: `users`, `sessions`, `companies`, `contacts`, `meetings`, `meeting_contacts`, `meeting_folders`, `meeting_attachments`, `tasks`, `decisions` e `user_settings`. Todas estão definidas em `shared/schema.ts` e `shared/models/`.
