# Services

Backend services are kept here so they can be deployed and versioned independently from the mobile app and admin UI.

Current service:

- `services/api` - Admin/content API + worker (Express + TypeScript + Postgres + Redis)

See [`BACKEND_ARCHITECTURE.md`](./BACKEND_ARCHITECTURE.md) for module boundaries, data ownership, and deployment gates.

Recommended repo split (if/when you separate repos):

- `apps/mobile` -> mobile app repo
- `admin` -> admin UI repo
- `services/api` -> backend API repo
