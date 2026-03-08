# === Stage 1: Build ===
FROM node:23-alpine AS builder

WORKDIR /app

ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT_REVIEW_UI
ARG COMMIT_SHA=unknown
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT_REVIEW_UI=$SENTRY_PROJECT_REVIEW_UI
ENV COMMIT_SHA=$COMMIT_SHA

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first (caching optimization)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy .env.production (optional, but useful for local testing)
COPY .env ./

#copy source files
COPY . .

RUN pnpm build

# === Stage 2: Nginx Static Server ===
FROM nginx:stable-alpine AS production

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy runtime .env (if needed for SSR or dynamic config)
COPY --from=builder /app/.env /usr/share/nginx/html/.env

# Optional: Replace the default nginx config (helps with SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]