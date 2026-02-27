# Claudy Admin API

Node.js + TypeScript backend for the Claudy admin portal and mobile app content feed.

## Features
- JWT auth for admin dashboard and mobile users
- Email verification + password recovery endpoints
- Content management endpoints (`/v1/content`)
- Redis + BullMQ workers (content + email)
- Email notification queue
- Supabase signed upload URL endpoints (admin + mobile)
- YouTube integration endpoints (preview + sync + mobile feed videos)
- PostgreSQL migrations and admin seed script

## Key Endpoints
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `GET /v1/auth/me`
- `POST /v1/auth/email/verify`
- `POST /v1/auth/email/verify/request`
- `POST /v1/auth/password/forgot`
- `POST /v1/auth/password/reset`
- `GET /v1/content/manage`
- `POST /v1/content`
- `PATCH /v1/content/:id/visibility`
- `GET /v1/youtube/videos` (admin auth)
- `POST /v1/youtube/sync` (admin auth)
- `GET /v1/mobile/content`
- `GET /v1/mobile/youtube/videos`
- `POST /v1/mobile/uploads/signed-url` (requires `x-mobile-api-key`)

## Environment
Set these in `.env` (do not commit secrets):
- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `YOUTUBE_MAX_RESULTS`
- `AUTH_REQUIRE_EMAIL_VERIFICATION`
- `AUTH_PUBLIC_BASE_URL`
- `AUTH_VERIFY_EMAIL_PATH`
- `AUTH_RESET_PASSWORD_PATH`
- `AUTH_VERIFICATION_TOKEN_TTL_MINUTES`
- `AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES`

## Quick start
1. Copy `.env.example` to `.env`
2. `npm install`
3. `npm run migrate`
4. `npm run seed:admin`
5. `npm run dev`
6. `npm run dev:worker`
