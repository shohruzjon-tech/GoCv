# ---- Build Stage ----
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies for Puppeteer/Chromium build
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget curl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace root files
COPY package.json package-lock.json turbo.json ./

# Copy app & shared packages
COPY apps/cv-backend/ apps/cv-backend/
COPY packages/ packages/

# Install all deps (workspace-aware)
RUN npm ci --workspace=apps/cv-backend --include-workspace-root

# Build the backend
RUN npm run build --workspace=apps/cv-backend

# ---- Production Stage ----
FROM node:22-slim AS runner

WORKDIR /app

# Install runtime deps for Puppeteer/Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy built output and node_modules from builder
COPY --from=builder /app/apps/cv-backend/dist ./dist
COPY --from=builder /app/apps/cv-backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Don't run as root
RUN groupadd --gid 1001 nestjs && \
    useradd --uid 1001 --gid nestjs --shell /bin/bash --create-home nestjs
USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
