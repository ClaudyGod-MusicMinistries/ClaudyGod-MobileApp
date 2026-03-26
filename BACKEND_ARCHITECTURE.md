# Backend Architecture Documentation

## Overview

The ClaudyGod backend is built on a **modular, scalable architecture** using Express.js with TypeScript. All configuration is environment-driven with zero hardcoded values, following cloud-native principles.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Client Applications                 │
│              (Web, Mobile, Desktop)                  │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────┐
│              API Gateway / Proxy                     │
│          (Traefik / Load Balancer)                   │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           Express.js Application Server             │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          Request Pipeline                    │  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │ 1. Request Parser (JSON, URL-encoded)    │ │  │
│  │ ├──────────────────────────────────────────┤ │  │
│  │ │ 2. Authentication Middleware             │ │  │
│  │ ├──────────────────────────────────────────┤ │  │
│  │ │ 3. Rate Limiter Middleware               │ │  │
│  │ ├──────────────────────────────────────────┤ │  │
│  │ │ 4. Validation Middleware                 │ │  │
│  │ ├──────────────────────────────────────────┤ │  │
│  │ │ 5. Route Handler / Controller            │ │  │
│  │ ├──────────────────────────────────────────┤ │  │
│  │ │ 6. Error Handler                         │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │       Service Layer & Business Logic         │  │
│  │  (Auth, User, Content, Notifications)        │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │       Data Access Layer (Repository)         │  │
│  │  (Database Queries, ORM, Cache)              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   (PostgrSQL)   (Redis)      (Email)
   (Database)    (Cache)      (Postfix)
```

## Directory Structure

```
services/api/
├── src/
│   ├── config/              # Configuration management
│   │   ├── emailConfig.ts   # Email SMTP configuration
│   │   ├── database.ts      # Database connection config
│   │   └── env.ts           # Environment variables schema
│   │
│   ├── lib/                 # Utility libraries
│   │   ├── logger.ts        # Winston logging service
│   │   ├── emailValidator.ts # Email domain validation
│   │   ├── authValidation.ts # Auth data validation
│   │   └── errorHandler.ts   # Error classification & handling
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── rateLimiter.ts   # Rate limiting rules
│   │   ├── validation.ts    # Input validation middleware
│   │   └── errorMiddleware.ts # Error response handler
│   │
│   ├── services/            # Business logic
│   │   ├── emailService.ts  # Email sending operations
│   │   ├── authService.ts   # User authentication
│   │   ├── userService.ts   # User management
│   │   ├── contentService.ts # Content management
│   │   └── notificationService.ts
│   │
│   ├── database/            # Data access layer
│   │   ├── models/          # TypeORM entities
│   │   │   ├── User.ts
│   │   │   ├── Content.ts
│   │   │   └── Notification.ts
│   │   └── repositories/    # Query abstraction
│   │       ├── userRepository.ts
│   │       └── contentRepository.ts
│   │
│   ├── routes/              # API endpoints
│   │   ├── auth.ts          # /api/auth
│   │   ├── users.ts         # /api/users
│   │   ├── content.ts       # /api/content
│   │   └── health.ts        # /api/health
│   │
│   ├── controllers/         # Request handlers
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   └── ContentController.ts
│   │
│   ├── types/               # TypeScript interfaces
│   │   ├── User.ts
│   │   ├── Content.ts
│   │   └── API.ts
│   │
│   └── app.ts              # Express app setup
│
├── .env.example            # Environment variables template
├── package.json
├── tsconfig.json
└── Dockerfile              # Container image definition
```

## Core Modules

### 1. Configuration Module (`config/`)

**Purpose**: Centralize all configuration with environment-driven setup.

**Key Files**:
- `emailConfig.ts` - SMTP settings, email templates, sender info
- `database.ts` - Database connection details, pool settings
- `env.ts` - Environment variable schema with validation

**Pattern**: No hardcoded values, all read from environment variables.

```typescript
// Example: SMTP configuration loaded from environment
const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST,      // e.g., "mail.server.com"
    port: process.env.SMTP_PORT,      // e.g., 587
    secure: process.env.SMTP_SECURE,  // e.g., "true"
    auth: {
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
  },
};
```

### 2. Middleware Layer (`middleware/`)

**Auth Middleware** (`auth.ts`)
- Validates JWT tokens
- Attaches user context to requests
- Handles token refresh logic
- Rate limiting specific to user

**Rate Limiter** (`rateLimiter.ts`)
- API endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Password reset: 3 requests per hour
- Email verification: 5 requests per hour

**Validation Middleware** (`validation.ts`)
- Applies schema validation to all inputs
- Prevents SQL injection, XSS, etc.
- Type-safe request data

### 3. Services Layer (`services/`)

**Email Service** (`emailService.ts`)
- Sends transactional emails
- Verification emails with tokens
- Password reset emails
- Welcome emails
- Uses Nodemailer + SMTP

**Auth Service** (`authService.ts`)
- User registration with email validation
- Email verification workflow
- Login with JWT token generation
- Password reset with token
- Session management

**User Service** (`userService.ts`)
- User profile management
- Profile updates
- Avatar/media upload
- User search and filtering

**Content Service** (`contentService.ts`)
- Content CRUD operations
- Publishing workflow
- Versioning and drafts
- Content recommendations

### 4. Data Access Layer (`database/`)

**Models** (TypeORM Entities)
- User entity with authentication fields
- Content entity with metadata
- Notification entity for messaging
- Relationship definitions

**Repositories**
- Abstract database queries
- Implement business logic filters
- Handle transactions
- Cache management integration

### 5. API Routes (`routes/`)

**Authentication Routes** (`/api/auth`)
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/verify-email` - Confirm email
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Complete reset
- `POST /api/auth/logout` - End session

**User Routes** (`/api/users`)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `DELETE /api/users/:id` - Delete account
- `GET /api/users/:id/settings` - Get preferences

**Content Routes** (`/api/content`)
- `GET /api/content` - List content with filters
- `POST /api/content` - Create content
- `GET /api/content/:id` - Get single content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

## Key Design Patterns

### 1. Environment-Driven Configuration

**Principle**: Never hardcode values. Use environment variables for:
- Database credentials
- API keys and secrets
- Email configuration
- Feature flags
- Service URLs
- Debug settings

**Implementation**:
```bash
# .env file
SMTP_HOST=mail.example.com
SMTP_PORT=587
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
API_PORT=3000
NODE_ENV=production
```

### 2. Separation of Concerns

- **Controllers**: Handle HTTP request/response
- **Services**: Implement business logic
- **Repositories**: Handle data access
- **Middleware**: Cross-cutting concerns

### 3. Error Handling

**Centralized Error Handler**:
```typescript
// All errors are classified and returned with consistent format
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "statusCode": 401,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error Classification**:
- `VALIDATION_ERROR` (400) - Invalid input
- `AUTH_ERROR` (401) - Authentication failed
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource already exists
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

### 4. Input Validation

**Multi-Layer Validation**:
1. **Middleware Level**: Schema validation for all requests
2. **Service Level**: Business rule validation
3. **Database Level**: Unique constraints, foreign keys

**Implementation**:
```typescript
// Email validation with domain checking
const emailValidation = authValidator.validateEmail(email);
if (!emailValidation.isValid) {
  return res.status(400).json({
    errors: emailValidation.errors
  });
}
```

### 5. Email System Architecture

**Components**:
- **Email Validator** - Domain/postfix checking, disposable detection
- **Email Service** - SMTP integration, template rendering
- **Email Configuration** - Centralized SMTP, templates, addresses
- **Transactional Emails** - Verification, password reset, notifications

**No Hardcoding**:
- Email templates stored in database or environment
- SMTP credentials from environment
- Vendor info from configuration
- Support email addresses configurable

### 6. Authentication & Security

**JWT Token Strategy**:
- Access token: 15 minutes
- Refresh token: 7 days
- Stored securely (HTTP-only cookies)
- Validated on every protected route

**Password Security**:
- Minimum 12 characters
- Mixed case, numbers, special characters
- Bcrypt hashing (10 rounds)
- Never logged in plain text

**Rate Limiting**:
- Global: 1000 requests per hour
- Auth: 5 failed attempts per 15 minutes
- Email: 5 verification emails per hour per user

## Deployment Considerations

### Environment Variables Template

```bash
# Application
NODE_ENV=production
API_PORT=3000
APP_URL=https://claudygod.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/claudygod
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT
JWT_SECRET=your-super-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# SMTP / Email
SMTP_HOST=mail.server.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM_NAME=ClaudyGod
EMAIL_FROM_ADDRESS=noreply@claudygod.com
SUPPORT_EMAIL_NAME=ClaudyGod Support
SUPPORT_EMAIL_ADDRESS=support@claudygod.com

# Services
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
LOG_FILE=/var/log/claudygod/api.log

# Feature Flags
ENABLE_EMAIL_VERIFICATION=true
ENABLE_RATE_LIMITING=true
ENABLE_CORS=true
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3000
CMD ["npm", "start"]
```

### Scaling Strategy

**Horizontal Scaling**:
- Stateless application servers
- Shared database backend
- Redis session store
- Message queue for async jobs

**Vertical Scaling**:
- Database connection pooling
- Caching layer (Redis)
- Request batching
- Database query optimization

## Security Best Practices

1. **Environment Variables**: All secrets in .env, never in code
2. **HTTPS Only**: Force TLS in production
3. **CORS**: Restrict to known origins
4. **Rate Limiting**: Prevent brute force attacks
5. **SQL Injection Prevention**: Use parameterized queries
6. **XSS Protection**: Input validation and sanitization
7. **CSRF Protection**: Token-based CSRF defense
8. **Audit Logging**: All sensitive operations logged
9. **Data Encryption**: Passwords hashed, sensitive data encrypted
10. **Secret Rotation**: Regular key rotation procedures

## Monitoring & Logging

**Winston Logger Integration**:
- Structured logging with timestamps
- Multiple log levels (debug, info, warn, error)
- File and console transport
- Error stack traces
- Performance metrics

**Health Check Endpoint**:
```
GET /api/health

{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

## API Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "fields": {
      "email": ["Invalid email domain"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Testing Strategy

**Unit Tests**: Service and utility functions
**Integration Tests**: API endpoints with mock database
**E2E Tests**: Full user workflows
**Load Tests**: Performance under stress

## Future Enhancements

1. **Database Sharding**: For massive scale
2. **Event Sourcing**: For audit trail
3. **CQRS Pattern**: Separate read/write models
4. **GraphQL API**: Alternative to REST
5. **Webhook System**: External integrations
6. **Real-time Updates**: WebSocket connections
7. **Search Engine**: Elasticsearch integration
8. **Analytics**: Custom metrics and dashboards

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: Development Team
