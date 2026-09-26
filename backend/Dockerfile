# ==========================================
# DentalSuite NestJS Backend - Fly.io Production Dockerfile
# Multi-stage optimized Node.js 22 Alpine build
# ==========================================

# Stage 1: Build & compile
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools if needed
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm install --frozen-lockfile || npm install

# Copy source code and configuration
COPY tsconfig.json nest-cli.json ./
COPY src/ ./src/

# Compile NestJS app to dist/
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Create non-privileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package manifests and production dependencies
COPY package.json package-lock.json* ./
RUN npm install --only=production --ignore-scripts && npm cache clean --force

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Set ownership to app user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose Fly.io default internal port
EXPOSE 8080

# Healthcheck targeting our health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Start production server
CMD ["node", "dist/main.js"]
