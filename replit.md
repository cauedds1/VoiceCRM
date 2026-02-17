# VoiceCRM - CRM Inteligente por Voz

## Overview
Voice-powered CRM system for professionals. Record audio after meetings, AI transcribes and automatically identifies/creates contacts, companies, tasks and decisions. Desktop-first, built for sale on Flippa as pre-revenue SaaS.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing + TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (Whisper for transcription, GPT for entity extraction)
- **Auth**: Replit Auth (OpenID Connect)

## Key Features
- Voice recording with real-time waveform visualization
- AI transcription (gpt-4o-mini-transcribe) and entity extraction (gpt-5-mini)
- Auto-creation of contacts and companies from voice mentions
- Task and decision extraction from meeting audio
- Full CRUD for contacts, companies, meetings, tasks
- Contacts grouped by company
- Meeting detail with participants, tasks, decisions, transcription
- Contact detail with meeting history
- Dark/light theme toggle

## Project Structure
```
client/src/
  pages/         - All page components (dashboard, meetings, contacts, companies)
  components/    - Reusable components (sidebar, theme toggle)
  hooks/         - Custom hooks (use-auth, use-toast)
  lib/           - Query client, auth utilities
server/
  routes.ts      - All API endpoints
  storage.ts     - Database operations (IStorage interface)
  ai.ts          - OpenAI integration (transcription + entity extraction)
  seed.ts        - Demo seed data
  integrations/  - Stripe and SendGrid integration points (ready for buyer)
shared/
  schema.ts      - Drizzle schema, Zod validators, TypeScript types
```

## API Endpoints
- `POST /api/meetings/process-audio` - Upload audio → transcribe → extract entities → create meeting
- `GET/PATCH/DELETE /api/meetings/:id` - Meeting CRUD
- `GET /api/meetings/:id/tasks|decisions|contacts` - Meeting relations
- `GET/POST/PATCH /api/contacts` - Contact CRUD
- `GET /api/contacts/:id/meetings` - Contact meeting history
- `GET/POST/PATCH /api/companies` - Company CRUD
- `GET/PATCH /api/tasks` - Task management

## Design Principles
- Vibrant teal/blue theme but NO visual clutter
- Generous spacing, clear hierarchy
- Portuguese (pt-BR) interface
- Desktop-first, mobile apps planned for later

## Integration Points (for Flippa buyer)
- Stripe: `server/integrations/stripe.ts` - Payment/subscription ready
- SendGrid: `server/integrations/sendgrid.ts` - Email notifications ready
