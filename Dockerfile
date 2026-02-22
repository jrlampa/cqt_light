# Base image for Node.js
FROM node:20-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Frontend build/dev stage
FROM base AS frontend-dev

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY frontend/ ./

# Expose Vite port
EXPOSE 5174

# Command for development
CMD ["npm", "run", "dev", "--", "--host"]
