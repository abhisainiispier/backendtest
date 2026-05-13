# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy all source
COPY . .

# (Optional) Build step if you have TypeScript or need to bundle
# For now, we'll just copy the files as-is

# Production stage
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

# Copy entrypoint script
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application with entrypoint
CMD ["./entrypoint.sh"]
