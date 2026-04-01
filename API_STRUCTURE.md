# ClaudyGod API Structure & Architecture

## Overview
The ClaudyGod API is a Node.js/Express backend serving the mobile app and admin web interface. It follows a modular architecture with clear separation of concerns.

## Directory Structure

```
services/api/src/
├── app.ts                 # Express app factory with middleware setup
├── index.ts              # Server bootstrap and process management
├── config/               # Environment and configuration
│   └── env.ts           # Environment variable validation & schema
├── controllers/          # Request handlers (if used)
├── database/            # Database initialization
├── db/                  # Database utilities & migrations
│   ├── pool.ts         # PostgreSQL connection pool
│   └── seedAdmin.ts    # Admin user seeding
├── lib/                 # Shared utilities
│   ├── asyncHandler.ts # Async error wrapper for express handlers
│   ├── httpError.ts    # Custom HTTP error class
│   ├── logger.ts       # Structured logging
│   ├── validation.ts   # Schema validation utilities
│   └── waitForInfrastructure.ts # Service dependency checking
├── middleware/          # Express middleware
│   ├── authenticate.ts    # JWT/session auth middleware
│   ├── errorHandler.ts    # Global error handler
│   ├── notFoundHandler.ts # 404 handler
│   ├── rateLimiter.ts     # Rate limiting
│   ├── requestTracking.ts # Request ID & logging
│   └── validation.ts      # Request validation
├── modules/             # Feature modules (organized by domain)
│   ├── auth/           # Authentication & session management
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── authSession.service.ts
│   │   ├── authIdentity.service.ts
│   │   ├── authSessionCookie.ts
│   │   ├── authPassword.service.ts
│   │   └── email verification/password reset logic
│   ├── me/             # User profile & preferences
│   │   ├── me.routes.ts
│   │   ├── me.service.ts
│   │   └── me.schema.ts
│   ├── content/        # Content management (audio, video, etc)
│   ├── live/           # Live streaming sessions
│   ├── mobile/         # Mobile-specific endpoints
│   ├── admin/          # Admin panel endpoints
│   ├── analytics/      # Analytics & tracking
│   ├── uploads/        # File upload handling
│   ├── youtube/        # YouTube integration
│   ├── wordOfDay/      # Daily word content
│   ├── appConfig/      # App configuration
│   └── ai/             # AI features
├── middleware/          # Middleware functions
├── queues/             # Background job processing
│   └── contentQueue.ts # Content processing queue
├── services/           # Domain services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── worker.ts           # Worker process (bg jobs)
```

## Authentication Flow

### Mobile App Authentication
1. **Sign In**: POST `/v1/auth/mobile/sign-in` → Returns `accessToken`, `refreshToken`, `user`
2. **Token Storage**: Mobile app stores session in secure async storage using key: `claudygod.mobile-auth-session.v1`
3. **API Requests**: Include `Authorization: Bearer {accessToken}` header
4. **Token Refresh**: When 401 received, POST `/v1/auth/refresh` with `refreshToken`
5. **Session Restoration**: App calls `authSessionStorage.restoreSession()` to get stored tokens

### Session Storage Format (Mobile)
```json
{
  "claudygod.mobile-auth-session.v1": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "CLIENT",
      "createdAt": "2024-01-01T00:00:00Z",
      "emailVerifiedAt": "2024-01-02T00:00:00Z"
    }
  }
}
```

### Backend Auth Middleware
- Location: `middleware/authenticate.ts`
- Extracts token from `Authorization: Bearer {token}` header
- Falls back to refresh token from cookies if needed
- Validates JWT and resolves authenticated user
- Applies to all protected routes (routes under `/v1/me`, `/v1/live`, `/v1/content`, etc)

## Key API Endpoints

### Auth Routes (`/v1/auth`)
```
POST   /sign-in              # Email/password login
POST   /sign-up              # Create new account
POST   /refresh              # Refresh access token
POST   /forgot-password      # Initiate password reset
POST   /reset-password       # Complete password reset
POST   /verify-email         # Verify email address
GET    /session              # Get current session status
POST   /logout               # Logout (clears cookies)
POST   /google/start         # Google OAuth flow
GET    /google/callback      # Google OAuth callback
```

### User Profile Routes (`/v1/me`) - ALL REQUIRE AUTH
```
GET    /bootstrap            # Get full user data on app launch
GET    /profile              # Get user profile
PATCH  /profile              # Update profile
GET    /preferences          # Get user preferences
PATCH  /preferences          # Update preferences
GET    /metrics              # Get engagement metrics
GET    /library              # Get saved items
POST   /library/items        # Save item to library
DELETE /library/items        # Remove from library
POST   /engagement/play-events   # Track play events
POST   /engagement/live-subscriptions # Subscribe to live
POST   /devices/push-token   # Register push notification token
DELETE /devices/push-token   # Remove push token
GET    /privacy              # Get privacy settings
POST   /privacy/export-request   # Export user data
POST   /privacy/reset-history    # Clear play history
```

### Content Routes (`/v1/content`) - MOSTLY PUBLIC
```
GET    /                     # List all content
GET    /:id                  # Get content details
GET    /feed                 # Personalized feed
GET    /search               # Search content
```

### Live Routes (`/v1/live`) - SOME REQUIRE AUTH
```
GET    /sessions             # List active live sessions
GET    /sessions/:id         # Get live session details
POST   /sessions/:id/messages # Send live chat message
```

### Mobile Routes (`/v1/mobile`)
```
GET    /app/config           # Get app configuration
GET    /word-of-day          # Get daily word
GET    /feed                 # Get personalized mobile feed
```

## Error Handling

### Standard Error Response
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limited)
- **500**: Server Error
- **503**: Service Unavailable

## Key Services

### Authentication Service (`modules/auth/authSession.service.ts`)
- `refreshAuthSession(refreshToken, metadata)` - Refresh access token
- `createAuthSession(user, metadata)` - Create new session

### User Service (`modules/me/me.service.ts`)
- `getMeProfile(user)` - Get user profile
- `updateMeProfile(user, payload)` - Update profile
- `getMeLibrary(user)` - Get saved items
- `trackPlayEvent(user, event)` - Record play event

### Content Service (`modules/content/`)
- `getContentFeed(user)` - Get personalized feed
- `getContent(contentId)` - Get single content
- `searchContent(query)` - Search content

## Database

### Connection Pool
- Location: `db/pool.ts`
- Uses PostgreSQL
- Configured via `DATABASE_URL`
- Connection pooling for performance
- SSL support for production

### Key Tables
- `users` - User accounts & authentication
- `sessions` - Active user sessions (with refresh tokens)
- `content` - Audio, video, announcements
- `user_library` - Saved items by user
- `play_events` - Track user engagement
- `live_sessions` - Live streaming events

## Queue Processing

### Background Jobs (`queues/contentQueue.ts`)
- Content processing & transcoding
- Thumbnail generation
- Analytics aggregation
- Email sending

## Environment Variables

### Critical (Required)
```
API_HOST=0.0.0.0
API_PORT=4000
DATABASE_URL=postgresql://...  # Supabase PostgreSQL
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=<long-random-string>
JWT_ACCESS_TTL=1d
```

### Authentication
```
MOBILE_API_KEY=<generated-key>
AUTH_PUBLIC_BASE_URL=https://admin.claudygod.org
AUTH_REQUIRE_EMAIL_VERIFICATION=true
AUTH_VERIFICATION_TOKEN_TTL_MINUTES=1440
AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES=30
```

### CORS & Security
```
CORS_ORIGIN=https://admin.claudygod.org,https://app.claudygod.org
```

## Development Workflow

### Starting the API
```bash
cd services/api
npm install
npm run dev  # Watch mode with hot reload
```

### Database Migrations
```bash
npm run migrate        # Apply migrations
npm run migrate:down   # Rollback
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Performance Considerations

1. **Database Indexing**: Key fields indexed (user_id, content_id, created_at)
2. **Response Caching**: Content feed cached for 5 minutes
3. **Rate Limiting**: 100 requests/minute per IP
4. **Pagination**: Default 20 items, max 100
5. **Connection Pooling**: Min 10, Max 20 connections

## Security Best Practices

1. **JWT Tokens**: Signed with RS256, expires in 1 day
2. **Refresh Tokens**: Stored in secure HTTP-only cookies
3. **Password Hashing**: bcrypt with 12 rounds
4. **HTTPS Only**: Enforced in production
5. **CORS**: Whitelist specific origins
6. **Rate Limiting**: Prevents abuse
7. **Input Validation**: Zod schemas on all inputs
8. **SQL Injection**: Parameterized queries (pg library)

## Monitoring & Logging

### Logger Setup (`lib/logger.ts`)
- Structured JSON logging
- Request ID tracking
- Performance metrics

### Key Metrics
- Request/response times
- Error rates
- Database query times
- Queue job status

## Deployment

### Production Checklist
- [ ] All env vars set correctly
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Redis instance running
- [ ] Rate limiting configured
- [ ] Error monitoring enabled
- [ ] Backup strategy in place
- [ ] API documentation updated

## Next Steps for Improvement

1. **API Documentation**: Generate OpenAPI/Swagger docs
2. **Rate Limiting**: Implement per-user limits
3. **Caching**: Add Redis caching layer
4. **Analytics**: Enhanced analytics endpoints
5. **Webhooks**: Webhook support for integrations
6. **GraphQL**: Consider GraphQL layer for mobile
7. **API Versioning**: Implement v2 with breaking changes
