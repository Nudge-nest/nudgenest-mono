FROM node:18-alpine

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force
# Remove CLI packages not needed in production
RUN npm remove @shopify/cli

COPY . .

# Swap in production schema (CockroachDB) before generating the Prisma client
RUN cp prisma/schema.prod.prisma prisma/schema.prisma

# Generate Prisma client against the production schema
RUN npx prisma generate

RUN npm run build

# Push schema to CockroachDB then start the server.
# prisma db push is used instead of migrate deploy — no migration files needed
# for CockroachDB Serverless. Safe for additive schema changes.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run start"]
