FROM node:22-alpine

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy shared TypeScript source — makes @nudgenest/shared paths alias resolve in Docker
# (tsconfig.json: "paths": { "@nudgenest/shared": ["../packages/shared/src"] })
# From WORKDIR /app, ../packages/shared/src resolves to /packages/shared/src
COPY packages/shared/src /packages/shared/src

# Install all deps (including dev) — needed for prisma generate + vite build
COPY nudgenest-shpfy-app/package.json nudgenest-shpfy-app/pnpm-lock.yaml nudgenest-shpfy-app/.npmrc ./
RUN pnpm install --frozen-lockfile

# Copy service source (node_modules and build excluded via root .dockerignore)
COPY nudgenest-shpfy-app/ .

# Swap in production schema (CockroachDB) and CockroachDB-compatible migrations
RUN cp prisma/schema.prod.prisma prisma/schema.prisma && \
    rm -rf prisma/migrations && \
    cp -r prisma/migrations-cockroach prisma/migrations

# Generate Prisma client against the production schema
RUN npx prisma generate

RUN pnpm run build

# Apply pending migrations to CockroachDB then start the server.
# prisma migrate deploy applies pre-written SQL files — no schema diff, so it
# never tries to touch CockroachDB's internal crdb_internal_region system enum.
# Idempotent: tracks applied migrations in _prisma_migrations table.
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm run start"]
