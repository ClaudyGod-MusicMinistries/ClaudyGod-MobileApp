# 🔌 Professional API Endpoints Configuration

## API Base Configuration

```typescript
// Never hardcode - use environment variables!

// Production
API_BASE_URL=https://api.claudygod.com/v1
STREAMING_API_URL=https://stream.claudygod.com
WEBSOCKET_URL=wss://realtime.claudygod.com

// Staging
API_BASE_URL=https://staging-api.claudygod.com/v1
STREAMING_API_URL=https://staging-stream.claudygod.com
WEBSOCKET_URL=wss://staging-realtime.claudygod.com

// Development
API_BASE_URL=http://localhost:3000/v1
WEBSOCKET_URL=ws://localhost:3001
```

---

## 📊 Content Endpoints

### Get Content List
```http
GET /api/v1/content/list?category=worship&limit=20&offset=0

Query Parameters:
- category: 'worship' | 'gospel' | 'contemporary' | 'prayer' | 'teaching'
- limit: number (default: 20, max: 100)
- offset: number (for pagination)
- sortBy: 'trending' | 'recent' | 'popular' | 'plays'
- duration: 'short' | 'medium' | 'long' (optional)

Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "content_123",
        "title": "Sunday Morning Worship",
        "description": "...",
        "type": "audio", // 'audio' | 'video'
        "duration": 3600,
        "artist": "Wisdom Church",
        "artistId": "user_456",
        "thumbnail": "https://cdn.claudygod.com/thumbs/content_123.jpg",
        "coverUrl": "https://cdn.claudygod.com/covers/content_123.jpg",
        "plays": 15420,
        "likes": 342,
        "category": "worship",
        "isLive": false,
        "quality": ["128kbps", "192kbps", "320kbps"],
        "uploadedAt": "2026-03-20T10:30:00Z",
        "availableOffline": true,
        "isExclusive": false
      }
    ],
    "pagination": {
      "total": 5042,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "timestamp": "2026-03-30T14:25:00Z"
}
```

### Get Content Details
```http
GET /api/v1/content/:contentId

Response:
{
  "success": true,
  "data": {
    "id": "content_123",
    "title": "Sunday Morning Worship",
    "description": "Complete worship service from Sunday morning",
    "type": "audio",
    "duration": 3600,
    "artist": {
      "id": "user_456",
      "name": "Wisdom Church",
      "avatar": "https://cdn.claudygod.com/avatars/user_456.jpg",
      "followers": 54230,
      "verified": true,
      "bio": "Official Wisdom Church channel"
    },
    "metadata": {
      "album": "Weekly Worship Series",
      "year": 2026,
      "genre": "Worship",
      "language": "English",
      "tags": ["worship", "live", "service"]
    },
    "playback": {
      "streamUrl": "https://stream.claudygod.com/audio/content_123/stream",
      "downloadUrl": "https://stream.claudygod.com/audio/content_123/download",
      "qualities": {
        "128kbps": "https://stream.claudygod.com/audio/content_123/stream?quality=128",
        "192kbps": "https://stream.claudygod.com/audio/content_123/stream?quality=192",
        "320kbps": "https://stream.claudygod.com/audio/content_123/stream?quality=320"
      },
      "subtitles": ["https://cdn.claudygod.com/subs/content_123_en.vtt"],
      "lyrics": "https://cdn.claudygod.com/lyrics/content_123.json"
    },
    "stats": {
      "plays": 15420,
      "likes": 342,
      "shares": 128,
      "comments": 45,
      "views": 18920
    },
    "relatedContent": [
      { "id": "content_124", "title": "Evening Prayer", "type": "audio" }
    ],
    "userEngagement": {
      "isLiked": false,
      "isSaved": false,
      "isDownloaded": false,
      "lastPlayedAt": "2026-03-28T15:30:00Z",
      "playCount": 3
    }
  },
  "timestamp": "2026-03-30T14:25:00Z"
}
```

### Search Content
```http
GET /api/v1/content/search?q=worship&limit=20&offset=0

Query Parameters:
- q: search term (required, min 2 chars)
- type: 'audio' | 'video' | 'all'
- category: category filter
- sortBy: 'relevance' | 'plays' | 'recent'

Response:
{
  "success": true,
  "data": {
    "query": "worship",
    "results": [ ... ], // Same format as content list
    "facets": {
      "categories": [
        { "name": "Worship", "count": 342 },
        { "name": "Gospel", "count": 128 }
      ],
      "types": [
        { "name": "Audio", "count": 450 },
        { "name": "Video", "count": 120 }
      ]
    },
    "pagination": { ... }
  }
}
```

### Get Trending Content
```http
GET /api/v1/content/trending?limit=20&timeRange=week

Query Parameters:
- timeRange: 'day' | 'week' | 'month' | 'all'
- category: optional category filter

Response:
{
  "success": true,
  "data": {
    "trendingContent": [ ... ], // Same format as list
    "trendingCreators": [
      {
        "id": "user_123",
        "name": "Creator Name",
        "avatar": "...",
        "followerGrowth": 15,
        "contentGrowth": 8
      }
    ]
  }
}
```

---

## 👤 User Endpoints

### User Profile
```http
GET /api/v1/users/:userId

Response:
{
  "success": true,
  "data": {
    "id": "user_456",
    "username": "wisdomchurch",
    "email": "contact@wisdomchurch.com",
    "displayName": "Wisdom Church",
    "bio": "Official Wisdom Church channel",
    "avatar": "https://cdn.claudygod.com/avatars/user_456.jpg",
    "bannerUrl": "https://cdn.claudygod.com/banners/user_456.jpg",
    "followerCount": 54230,
    "followingCount": 342,
    "contentCount": 256,
    "totalPlays": 2845230,
    "verified": true,
    "isCreator": true,
    "creatorInfo": {
      "earnings": 4250.50,
      "subscribers": 42000,
      "totalStreams": 1245000,
      "joinedDate": "2024-01-15"
    },
    "social": {
      "youtube": "https://youtube.com/@wisdomchurch",
      "instagram": "@wisdomchurch",
      "website": "https://wisdomchurch.com"
    }
  }
}
```

### Update Profile
```http
PUT /api/v1/users/profile

Headers:
Authorization: Bearer {jwt_token}

Body:
{
  "displayName": "Wisdom Church Updated",
  "bio": "Official channel",
  "avatar": "base64_image_data",
  "social": {
    "youtube": "...",
    "instagram": "@wisdomchurch"
  }
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... updated user data ... }
}
```

### Get User Library
```http
GET /api/v1/users/library?type=saved&limit=20&offset=0

Query Parameters:
- type: 'saved' | 'downloaded' | 'history' | 'playlists'

Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "library_item_123",
        "contentId": "content_123",
        "title": "Saved Track",
        "type": "audio",
        "savedAt": "2026-03-25T10:30:00Z",
        "content": { ... full content object ... }
      }
    ],
    "pagination": { ... }
  }
}
```

### Get User History
```http
GET /api/v1/users/history?limit=50

Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "history_456",
        "contentId": "content_123",
        "title": "Sunday Worship",
        "artist": "Wisdom Church",
        "playedAt": "2026-03-30T14:00:00Z",
        "playDuration": 1800, // seconds watched
        "totalDuration": 3600,
        "completionPercentage": 50
      }
    ]
  }
}
```

---

## ▶️ Playback Endpoints

### Start Playback Session
```http
POST /api/v1/playback/start

Headers:
Authorization: Bearer {jwt_token}

Body:
{
  "contentId": "content_123",
  "quality": "192kbps", // optional, defaults to best available
  "deviceId": "device_uuid",
  "sessionId": "session_abc123"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "streamUrl": "https://stream.claudygod.com/audio/session_abc123",
    "expiresAt": "2026-03-30T18:25:00Z",
    "quality": "192kbps",
    "analytics": {
      "trackingUrl": "https://api.claudygod.com/v1/analytics/track"
    }
  }
}
```

### Update Playback Position
```http
POST /api/v1/playback/progress

Headers:
Authorization: Bearer {jwt_token}

Body:
{
  "contentId": "content_123",
  "position": 1800, // seconds
  "duration": 3600,
  "quality": "192kbps",
  "deviceId": "device_uuid",
  "timestamp": "2026-03-30T14:25:00Z"
}

Response:
{
  "success": true,
  "message": "Progress tracked"
}
```

### End Playback Session
```http
POST /api/v1/playback/end

Headers:
Authorization: Bearer {jwt_token}

Body:
{
  "contentId": "content_123",
  "sessionId": "session_abc123",
  "finalPosition": 3600,
  "duration": 3600,
  "completedPercentage": 100,
  "quality": "192kbps"
}

Response:
{
  "success": true,
  "message": "Session ended",
  "data": {
    "contentDelivered": true,
    "creditsEarned": 50 // for creators
  }
}
```

---

## 📊 Analytics Endpoints

### Track User Event
```http
POST /api/v1/analytics/event

Headers:
Authorization: Bearer {jwt_token}

Body:
{
  "eventType": "content_played" | "content_liked" | "content_shared" | "user_followed",
  "contentId": "content_123",
  "creatorId": "user_456",
  "timestamp": "2026-03-30T14:25:00Z",
  "metadata": {
    "quality": "192kbps",
    "source": "home_screen",
    "sessionId": "session_abc123"
  }
}

Response:
{
  "success": true,
  "message": "Event tracked"
}
```

### Get User Recommendations
```http
GET /api/v1/analytics/recommendations?limit=20

Headers:
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "content_125",
        "title": "Recommended Track",
        "reason": "Based on your listening history",
        "confidence": 0.95
      }
    ]
  }
}
```

### Get Engagement Metrics
```http
GET /api/v1/analytics/dashboard

Headers:
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "engagement": {
      "score": 75,
      "trend": "+12%",
      "hoursListened": 125.5,
      "contentCreated": 8,
      "followers": 342
    },
    "recommendations": [
      "Listen for 30 more minutes to reach weekly goal",
      "You're trending in Worship category!"
    ]
  }
}
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /api/v1/auth/login

Body:
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "displayName": "User Name"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

### Register
```http
POST /api/v1/auth/register

Body:
{
  "email": "newuser@example.com",
  "password": "secure_password",
  "displayName": "New User",
  "acceptTerms": true
}

Response:
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh

Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

### Logout
```http
POST /api/v1/auth/logout

Headers:
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🛒 Premium/Subscription Endpoints

### Get Subscription Plans
```http
GET /api/v1/subscriptions/plans

Response:
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_premium_monthly",
        "name": "Premium",
        "price": 9.99,
        "currency": "USD",
        "billingCycle": "monthly",
        "features": [
          "Ad-free listening",
          "Offline downloads",
          "High quality audio (320kbps)",
          "Skip unlimited"
        ]
      },
      {
        "id": "plan_pro_monthly",
        "name": "Creator Pro",
        "price": 19.99,
        "currency": "USD",
        "features": [
          "All Premium features",
          "20% revenue share",
          "Advanced analytics",
          "Promotion tools"
        ]
      }
    ]
  }
}
```

### Create Subscription
```http
POST /api/v1/subscriptions/create

Headers:
Authorization: Bearer {jwt_token}

Body:
{
  "planId": "plan_premium_monthly",
  "paymentMethodId": "pm_123456",
  "billingAddress": { ... }
}

Response:
{
  "success": true,
  "message": "Subscription created",
  "data": {
    "subscriptionId": "sub_123",
    "status": "active",
    "currentPeriodEnd": "2026-04-30T00:00:00Z"
  }
}
```

---

## 📝 Key Principles

### 1. Consistent Response Format
```typescript
{
  "success": boolean,
  "message"?: string,
  "data"?: any,
  "error"?: {
    "code": string,
    "message": string,
    "details"?: object
  },
  "timestamp": ISO8601_string,
  "pagination"?: { ... }
}
```

### 2. Error Codes
```
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
409 - Conflict
429 - Too Many Requests
500 - Internal Server Error
503 - Service Unavailable
```

### 3. Authentication
All protected routes require:
```
Authorization: Bearer {jwt_token}
```

### 4. Rate Limiting
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users
- Response headers include remaining count

### 5. Pagination
```
?limit=20&offset=0

Returns:
{
  "pagination": {
    "total": 5042,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "totalPages": 253
  }
}
```

### 6. Filtering & Sorting
```
?sortBy=recent&category=worship&quality=320kbps
```

---

## Implementation in Code

```typescript
// constants/api.ts - NEVER HARDCODE URLs

export const API_CONFIG = {
  base: process.env.REACT_NATIVE_API_URL || 'https://api.claudygod.com/v1',
  streaming: process.env.REACT_NATIVE_STREAM_URL || 'https://stream.claudygod.com',
  websocket: process.env.REACT_NATIVE_WS_URL || 'wss://realtime.claudygod.com',
  timeout: 30000,
};

export const ENDPOINTS = {
  // Content
  CONTENT_LIST: '/content/list',
  CONTENT_DETAILS: (id: string) => `/content/${id}`,
  CONTENT_SEARCH: '/content/search',
  CONTENT_TRENDING: '/content/trending',

  // Users
  USER_PROFILE: (userId: string) => `/users/${userId}`,
  USER_LIBRARY: '/users/library',
  USER_HISTORY: '/users/history',

  // Playback
  PLAYBACK_START: '/playback/start',
  PLAYBACK_PROGRESS: '/playback/progress',
  PLAYBACK_END: '/playback/end',

  // Analytics
  TRACK_EVENT: '/analytics/event',
  RECOMMENDATIONS: '/analytics/recommendations',
  DASHBOARD: '/analytics/dashboard',

  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
};
```

This provides a **professional, RESTful API structure** that's scalable and production-ready.
