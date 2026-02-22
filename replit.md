# VoiceCRM - CRM Inteligente por Voz

## Overview
Voice-powered CRM system for professionals. Record audio after meetings, AI transcribes and automatically identifies/creates contacts, companies, tasks and decisions. Desktop-first, built for sale on Flippa as pre-revenue SaaS.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing + TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (Whisper for transcription, GPT for entity extraction)
- **Auth**: Native email/password (bcrypt + express-session)

## Key Features
- Mobile-first recording: on mobile, the home screen IS the recording page (ready to record immediately)
- Voice recording with real-time waveform visualization, pause/resume support
- Recording never stops unless user explicitly clicks stop
- Auto-pause on screen off, incoming calls, app switch (visibilitychange + blur events)
- beforeunload protection prevents accidental data loss during active recording
- AI transcription (gpt-4o-mini-transcribe) and entity extraction (gpt-5-mini)
- Ultra-calibrated AI prompt that understands ANY professional context (meetings, calls, quick notes, daily summaries, negotiations, etc.)
- Auto-creation of contacts and companies from voice mentions with smart name/company disambiguation
- Task extraction with aggressive pattern matching (obligations, commitments, follow-ups, implicit actions, reminders)
- AI links contacts to tasks automatically (contactName → contactId resolution with fuzzy matching)
- Smart date interpretation (relative dates, "até sexta", "semana que vem", etc.)
- Priority inference from tone and context (urgency words, deadlines, blocking status)
- Dedicated Tasks page with status/priority filtering, overdue detection, meeting links
- Full CRUD for contacts, companies, meetings, tasks
- Contacts grouped by company with city/state location
- Companies with city/state location fields
- Company merge/unification: when renaming a company to match an existing one, system auto-merges contacts (deduplicates by name), reassigns all meetings, and deletes the duplicate
- Company logo file upload (max 2MB, stored as base64)
- Image attachments: upload photos/screenshots to meetings, view in gallery with fullscreen preview, AI analyzes images (GPT-4o vision) to extract contacts/tasks/decisions
- Meeting categories: AI auto-detects interaction type (meeting, lunch, coffee, call, visit, event, casual, whatsapp) from transcription context
- Category filter on meetings page, category badge on meeting cards, manual category editing on meeting detail
- Intelligent meeting folders: AI auto-detects topic and groups meetings with same subject into folders
- Topic/subject filter on meetings page
- Folder view toggle (list vs grouped by folder)
- Manual folder management: rename, delete, move meetings between folders
- Voice-based meeting scheduling: AI detects future-tense language to create scheduled (future) meetings vs recorded (past) meetings
- Agenda/Calendar page: monthly calendar view with visual indicators (green=recorded, cyan=scheduled), clickable day cells, day detail panel with meeting cards, prev/next month navigation
- Meeting detail with participants, tasks, decisions, transcription
- Contact detail with meeting history
- Monthly meeting reports with bar chart (Recharts)
- Interactive reports: overdue tasks alert with direct links, meetings by category pie chart, top 5 contacts/companies by meeting frequency, task completion rate progress bar
- Dark mode only (no light theme)
- Settings page: profile, email, password, interface language (pt-BR/en), transcription language (9 langs), task extraction level (aggressive/moderate/conservative), data export (JSON), account deletion
- LGPD compliance: Privacy Policy page (bilingual, /privacy), mandatory terms acceptance on registration, recording consent notice, data export (portability), enhanced deletion with data purge guarantee
- AI respects user settings: transcription language drives Whisper API language param + output language; task extraction level adjusts prompt aggressiveness
- PWA "Add to Home Screen" popup: Android uses beforeinstallprompt API for one-tap install, iOS shows step-by-step guide. Popup appears every visit on mobile until app is installed (standalone mode).

## Project Structure
```
client/src/
  pages/         - All page components (dashboard, meetings, contacts, companies, tasks, reports, settings)
  components/    - Reusable components (sidebar)
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
- `GET /api/companies/check-name` - Check if company name exists (for merge detection)
- `POST /api/companies/:id/merge` - Merge source company into target (unify contacts, transfer meetings)
- `POST /api/companies/:id/logo` - Upload company logo (max 2MB, stored as base64)
- `GET/PATCH /api/tasks` - Task management
- `GET/POST /api/meeting-folders` - Folder CRUD
- `PATCH/DELETE /api/meeting-folders/:id` - Update/delete folder
- `PATCH /api/meetings/:id/folder` - Move meeting to/from folder
- `GET /api/reports/meetings-by-month` - Monthly meeting aggregation (last 12 months)
- `GET /api/reports/summary` - Overall CRM summary stats
- `GET /api/settings` - Get user settings (language, extraction level)
- `PATCH /api/settings` - Update user settings
- `PATCH /api/account/profile` - Update user name (password required)
- `PATCH /api/account/email` - Update user email (password required)
- `PATCH /api/account/password` - Change password (current password required)
- `GET /api/account/export` - Export all user data as JSON (LGPD portability)
- `DELETE /api/account` - Delete account with cascade (password + confirmation required)

## Design Principles
- Vibrant teal/blue theme but NO visual clutter
- Generous spacing, clear hierarchy
- Portuguese (pt-BR) interface
- Mobile-first recording experience, responsive design works on both desktop and mobile

## Integration Points (for Flippa buyer)
- Stripe: `server/integrations/stripe.ts` - Payment/subscription ready
- SendGrid: `server/integrations/sendgrid.ts` - Email notifications ready
