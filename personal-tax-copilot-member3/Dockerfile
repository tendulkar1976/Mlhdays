# ==============================================================================
# Production Multi-Stage Dockerfile for AI Personal Tax Copilot (Frontend)
# Target: Node.js 20 Alpine with non-root user execution
# ==============================================================================

# Stage 1: Dependency Installation
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Production Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG NEXT_PUBLIC_ENABLE_MOCKS=true
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_ASSESSMENT_YEAR="AY 2026-27"
ARG NEXT_PUBLIC_TAX_PERIOD="FY 2025-26"

ENV NEXT_PUBLIC_ENABLE_MOCKS=$NEXT_PUBLIC_ENABLE_MOCKS
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ASSESSMENT_YEAR=$NEXT_PUBLIC_ASSESSMENT_YEAR
ENV NEXT_PUBLIC_TAX_PERIOD=$NEXT_PUBLIC_TAX_PERIOD

RUN npm run build

# Stage 3: Production Runner (Non-Root Execution)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system user & group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check using built-in /api/health route
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]