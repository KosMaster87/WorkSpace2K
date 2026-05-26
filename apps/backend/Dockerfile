# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /build

# Package files first for Docker layer caching
COPY apps/backend/package*.json ./apps/backend/

# Prisma schema required for postinstall (prisma generate)
COPY apps/backend/prisma/ ./apps/backend/prisma/

# Install all dependencies (postinstall triggers prisma generate)
RUN cd apps/backend && npm install

# Copy TypeScript source files
COPY apps/backend/src/        ./apps/backend/src/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY packages/shared/src/     ./packages/shared/src/

# Compile TypeScript → dist/  (tsc-alias rewrites path aliases to relative paths)
RUN cd apps/backend && npm run build

# Seed-Script kompilieren → dist-seed/prisma/seed.js
# (tsconfig.seed.json: rootDir ".", outDir "dist-seed", inkludiert prisma/**)
RUN cd apps/backend && npx tsc --project tsconfig.seed.json

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# OpenSSL 3.x für Prisma Query Engine (linux-musl-openssl-3.0.x)
# node:24-alpine basiert auf Alpine 3.20+ mit OpenSSL 3.x — explizit installieren
# damit libssl.so.3 für den Prisma-Binary verfügbar ist
RUN apk add --no-cache openssl

# Copy compiled JavaScript output
COPY --from=builder /build/apps/backend/dist/ ./dist/

# Kompiliertes Seed-Script kopieren (für einmalige DB-Initialisierung)
COPY --from=builder /build/apps/backend/dist-seed/ ./dist-seed/

# Copy package files and prisma schema for production install
COPY apps/backend/package*.json ./
COPY apps/backend/prisma/ ./prisma/

# Install production dependencies only
# Hinweis: --omit=dev überspringt die prisma CLI → prisma generate läuft nicht neu.
# Daher wird der bereits generierte Client aus dem Builder-Stage kopiert (nächster Schritt).
RUN npm install --omit=dev

# Vorgenerierter Prisma-Client aus Builder-Stage kopieren.
# Builder hat prisma generate mit binaryTargets ["native", "linux-musl-openssl-3.0.x"]
# ausgeführt — dieser Binary läuft auf Alpine + OpenSSL 3.x.
COPY --from=builder /build/apps/backend/node_modules/.prisma/ ./node_modules/.prisma/

EXPOSE 3000

# Note: Run "docker compose exec backend npx prisma migrate deploy" after first start
CMD ["node", "dist/apps/backend/src/index.js"]
