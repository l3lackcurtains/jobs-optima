# Contributing to Jobs Optima

Thanks for taking the time to contribute. Here's everything you need.

## Development Setup

**Prerequisites:** Node.js 20.9+, Bun 1.x, MongoDB 6+, Redis

```bash
git clone https://github.com/l3lackcurtains/resume-builder.git
cd resume-builder
bun install

cp .env.example .env
# Set at minimum: GOOGLE_GENERATIVE_AI_API_KEY, MONGODB_URI

bun run dev
# Web → http://localhost:4000
# API  → http://localhost:8888
```

## Project Structure

```
apps/
  web/        Next.js 16 frontend
  api/        NestJS backend
  extension/  Chrome extension (WXT)
context/      Architecture principles (read before contributing to API or web)
docs/         Deployment guides
```

Read [`context/BACKEND_PRINCIPLES.md`](context/BACKEND_PRINCIPLES.md) before touching the API and [`context/DESIGN_PRINCIPLES.md`](context/DESIGN_PRINCIPLES.md) before touching the frontend.

## Making Changes

1. Fork the repo and create a branch from `main`:

   ```bash
   git checkout -b feat/my-feature
   git checkout -b fix/my-fix
   git checkout -b docs/my-docs-update
   ```

2. Make your changes. Follow existing code style — Prettier and ESLint are configured.

3. Run checks before opening a PR:

   ```bash
   bun run lint
   bun run format
   ```

4. Open a pull request against `main` with a clear description of what changed and why.

## Branch Naming

| Type | Pattern |
|---|---|
| Feature | `feat/short-description` |
| Bug fix | `fix/short-description` |
| Docs | `docs/short-description` |
| Refactor | `refactor/short-description` |

## Good First Issues

Check the [issues tab](https://github.com/l3lackcurtains/resume-builder/issues) for tasks labeled `good first issue`. Good areas to start:

- **Resume templates** — the app optimizes existing resumes but lacks a from-scratch template library
- **LinkedIn import** — parsing LinkedIn profile data into a profile
- **Job board connectors** — extending the job scanner with new sources
- **UI improvements** — see open issues for specific pages

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser / OS / Node version

## Security Issues

Do **not** open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md).
