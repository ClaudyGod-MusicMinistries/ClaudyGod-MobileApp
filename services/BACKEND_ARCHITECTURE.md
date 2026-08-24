# Backend Architecture

## Runtime Topology

The backend has two independently deployed processes:

- `api`: Express HTTP and WebSocket server.
- `worker`: BullMQ consumers for content, email, statistics, and trending jobs.

PostgreSQL is the durable source of truth. Redis is queue and cache infrastructure. Supabase S3-compatible storage owns uploaded media objects. The API does not run schema migrations during startup; migrations are an explicit deployment gate.

## Code Boundaries

| Layer | Responsibility |
| --- | --- |
| `config/` | Validated runtime configuration and provider settings |
| `db/` | PostgreSQL pool, migration runner, and migration status |
| `infra/` | External transports: email, Redis, S3, Supabase, push, WebSocket |
| `middleware/` | Authentication, authorization, rate limits, request identity, errors |
| `modules/<domain>/` | Domain schemas, routes, services, and types |
| `queues/` | Queue producers and worker processors |
| `lib/` | Shared technical primitives without domain ownership |

Routes validate untrusted input with Zod and delegate domain behavior to services. Services own SQL and external side effects. Cross-domain imports are permitted only for explicit application use cases; shared database tables do not justify bypassing a domain service.

## Enforced Decisions

- Production API configuration fails fast for weak signing, encryption, and metrics secrets. Database commands validate only database settings.
- SQL values are parameterized; dynamic identifiers must come from closed server-owned sets.
- Multi-table security changes use transactions. Device revocation atomically revokes associated refresh sessions.
- Missing migrations and database outages are errors, not valid empty analytics.
- Library writes use atomic upserts and ensure the authenticated user scaffold exists.
- Queue work is drained during graceful process shutdown.
- Legacy repositories targeting nonexistent `users`, `content`, and `notifications` tables were removed. The canonical tables are defined by `db/migrate.ts` and used by domain services.
- The unused legacy email service was removed. `infra/email.ts` and `infra/transactionalEmails.ts` are the canonical email boundary.

## Service Decomposition Rule

Large domain services should be split only along stable capabilities while preserving route contracts. Target capabilities include:

- `auth`: registration, authentication, recovery, and account lifecycle.
- `content`: commands, queries, moderation workflow, and publication jobs.
- `admin`: dashboard queries, user administration, operational health, and audit reporting.
- `me`: profile, preferences, library, privacy, engagement, and support.

Do not introduce generic CRUD repositories. Domain SQL contains authorization, lifecycle, and projection rules that generic repositories obscure.

## Deployment Gates

Before production rollout:

1. Run `yarn migrate` against the target PostgreSQL instance.
2. Run `yarn migrate:status` and require a clean result.
3. Verify Redis and all five queues from both API and worker networks.
4. Verify S3 write, confirm, read, delete, size limits, MIME policy, and CORS.
5. Verify SMTP delivery, bounce handling, and password-reset links.
6. Verify metrics authentication and observability exporters.
7. Exercise graceful shutdown while HTTP requests and queue jobs are active.

## Verification Policy

Tests are organized around stable contracts rather than file-count targets. TypeScript, strict lint, builds, architecture contracts, deployment contracts, API contract tests, and database integration tests are release gates. Tests should be removed only when their behavior is obsolete or covered at a stronger boundary.
