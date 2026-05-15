# =========================
# Build stage
# =========================
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Copy .env file
COPY .env .env

# =========================
# Production stage
# =========================
FROM node:18-alpine

WORKDIR /app

# Install netcat for health checks and wait scripts
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --only=production

# Copy application files from builder
COPY --from=builder /app/server.js ./
COPY --from=builder /app/db.js ./
COPY --from=builder /app/setup-db.js ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy .env file inside container
COPY --from=builder /app/.env ./.env

# Copy entrypoint script
COPY --from=builder /app/entrypoint.sh ./

# Give execute permission
RUN chmod +x ./entrypoint.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

# Start application
CMD ["./entrypoint.sh"]
