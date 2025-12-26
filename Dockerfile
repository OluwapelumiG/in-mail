# Build stage
FROM golang:1.22-bullseye AS builder

WORKDIR /app

# Install build dependencies (including C compiler and SQLite for CGO)
RUN apt-get update && apt-get install -y -q \
    git \
    gcc \
    libc6-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application with CGO enabled (required for SQLite)
RUN CGO_ENABLED=1 GOOS=linux go build -a -o inmail ./cmd/server

# Runtime stage
FROM debian:bullseye-slim

# Install SQLite runtime library (required for CGO SQLite driver), ca-certificates, and netcat for healthcheck
RUN apt-get update && apt-get install -y -q \
    ca-certificates \
    tzdata \
    libsqlite3-0 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/

# Create data directory for SQLite
RUN mkdir -p /root/data

# Copy binary from builder
COPY --from=builder /app/inmail .

# Create non-root user
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -s /bin/bash appuser && \
    chown -R appuser:appuser /root

USER appuser

EXPOSE 1025 8080

CMD ["./inmail"]

