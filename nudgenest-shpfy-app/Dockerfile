FROM node:22-alpine

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml .npmrc ./

# Install all deps (including dev) — needed for prisma generate + vite build
RUN pnpm install --frozen-lockfile

COPY . .

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
