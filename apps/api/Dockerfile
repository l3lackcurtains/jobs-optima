# Build stage
FROM oven/bun:1.1.42 AS builder

WORKDIR /app

# Copy everything needed for the build
COPY . .

# Install dependencies and build
RUN bun install && \
    cd apps/api && \
    bun run build

# Production stage
FROM oven/bun:1.1.42

WORKDIR /app

# Install runtime dependencies and Chrome dependencies for Playwright
RUN apt-get update && apt-get install -y \
    dumb-init \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Copy node_modules from builder (already has all dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy PDF templates - IMPORTANT: These are needed for PDF generation
COPY apps/api/src/modules/documents/pdf/templates ./apps/api/src/modules/documents/pdf/templates

# Install Chrome browser for Playwright
RUN cd /app && bunx playwright install chromium --with-deps

# Expose port
EXPOSE 8888

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "apps/api/dist/main.js"]