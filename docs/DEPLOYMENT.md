# Deployment Guide

## Docker Compose (Recommended)

### Local / Development

```bash
cp .env.example .env
# Set your values — minimum: GOOGLE_GENERATIVE_AI_API_KEY

docker compose up -d
# Open http://localhost:4000
```

### Production with HTTPS (Caddy)

```bash
cp .env.example .env
# Set: DOMAIN, GOOGLE_GENERATIVE_AI_API_KEY, JWT_SECRET, MONGO_ROOT_PASSWORD

docker compose --profile production up -d
# Caddy provisions Let's Encrypt SSL automatically
# Open https://your-domain.com
```

### Dokploy

1. Point Dokploy at this repo's `docker-compose.yml`
2. Set environment variables (see [Environment Variables](#environment-variables) below)
3. Only the `web` service needs a public domain — `api` communicates internally via `INTERNAL_API_URL=http://api:8888/api`
4. Traefik handles HTTPS and routing automatically

## Architecture

```
Internet
    ↓
[Traefik / Caddy]     ← TLS termination, public routing
    ↓
[Web :4000]           ← only public-facing service
    ├→ /api/proxy/*   → [API :8888]  (internal Docker network)
    │                        ↓
    │                   [MongoDB :27017]
    │                   [Redis :6379]
    └→ /*             → Next.js SSR / static
```

Browser traffic proxies through Next.js rewrites — the API is never called directly from the browser.

## Services

| Service | Port | Notes |
|---|---|---|
| Web (Next.js) | 4000 (dev) / 3000 (Docker) | Only public-facing service |
| API (NestJS) | 8888 | Internal only |
| MongoDB | 27017 | Internal only |
| Redis | 6379 | Internal only |
| Caddy | 80 / 443 | Production profile only |

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Primary AI provider (Gemini 2.5 Flash) |

### Recommended for Production

| Variable | Description | Generate with |
|---|---|---|
| `JWT_SECRET` | JWT signing secret | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | NextAuth session secret | `openssl rand -base64 32` |
| `MONGO_ROOT_PASSWORD` | MongoDB root password | any strong password |
| `DOMAIN` | Your domain for HTTPS | e.g. `jobsoptima.com` |

### Database & Cache

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/resume-builder` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL (Upstash: `rediss://default:PASSWORD@HOST.upstash.io:6379`) |

### Optional

| Variable | Default | Description |
|---|---|---|
| `INTERNAL_API_URL` | `http://api:8888/api` (Docker) / `http://localhost:8888/api` (dev) | Next.js server → API URL |
| `CORS_ORIGIN` | `http://localhost:4000` | Allowed CORS origin |
| `WEB_PORT` | `4000` | Override web port |
| `API_PORT` | `8888` | Override API port |

See [`.env.example`](../.env.example) for the full annotated reference.

## Useful Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f api

# Stop services
docker compose down

# Stop and wipe all data
docker compose down -v

# Rebuild after code changes
docker compose build --no-cache && docker compose up -d
```

## Troubleshooting

### API can't connect to MongoDB

```bash
docker compose ps          # check all services are healthy
docker compose logs mongodb
```

Verify `MONGODB_URI` matches the MongoDB service name (`mongodb`) when running in Docker.

### SSL certificate issues (Caddy)

1. Ensure ports 80 and 443 are open on your server
2. Ensure DNS A record points to your server IP
3. Check Caddy logs: `docker compose logs caddy`

### Port conflicts

```bash
WEB_PORT=3001 API_PORT=8889 docker compose up -d
```

### Build failures

```bash
# Check disk space
df -h

# Build without cache
docker compose build --no-cache
```
