FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci

FROM deps AS client-build
COPY client ./client
RUN npm run build -w client

FROM deps AS server-build
COPY server ./server
RUN npm run prisma:generate -w server
RUN npm run build -w server

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:../data/mealplanner.db"

COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/server/package.json ./package.json
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/prisma ./prisma
COPY --from=client-build /app/client/dist ./public

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
