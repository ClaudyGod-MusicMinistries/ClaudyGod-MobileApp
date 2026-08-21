# Operations Runbook

## Administrator onboarding

Privileged self-registration is disabled. Create the first Super Admin once with the
`admin:bootstrap` command documented in `admin/README.md`. The command takes an
advisory database lock, refuses to run when an active Super Admin exists, never
promotes an existing account implicitly, and records the event in the security audit
log.

After bootstrap, every privileged account is created through an email-bound,
single-use invitation (`POST /v1/admin/invitations` →
`POST /v1/auth/invitations/accept`). Invitations are stored as hashes, expire after
`ADMIN_INVITE_TTL_HOURS`, and can be revoked. MFA enrollment is mandatory before the
new administrator can access privileged workflows. Only a Super Admin may grant or
remove Admin authority.

## Storage (S3-compatible) — admin media uploads

Admin image/audio/video uploads (`services/api/src/modules/admin/storage.service.ts`,
`storage.routes.ts`) go through a presigned-URL pipeline against **Supabase's
S3-compatible storage endpoint**, not raw AWS S3. The pipeline itself (request a
presigned PUT URL → client uploads directly to storage → confirm, which `headObject`s
the file to verify it landed) requires four env vars, all optional at the zod-schema
level but load-bearing at runtime:

- `SUPABASE_S3_ENDPOINT` — from Supabase dashboard → Settings → Storage → S3 Access.
  Format: `https://<project-ref>.storage.supabase.co/storage/v1/s3`.
- `SUPABASE_S3_REGION` — must match the region the Supabase project is hosted in.
- `SUPABASE_S3_ACCESS_KEY_ID` / `SUPABASE_S3_SECRET_ACCESS_KEY` — from the same
  dashboard page.
- `SUPABASE_STORAGE_BUCKET` — defaults to `mobile-uploads`; only needs to be set if
  using a different bucket name.

`env.S3_ENABLED` (`services/api/src/config/env.ts`) is `true` only when the endpoint,
access key, and secret are all non-empty. Every admin storage endpoint except session
listing calls `assertS3Configured()`, which 503s with `S3_NOT_CONFIGURED` the instant
`S3_ENABLED` is false — this is the exact error an admin sees as "S3 storage is not
configured on this server" when trying to upload.

**The most common way this breaks**: having real values in `.env.production` is not
enough by itself. `.dockerignore` excludes all `.env*` files from the build context, so
the running container only ever receives env vars that are explicitly passed through in
`docker-compose.production.yml`'s `x-backend-env` anchor (or `services/api/docker-compose.dev.yml`
for local Docker dev). If a new env var is added to `.env.production` without also
adding it to the compose file's environment block, the container never sees it —
exactly what happened with these four S3 vars until this was fixed. **Whenever you add
a new required env var, check both places.**

**Verifying it's actually wired up**: `GET /health` (and `GET /`) return a
`capabilities.s3` boolean (`services/api/src/modules/health/health.routes.ts`) reflecting
`env.S3_ENABLED` — check that before attempting a real upload, no admin-panel
trial-and-error needed. In production, `config/env.ts`'s startup validation also refuses
to boot if these vars are missing or still contain placeholder values (same treatment as
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`) — a misconfigured deploy fails loudly at
`docker compose up` rather than silently 503ing on the first upload attempt.

**The bucket itself is not created by any code path** — `SUPABASE_STORAGE_BUCKET`
(`infra/s3.ts`, `storage.service.ts`, `youtube.service.ts`) is just a name the app
assumes already exists. If it doesn't, the presigned PUT URL is still issued
successfully (env vars are fine, `S3_ENABLED` is true), but the browser's actual upload
to it 404s directly from Supabase's storage gateway. Before the first upload on a new
Supabase project, create a bucket in the dashboard (Storage → New bucket) with the exact
name in `SUPABASE_STORAGE_BUCKET` (default `mobile-uploads`), and mark it **Public** —
`buildPublicObjectUrl` (`infra/s3.ts`) constructs `/storage/v1/object/public/...` URLs to
serve uploaded media directly, which requires the bucket to be public rather than
gated behind signed reads.

**Also watch for AWS SDK default-checksum breakage**: `@aws-sdk/client-s3` versions from
around 3.729 onward attach a CRC32 integrity checksum to every request by default,
including presigned URLs — signed against an empty body since the real file isn't known
at presign time. The browser's later PUT of the actual bytes then fails signature
validation against S3-compatible gateways (Supabase, R2, MinIO) with a 401, even though
nothing is misconfigured. Fixed by setting `requestChecksumCalculation: 'WHEN_REQUIRED'`
and `responseChecksumValidation: 'WHEN_REQUIRED'` on the `S3Client` (`infra/s3.ts`) to
restore pre-default-checksum behavior — re-check this if the SDK is ever upgraded and
uploads start 401ing again with a valid, present configuration.

## Public mobile endpoints and authorization

The public catalog, feed, search, and donation-intent endpoints do not use an embedded
application secret. Secrets shipped in a mobile or web bundle are extractable and are
not an authentication boundary. Apply rate limiting and abuse monitoring to public
routes. Every route that reads or mutates account data must use `authenticate`, plus
the appropriate `hasMinRole`/`requireRole` check for privileged operations.
