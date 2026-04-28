# Jobs Optima — API

NestJS backend. See the [root README](../../README.md) for full setup.

## Development

```bash
# From repo root
bun run dev:api   # → http://localhost:8888

# From this directory
npm run start:dev
```

## Modules

| Module | Responsibility |
|---|---|
| `auth` | JWT authentication, user sessions |
| `resume` | Resume CRUD, PDF export, ATS scoring |
| `profile` | Candidate profile management |
| `job` | Job tracking, keyword extraction |
| `job-scanner` | Scheduled job board scanning |
| `application` | Application pipeline and stats |
| `ai` | AI provider abstraction (Gemini / GPT-4 / Claude) |
| `documents` | File upload, PDF/DOCX parsing |

## Stack

- NestJS, TypeScript
- MongoDB with Mongoose
- Redis (Bull queues for job scanner)
- Google Gemini 2.5 Flash (primary AI), OpenAI GPT-4, Anthropic Claude
- JWT + Passport.js
