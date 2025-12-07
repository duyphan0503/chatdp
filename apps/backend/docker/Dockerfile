# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11.6.4 && npm i -g pnpm@10.20.0 && pnpm i --frozen-lockfile || true
COPY . .
RUN npx nest build || true
 
FROM node:22-alpine
WORKDIR /app
COPY --from=base /app/package*.json ./
COPY --from=base /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]

