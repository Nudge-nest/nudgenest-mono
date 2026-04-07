# === Stage 1: Build ===
FROM node:22-alpine AS builder

WORKDIR /app

ARG COMMIT_SHA=unknown
ENV COMMIT_SHA=$COMMIT_SHA

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy shared TypeScript source — makes @nudgenest/shared paths alias resolve in Docker
# (tsconfig.app.json: "paths": { "@nudgenest/shared": ["../packages/shared/src"] })
# From WORKDIR /app, ../packages/shared/src resolves to /packages/shared/src
COPY packages/shared/src /packages/shared/src

# Copy package files first (caching optimization)
COPY review-ui/package.json review-ui/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy service source (node_modules and dist excluded via root .dockerignore)
COPY review-ui/ .

RUN pnpm build

# === Stage 2: Nginx Static Server ===
FROM nginx:stable-alpine AS production

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy runtime .env (if needed for SSR or dynamic config)
COPY --from=builder /app/.env /usr/share/nginx/html/.env

# Replace the default nginx config (helps with SPA routing)
COPY review-ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
