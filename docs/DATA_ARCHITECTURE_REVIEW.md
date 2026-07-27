# Data Architecture Review

## Release Boundary

The current private release does not require an end-user account. This is a product boundary, not a guest-mode architecture. User-owned state is device-local until the authenticated release is enabled. Admin authentication remains server-owned.

The future account release must synchronize the device-local state through `UserAccountContext`; it must not introduce a second UI-facing favorites or history store.

## Sources Of Truth

| Data | Current owner | Cache or persistence | Future account owner |
| --- | --- | --- | --- |
| Published content and layouts | Claudy API | TanStack Query `['feed']` cache | Claudy API |
| Favorites | `LocalContentProvider` | AsyncStorage | `/v1/me/library`, synchronized through the provider |
| Playback history | `LocalContentProvider` | AsyncStorage | `/v1/me/engagement`, synchronized through the provider |
| Downloads | `DownloadsProvider` | App document storage plus AsyncStorage metadata | Device remains authoritative for file availability |
| Playback | `PlayerProvider` | In-memory player state | Same, with server analytics as an event sink |
| Experience configuration | Claudy API | Query cache and service fallback | Claudy API |
| Admin content and settings | Claudy API/PostgreSQL | Admin query cache | Claudy API/PostgreSQL |

## Enforced Contracts

- Feed requests share one query key and one in-flight request.
- Device history is composed reactively over server history and de-duplicated by content ID.
- Local mutations are serialized to prevent lost AsyncStorage updates.
- Favorites and history have explicit caps of 200 and 100 items.
- Downloads persist full display metadata and verify the file exists during hydration.
- A download cannot start twice for the same content, and a missing native result is a failure.
- Library writes are atomic PostgreSQL upserts and return stored metadata on reads.
- Authenticated library writes ensure the user scaffold exists before foreign-key insertion.
- Camera, gallery, and audio picker failures return to a stable UI state with user feedback.

## Authentication Migration Rule

When end-user authentication is enabled:

1. Hydrate the authenticated bootstrap before exposing account-backed screens.
2. Synchronize local favorites and history once using idempotent server operations.
3. Keep device downloads local; only synchronize their content references if required.
4. Merge by content ID and server timestamp, never by array position.
5. Mark migration complete only after every required write succeeds.
6. Continue to render through the existing providers so screens do not care where data is stored.

## Operational Checks

The codebase can verify schemas, types, lint, unit tests, and API integration tests locally. Production readiness still requires environment-backed checks for PostgreSQL migration status, object storage permissions and CORS, Redis connectivity, push credentials, and physical-device camera, playback, background audio, and download behavior.

Database migrations must be run as a deployment step before API rollout. A successful TypeScript build does not prove the target database has the required indexes or columns.
