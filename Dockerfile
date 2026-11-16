# Production image for the NGAS frontend (Next.js standalone server).
# Build:  docker compose -f docker-compose.yml -f docker-compose.prod.yml build

ARG NODE_VERSION=22

# ── 1. deps: install exactly what package-lock.json says ───────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── 2. builder: compile the optimised Next.js build ────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time,
# so they are build arguments, not runtime variables. None of them are secrets.
ARG NEXT_PUBLIC_API_BASE_URL=/api/backend
ARG NEXT_PUBLIC_API_MODE=mock
ARG NEXT_PUBLIC_API_TIMEOUT=15000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_API_MODE=${NEXT_PUBLIC_API_MODE} \
    NEXT_PUBLIC_API_TIMEOUT=${NEXT_PUBLIC_API_TIMEOUT}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ── 3. runner: minimal runtime, no npm deps beyond the traced standalone set ───
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# npm/yarn/corepack are not needed to run `node server.js`; dropping them shrinks the image
# and removes their (frequently CVE-flagged) dependency trees.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg \
 && addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs \
 && mkdir -p .next/cache && chown nextjs:nodejs .next/cache

# App files are owned by root and read-only for the runtime user; only .next/cache is writable.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login',{redirect:'manual'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

# Exec form: node is PID 1 and receives SIGTERM directly (Next's server handles it and exits).
CMD ["node", "server.js"]
