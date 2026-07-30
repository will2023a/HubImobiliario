# Backend - Gestor Pro 360
FROM node:18-alpine

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Install ALL dependencies (including devDependencies for prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY src ./src/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start: run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
