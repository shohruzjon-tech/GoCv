# ---- Build Stage ----
FROM node:22-slim AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json turbo.json ./

# Copy app & shared packages
COPY apps/cv-web/ apps/cv-web/
COPY packages/ packages/

# Install all deps (workspace-aware)
RUN npm ci --workspace=apps/cv-web --include-workspace-root

# Build args for Next.js (baked at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the frontend
RUN npm run build --workspace=apps/cv-web

# ---- Production Stage ----
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder /app/apps/cv-web/.next/standalone ./
COPY --from=builder /app/apps/cv-web/.next/static ./apps/cv-web/.next/static
COPY --from=builder /app/apps/cv-web/public ./apps/cv-web/public

# Don't run as root
RUN groupadd --gid 1001 nextjs && \
    useradd --uid 1001 --gid nextjs --shell /bin/bash --create-home nextjs
USER nextjs

ENV PORT=4001
EXPOSE 4001

CMD ["node", "apps/cv-web/server.js"]
