# ==============================================================================
# Stage 1: Builder (Compile TypeScript & Generate Prisma)
# ==============================================================================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependensi sistem untuk kompilasi Prisma & OpenSSL
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Salin package lockfile & skema Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install seluruh dependensi
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Salin source code & config TypeScript
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript ke dist/
RUN npm run build

# ==============================================================================
# Stage 2: Production Runner (Lean, Secure, Non-Root)
# ==============================================================================
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl & ca-certificates di runtime image
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Salin package lockfile & prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install hanya dependencies produksi
RUN npm ci --omit=dev

# Salin compiled JavaScript dari builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Berikan hak akses kepada user non-root 'node'
RUN chown -R node:node /app

USER node

EXPOSE 5000

# Entrypoint: deploy migrasi -> idempotent seed -> start production server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node dist/server.js"]
