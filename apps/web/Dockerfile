# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy everything needed for the build
COPY . .

# Set build-time environment variables
# INTERNAL_API_URL is NOT baked in at build time — it is resolved at runtime
# by Next.js rewrites, so no build arg is needed here.
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies and build
RUN npm install && \
    cd apps/web && \
    npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Copy the entire monorepo structure (needed for workspace dependencies)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/node_modules ./node_modules

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 4000

# Start the application
WORKDIR /app/apps/web
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]