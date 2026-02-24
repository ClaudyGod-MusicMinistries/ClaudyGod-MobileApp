FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install || true
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --omit=dev || true
ENV VITE_API_URL=http://localhost:4000
ENV WEB_PORT=4173
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
