# Base image for Node.js
FROM node:20-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    sqlite3 \
    libsqlite3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Frontend Dev Stage ---
FROM base AS frontend-dev

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies including native ones
RUN npm install

# Copy source
COPY frontend/ ./

# Expose Vite port
EXPOSE 5174

# Command for development
CMD ["npm", "run", "dev", "--", "--host"]

# --- Optional Web Build Stage (For cloud preview, not Electron) ---
FROM frontend-dev AS build
RUN npm run build
