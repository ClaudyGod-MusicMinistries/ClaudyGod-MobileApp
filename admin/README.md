# Claudy Admin Portal

Admin UI workspace (kept separate from mobile app code).

Backend logic is now split into the root `services/` folder so you can keep admin UI and API as separate repos if needed:

- `admin/` -> admin portal (web, compose, docs)
- `services/api/` -> backend API + worker (Express + TypeScript)
- `apps/mobile/` -> mobile app

## Quick start (Docker)

```bash
cd admin
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
cd ../services/api && npm install && npm run dev
cd ../../admin/web && npm install && npm run dev -- --host
```

## Deploy

- Build images: `docker-compose build`
- Push to registry, then `docker stack deploy` or run compose on your target server.

## Data flow

- Admin UI posts JSON to `/v1/content` on the API
- API stores data in Postgres and exposes `/v1/*` endpoints
- Mobile app consumes these endpoints directly (or via your gateway)

