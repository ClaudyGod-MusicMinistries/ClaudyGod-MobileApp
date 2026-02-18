FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --production=false || true
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=base /usr/src/app/dist ./dist
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --omit=dev || true
ENV API_PORT=4000
CMD ["node", "dist/index.js"]
EXPOSE 4000
