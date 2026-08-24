# ClaudyGod Product Architecture

## Repository model

This repository contains three independently deployable products and one orchestration layer:

| Boundary | Location | Responsibility | Durable state |
| --- | --- | --- | --- |
| Mobile application | `apps/mobile` | Native/web customer experience | PostgreSQL through API; device files and bounded local preferences |
| Admin Studio | `admin/web` | Operational and editorial workflows | PostgreSQL through API gateways; Pinia is view state only |
| Claudy API | `services/api` | Authentication, domain rules, persistence, queues, integrations | PostgreSQL is authoritative; Redis is ephemeral infrastructure |
| Operations | repository root, `ops`, `scripts` | Builds, deployment, recovery, observability | No product runtime state |

Each deployable product owns its package manifest and lockfile. The root package only orchestrates commands. Nested wrapper projects and alternate Compose topologies are prohibited.

## Backend dependency direction

```text
HTTP routes -> domain services -> db/infra
                         |          |
                         +-> queues +-> external providers

process entry points -> lifecycle and graceful shutdown
config -> validated process-specific environment
```

- Routes authenticate, authorize, validate, and translate HTTP. They do not invent persistence policy.
- Domain services own SQL transactions and business invariants. Generic CRUD repositories are intentionally avoided.
- `db` owns connection and migration mechanics. A migration receives database configuration only.
- `infra` owns provider clients and shared connection policies. Queue modules never reconstruct Redis options.
- Shared libraries do not register signals or terminate the process. Entry points own lifecycle.

## Persistence rules

1. PostgreSQL is the source of truth for accounts, content, configuration, engagement, jobs, and administrative state.
2. Redis data must be reconstructable. It may contain queues, rate-limit counters, caches, and live-session coordination only.
3. Object storage contains media bytes; PostgreSQL contains ownership, lifecycle, security status, and canonical metadata.
4. Device storage owns downloaded-file availability and pre-authenticated local preferences. Server-backed state must reconcile through one provider, not parallel contexts.
5. Multi-record invariants use transactions. Asynchronous side effects use durable outbox rows before queue publication.
6. Migrations are immutable, checksummed, serialized with a PostgreSQL advisory lock, and run before application rollout.

## Client boundaries

- Mobile screens use domain services; all HTTP passes through `services/apiClient.ts`.
- Mobile runtime configuration has one owner: `services/config.ts`.
- Admin views use stores, stores use typed API modules, and API modules use `api/client.ts`.
- Public-client identifiers are never treated as secrets or authentication credentials.

## Architecture gate

Run `yarn contracts:check` or `make review`. The gate prevents legacy wrapper projects, unpinned container installs, duplicated BullMQ connection policy, and process lifecycle ownership inside shared logging code from returning.
