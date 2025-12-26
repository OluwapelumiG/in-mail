# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Ensure public directory exists (Next.js requires it)
RUN mkdir -p public

# Build arguments for URLs (defaults provided)
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_DOCKER_API_URL=http://api.inmail.local:8080
ARG NEXT_PUBLIC_DOCKER_SMTP_HOST=api.inmail.local
ARG NEXT_PUBLIC_DOCKER_WEB_URL=http://web.inmail.local:3000
ARG NEXT_PUBLIC_HOST_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_HOST_SMTP_HOST=localhost
ARG NEXT_PUBLIC_HOST_WEB_URL=http://localhost:3000
ARG NEXT_PUBLIC_PROXY_URL=http://inmail.local

# Set as environment variables for Next.js
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DOCKER_API_URL=$NEXT_PUBLIC_DOCKER_API_URL
ENV NEXT_PUBLIC_DOCKER_SMTP_HOST=$NEXT_PUBLIC_DOCKER_SMTP_HOST
ENV NEXT_PUBLIC_DOCKER_WEB_URL=$NEXT_PUBLIC_DOCKER_WEB_URL
ENV NEXT_PUBLIC_HOST_API_URL=$NEXT_PUBLIC_HOST_API_URL
ENV NEXT_PUBLIC_HOST_SMTP_HOST=$NEXT_PUBLIC_HOST_SMTP_HOST
ENV NEXT_PUBLIC_HOST_WEB_URL=$NEXT_PUBLIC_HOST_WEB_URL
ENV NEXT_PUBLIC_PROXY_URL=$NEXT_PUBLIC_PROXY_URL

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Copy public directory (ensured to exist in builder stage)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]

