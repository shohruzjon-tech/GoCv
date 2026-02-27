# ── Stage 1: Build the application ─────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json turbo.json ./

# Copy app & shared packages
COPY apps/cv-web/ apps/cv-web/
COPY packages/ packages/

# Install all deps (workspace-aware)
RUN npm ci --workspace=apps/cv-web --include-workspace-root

# Build-time env vars (override via --build-arg or docker-compose)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

ENV NEXT_TELEMETRY_DISABLED=1

# Build the frontend
RUN npm run build --workspace=apps/cv-web

# ── Stage 2: Production runner ─────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/cv-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/cv-web/.next/static ./apps/cv-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/cv-web/public ./apps/cv-web/public

USER nextjs

EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/cv-web/server.js"]
