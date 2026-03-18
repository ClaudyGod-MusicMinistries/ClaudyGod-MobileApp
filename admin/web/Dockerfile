FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ARG VITE_API_URL
ARG VITE_GOOGLE_LOGIN_URL=
ARG VITE_MOBILE_PREVIEW_URL=

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_LOGIN_URL=${VITE_GOOGLE_LOGIN_URL}
ENV VITE_MOBILE_PREVIEW_URL=${VITE_MOBILE_PREVIEW_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
