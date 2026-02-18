# Claudy Admin Portal

A lightweight admin console + API for managing content and sending data to the mobile apps. Built as two services:

- `api`: Express + TypeScript for content and notification endpoints
- `web`: React + Vite + TypeScript admin UI that talks to the API

## Quick start (Docker)

```bash
docker-compose up --build
```

Services:
- Web UI: http://localhost:5173 (preview) or http://localhost:4173 (production preview)
- API: http://localhost:4000

## Environment

- `API_PORT` (default 4000)
- `API_HOST` (default 0.0.0.0)
- `WEB_PORT` (default 5173)
- `VITE_API_URL` (default http://localhost:4000)

## Local (without Docker)

```bash
cd api && npm install && npm run dev
cd ../web && npm install && npm run dev -- --host
```

## Deploy

- Build images: `docker-compose build`
- Push to registry, then `docker stack deploy` or run compose on your target server.

## Data flow

- Admin UI posts JSON to `/v1/content` on the API
- API stores in-memory (replace with DB later) and exposes GET `/v1/content`
- Mobile app can consume these endpoints directly or via your existing backend gateway.


