# ── BUILD STAGE ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency configs
COPY backend/package*.json ./backend/

# Install dependencies (including devDependencies for validations/lints)
WORKDIR /usr/src/app/backend
RUN npm ci

# Copy application files
WORKDIR /usr/src/app
COPY backend ./backend
COPY frontend ./frontend

# ── RUN STAGE ────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Copy node modules and files from builder
COPY --from=builder /usr/src/app/backend/node_modules ./backend/node_modules
COPY --from=builder /usr/src/app/backend ./backend
COPY --from=builder /usr/src/app/frontend ./frontend

# Expose server port
EXPOSE 5000

WORKDIR /usr/src/app/backend

# Run environment configurations checks and boot server
CMD ["node", "server.js"]
