# ── Stage 1: build Vue / Vite ─────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --non-interactive
COPY . .

ARG VITE_API_URL
ARG VITE_GOOGLE_LOGIN_URL=
ARG VITE_MOBILE_PREVIEW_URL=

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_LOGIN_URL=${VITE_GOOGLE_LOGIN_URL}
ENV VITE_MOBILE_PREVIEW_URL=${VITE_MOBILE_PREVIEW_URL}

RUN yarn build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
