FROM node:20-alpine

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml .npmrc ./

# Install all deps (including dev) — needed for prisma generate + vite build
RUN pnpm install --frozen-lockfile

COPY . .

# Swap in production schema (CockroachDB) before generating the Prisma client
RUN cp prisma/schema.prod.prisma prisma/schema.prisma

# Generate Prisma client against the production schema
RUN npx prisma generate

RUN pnpm run build

# Remove dev dependencies after build
RUN pnpm prune --prod

# Push schema to CockroachDB then start the server.
# prisma db push is used instead of migrate deploy — no migration files needed
# for CockroachDB Serverless. Safe for additive schema changes.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && pnpm run start"]
