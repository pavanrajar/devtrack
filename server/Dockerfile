FROM node:22-alpine AS build

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /app/server/dist ./dist
COPY --chown=node:node database/migrations /app/database/migrations

USER node

EXPOSE 5000

CMD ["sh", "-c", "node dist/scripts/migrate.js && node dist/server.js"]
