# Dokploy Deployment Guide

## Critical Issue: Environment Variables Not Being Set

The `ECONNREFUSED` error occurs because Dokploy is not passing the `INTERNAL_API_URL` environment variable to the web service.

### Symptoms

```
Failed to proxy http://localhost:8888/api/...
Error: connect ECONNREFUSED 127.0.0.1:8888
```

This means the Next.js server is falling back to `localhost:8888` instead of using `http://api:8888/api` (the Docker service name).

---

## Solution: Set Environment Variables in Dokploy UI

### Step 1: Go to Your Dokploy Project

1. Open your Dokploy dashboard
2. Navigate to your **resume-builder** project
3. You should see two services: `web` and `api`

### Step 2: Set Environment Variables for EACH Service

Dokploy requires you to set environment variables separately for each service, not globally.

#### For the **API** service:

```env
# Required
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/resume-builder
JWT_SECRET=your-jwt-secret-here  # Generate with: openssl rand -base64 32
JWT_EXPIRATION=7d
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key-here
REDIS_URL=redis://default:<password>@<redis-host>:6379
CORS_ORIGIN=https://your-frontend-domain.com

# Optional (leave empty for Dokploy)
NODE_ENV=production
API_PORT=
```

#### For the **WEB** service:

```env
# Critical - This MUST be set!
INTERNAL_API_URL=http://api:8888/api

# Required
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-here  # Generate with: openssl rand -base64 32

# Optional
NODE_ENV=production
WEB_PORT=
```

### Step 3: Verify the Settings

The critical variable is:

```
INTERNAL_API_URL=http://api:8888/api
```

**Important Notes:**

- Use `http://api:8888` (the Docker service name), NOT `http://localhost:8888`
- Use `http://` not `https://` (internal Docker network)
- The path `/api` at the end is required

### Step 4: Redeploy

After setting the environment variables:

1. Click "Deploy" or "Rebuild" for BOTH services
2. Wait for the deployment to complete
3. Check the logs for any errors

---

## Verification

### Check if the environment variable is set:

1. **In Dokploy logs**, you should see Next.js starting
2. **In API logs**, you should see successful Redis connection
3. **In browser**, the app should load without `ECONNREFUSED` errors

### If still failing:

1. Check Dokploy logs for both services
2. Verify environment variables are set in Dokploy UI (not just in `.env.dokploy` file)
3. Ensure both services are on the same Docker network (should be automatic with docker-compose)

---

## Architecture Diagram

```
Browser
  ↓
  → https://your-frontend-domain.com (Traefik/Nginx)
      ↓
      → Web Service (Next.js) on Docker network
          ↓
          → (via INTERNAL_API_URL) http://api:8888/api
              ↓
              → API Service (NestJS) on Docker network
```

**Key Points:**

- Browser NEVER calls the backend directly
- All API calls go through Next.js proxy (`/api/proxy/*`)
- Next.js uses `INTERNAL_API_URL` to reach the backend
- Backend is NOT exposed to the internet (no public domain needed)

---

## Common Mistakes

### ❌ Wrong: Setting `INTERNAL_API_URL=http://localhost:8888/api`

This won't work in Docker because `localhost` refers to the container itself, not the API service.

### ✅ Correct: Setting `INTERNAL_API_URL=http://api:8888/api`

Uses the Docker service name from `docker-compose.yml`.

### ❌ Wrong: Only setting environment variables in `.env.dokploy` file

The file is for reference only. You MUST set them in Dokploy UI.

### ✅ Correct: Setting environment variables in Dokploy UI for each service

Dokploy reads environment variables from its UI, not from files in your repo.

---

## Testing Locally with Docker

To test the Docker setup locally before deploying:

```bash
# Build and start services
docker compose --env-file .env.dokploy up --build

# Check logs
docker compose logs -f web
docker compose logs -f api

# Stop services
docker compose down
```

This will simulate the Dokploy environment on your local machine.
