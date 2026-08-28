# frontend/Dockerfile
FROM node:22-alpine AS base
# ==========================================
# FIX: Forzar resolución IPv4 para evitar el delay de 30s de Node en SSR
# ==========================================
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# ==========================================
# STAGE 1: Dependencies
# ==========================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

# Instalar pnpm (versión coincidente con pnpm-lock v11)
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --ignore-scripts

# ==========================================
# STAGE 2: Builder
# ==========================================
FROM base AS builder

# Instalar pnpm en esta etapa también
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables Dummy de Prisma y Auth para que el prerendering de Next.js no falle
ENV CI=true
ENV VERCEL=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV BETTER_AUTH_SECRET="build_time_dummy_secret_for_prerendering_123456"

# Generar cliente de Prisma
RUN npx prisma generate

# 1. Variables de Configuración General
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_DOMAIN
ARG NEXT_PUBLIC_ENVIRONMENT
# 2. Donaciones y Pagos (NUEVAS)
ARG NEXT_PUBLIC_YAPE_PHONE
ARG NEXT_PUBLIC_YAPE_QR_IMAGE
ARG NEXT_PUBLIC_PAYPAL_URL
ARG NEXT_PUBLIC_PATREON_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT

ENV NEXT_PUBLIC_YAPE_PHONE=$NEXT_PUBLIC_YAPE_PHONE
ENV NEXT_PUBLIC_YAPE_QR_IMAGE=$NEXT_PUBLIC_YAPE_QR_IMAGE
ENV NEXT_PUBLIC_PAYPAL_URL=$NEXT_PUBLIC_PAYPAL_URL
ENV NEXT_PUBLIC_PATREON_URL=$NEXT_PUBLIC_PATREON_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ==========================================
# Runner (NO necesita las vars en runtime)
# ==========================================
FROM base AS runner
WORKDIR /app
ENV NEXT_PUBLIC_ENVIRONMENT=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Instalar Prisma CLI para poder ejecutar las migraciones en el runner
RUN npm install prisma@7.8.0

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
