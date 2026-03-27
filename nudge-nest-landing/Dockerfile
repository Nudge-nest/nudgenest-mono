# === Stage 1: Build ===
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first (caching optimisation)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy .env (injected by Cloud Build before docker build)
COPY .env ./

# Copy source files
COPY . .

RUN pnpm build

# === Stage 2: Nginx Static Server ===
FROM nginx:stable-alpine AS production

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing + static asset caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
