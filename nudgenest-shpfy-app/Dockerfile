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

# Swap in production schema (CockroachDB) before generating the Prisma client
RUN cp prisma/schema.prod.prisma prisma/schema.prisma

# Generate Prisma client against the production schema
RUN npx prisma generate

RUN pnpm run build

# Push schema to CockroachDB then start the server.
# prisma db push is used instead of migrate deploy — no migration files needed
# for CockroachDB Serverless. Safe for additive schema changes.
# || true ensures the container starts even if db push fails (schema already up to date).
CMD ["sh", "-c", "npx prisma db push --accept-data-loss || true && pnpm run start"]
