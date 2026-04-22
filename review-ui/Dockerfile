# === Stage 1: Build ===
FROM node:22-alpine AS builder

WORKDIR /app

ARG COMMIT_SHA=unknown
# VITE_APP_BACKEND_HOST is the name the Vite app reads at runtime via import.meta.env.
# Cloud Build passes it as --build-arg VITE_APP_BACKEND_HOST=$$VITE_APP_BACKEND_HOST_STAGING
# (staging) or $$VITE_APP_BACKEND_HOST_PROD (production) from Secret Manager.
# The _STAGING/_PROD suffix lives only in the CI/CD layer; the app layer always uses the
# unprefixed name so Vite env types and Redux API code stay environment-agnostic.
ARG VITE_APP_BACKEND_HOST
ARG VITE_APP_SENTRY_FE_DSN
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

# Write env vars from build args into .env.production — Vite gives .env.production
# higher priority than .env, so this ensures build-arg values always win.
RUN printf 'VITE_APP_BACKEND_HOST=%s\nVITE_APP_SENTRY_FE_DSN=%s\nVITE_COMMIT_SHA=%s\n' \
    "${VITE_APP_BACKEND_HOST}" \
    "${VITE_APP_SENTRY_FE_DSN}" \
    "${COMMIT_SHA}" \
    > .env.production && cp .env.production .env

RUN pnpm build

# === Stage 2: Nginx Static Server ===
FROM nginx:stable-alpine AS production

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy runtime .env for debugging (both files exist since we cp above)
COPY --from=builder /app/.env /usr/share/nginx/html/.env

# Replace the default nginx config (helps with SPA routing)
COPY review-ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
