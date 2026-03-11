FROM node:20-alpine AS base

# Install dependencies only
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma needs DATABASE_URL at build time for generate
ENV DATABASE_URL="file:./build.db"
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy prisma schema and migrations for runtime migrate
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data directory for SQLite
RUN mkdir -p /data && chown nextjs:nodejs /data
RUN mkdir -p /tmp && chown nextjs:nodejs /tmp

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/tmp/league.db"

# Copy build-time db as initial state (has schema applied)
COPY --from=builder --chown=nextjs:nodejs /app/prisma/build.db /app/prisma/initial.db

# Start server with migration attempt
CMD sh -c 'if [ ! -f /tmp/league.db ]; then cp /app/prisma/initial.db /tmp/league.db; fi && node_modules/.bin/prisma migrate deploy 2>/dev/null; node server.js'
