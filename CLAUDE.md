# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered resume optimization platform (monorepo) with a Next.js 15 frontend (`apps/web`), NestJS backend (`apps/api`), and a Chrome extension (`apps/extension`). The backend uses the Vercel AI SDK to support multiple LLM providers (Gemini, OpenAI, Anthropic) and optimizes resumes for ATS scoring.

## Development Commands

```bash
# Start all services
npm run dev          # Frontend (port 4000) + backend (port 8888)
npm run dev:web      # Frontend only
npm run dev:api      # Backend only
npm run dev:extension # Chrome extension with hot reload

# Build
npm run build        # All packages
npm run build:web / build:api / build:extension

# Testing
npm run test         # All packages
cd apps/api && npm run test          # Backend unit tests
cd apps/api && npm run test:e2e      # Backend e2e tests
cd apps/api && npx jest --testPathPattern=<file> # Single file

# Code quality
npm run lint         # All packages
npm run format       # Prettier

# Cleanup (port conflicts, Docker, Nx cache)
npm run cleanup:quick   # Kill ports 4000/8888/6379 + stop Docker
npm run cleanup:full    # Includes node_modules
npm run clean           # Nx cache only
```

## Environment Setup

Copy `.env.example` to `.env` in the repo root. Key variables:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` / `NEXTAUTH_SECRET` | Auth signing keys |
| `INTERNAL_API_URL` | URL Next.js SSR uses to reach the API (e.g. `http://localhost:8888/api`) |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `AI_PROVIDER` | `gemini` \| `openai` \| `anthropic` (default: `gemini`) |
| `AI_API_KEY` | API key for the selected provider |
| `AI_MODEL` | Optional model override (see `ai.constants.ts` for defaults) |
| `PLATFORM_GEMINI_API_KEY` | Separate key for internal platform tasks (job scanner scoring) |
| `REDIS_URL` | Upstash Redis URL (used by BullMQ job queue) |

## Architecture

### Request Flow

```
Browser → Next.js (port 4000)
  ├── NextAuth middleware (proxy.ts) guards dashboard routes
  ├── /api/auth/* → NextAuth credentials provider → NestJS /api/auth/login
  └── All other API calls → NestJS (port 8888, prefix /api)
```

Auth: NextAuth Credentials provider authenticates against the NestJS backend, stores the JWT `accessToken` in the session, and the frontend attaches it as `Authorization: Bearer` on API requests.

### Backend (`apps/api/src/`)

Domain-driven NestJS modules registered in `app.module.ts`:

| Module | Responsibility |
|---|---|
| `auth` | JWT login/register, guards |
| `resume` | Resume CRUD + PDF parser |
| `job` | Job CRUD + keyword extraction |
| `ai` | LLM orchestration via Vercel AI SDK |
| `job-scanner` | BullMQ background queue for scraping/scoring jobs |
| `application` | Job application tracking |
| `profile` | User profiles |
| `billing` | Subscription / usage management |
| `documents` | PDF generation + file upload |

Shared infrastructure lives in `src/common/` (guards, decorators, interceptors, utils) and `src/schemas/` (Mongoose schemas used across modules).

**AI provider system**: `AiService` in `modules/ai/ai.service.ts` instantiates the appropriate Vercel AI SDK provider (`@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`) based on the user's stored provider setting or the platform default. Model allowlists are in `ai.constants.ts` — update both `ALLOWED_MODELS` and the frontend settings page when adding models.

**All AI prompts** must live in `modules/ai/prompts/` following the agentic flow pattern defined in `context/BACKEND_PRINCIPLES.md`. Export `getSystemPrompt()` and `getUserPrompt(params)` from each file.

**Job scanner** uses BullMQ (`job-scanner.processor.ts` + `job-scanner.scheduler.ts`) with Playwright for browser-based scraping; `anti-detection.utils.ts` handles stealth.

### Frontend (`apps/web/src/`)

- **Route groups**: `(auth)` (login/signup) and `(dashboard)` (all protected pages) under `app/`
- **Data fetching**: Custom hooks in `hooks/api/` wrapping TanStack Query — create one hook file per domain (`use-resumes.ts`, `use-jobs.ts`, etc.)
- **Global state**: Zustand stores in `stores/` (`uiStore.ts`, `jobs-store.ts`, `job-scanner-store.ts`)
- **Component hierarchy**: `components/custom/` → `components/ui/` (shadcn/ui) → never Radix UI directly
- **Styling**: Tailwind only; semantic color tokens from `globals.css` (no hardcoded colors or `style=`)

### Chrome Extension (`apps/extension/`)

Built with WXT framework. `entrypoints/background.ts` is the service worker; `entrypoints/sidepanel/` is the side panel UI. Opens as a Chrome side panel on toolbar icon click.

## Coding Rules

### Backend
- Create `[module].constants.ts` for all module-specific constants/enums — no magic strings
- DTOs use `class-validator`; `UpdateDto` extends `PartialType(CreateDto)`
- Use `.lean()` on Mongoose queries when documents won't be modified
- Background work goes through BullMQ, not in-request processing

### Frontend
- Server components by default; add `'use client'` only when necessary
- Never store server state in Zustand — use TanStack Query cache as source of truth
- Use `cn()` from `/lib/utils` for conditional classnames
- Icons: `lucide-react` only, imported individually

### General
- TypeScript strict mode across all packages
- No `console.log` in production code
- No hardcoded values or magic strings
