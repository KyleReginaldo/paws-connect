# Multi-stage Dockerfile for Next.js app on Cloud Run
# 1) Dependencies stage
FROM node:20-slim AS deps

# Install libvips for sharp (Next.js image optimization) if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    git \
    libc6 \
    libgcc1 \
    libstdc++6 \
    libvips \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies based on lockfile present
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then corepack enable && corepack prepare yarn@stable --activate && yarn install --frozen-lockfile; \
    else npm install; fi

# 2) Builder stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js to production build
ENV NODE_ENV=production

# Build the Next.js app
RUN npm run build

# 3) Runner stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    # Cloud Run provides PORT env var, Next should listen on it
    PORT=8080 \
    # Disable telemetry in container
    NEXT_TELEMETRY_DISABLED=1

# Add a non-root user for security
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# Copy necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080

# Cloud Run expects the server to bind to $PORT
CMD ["sh", "-c", "next start -p ${PORT}"]
