# Troubleshooting Guide: API Errors & Common Issues

## 401 Unauthorized Errors

### Symptoms
```
GET https://api.claudygod.org/v1/me/library 401 (Unauthorized)
POST https://api.claudygod.org/v1/me/engagement/play-events 401 (Unauthorized)
```

### Root Causes & Solutions

#### 1. Session Not Properly Restored [FIXED ✅]
**Cause**: Mobile app's `authSessionStorage.restoreSession()` was looking for individual token keys instead of parsing the stored JSON session blob.

**Solution**: Updated `apps/mobile/lib/authSessionStorage.ts` to properly parse the stored session:

```typescript
async restoreSession(): Promise<AuthSession> {
  const key = 'claudygod.mobile-auth-session.v1';
  const storedSession = await this.getItem(key);
  
  if (!storedSession) return {};
  
  try {
    const parsed = JSON.parse(storedSession);
    return {
      accessToken: parsed.accessToken ?? undefined,
      refreshToken: parsed.refreshToken ?? undefined,
    };
  } catch {
    // Fallback to old individual keys if JSON parsing fails
    const accessToken = await this.getItem('accessToken');
    const refreshToken = await this.getItem('refreshToken');
    return { accessToken, refreshToken };
  }
}
```

**Verification**:
1. Open browser DevTools → Network tab
2. Make a request to `/v1/me/library`
3. Check the Request Headers
4. Should see: `Authorization: Bearer eyJhbGc...`

#### 2. Token Expired
**Symptoms**: Sometimes works, sometimes returns 401

**Cause**: Access token expires after 1 day (default `JWT_ACCESS_TTL=1d`)

**Solution**: The `apiFetchWithMobileSession()` function handles token refresh automatically:

```typescript
export async function apiFetchWithMobileSession<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  // ... get stored session ...
  
  // First attempt with existing token
  try {
    return await execute(accessToken);
  } catch (error) {
    // If 401, refresh the token and retry
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshMobileSessionWithToken(refreshToken);
      return execute(refreshed.accessToken);
    }
    throw error;
  }
}
```

**Manual Refresh**: Sign out and sign in again to get new tokens

#### 3. Refresh Token Invalid or Expired
**Symptoms**: Still 401 after token refresh attempt

**Cause**: Refresh token expired (no default expiry set in code, but could be revoked)

**Solution**: 
- User must sign in again
- Check if session is being properly stored after login

**Debug**:
```javascript
// In browser console:
const stored = await authSessionStorage.getItem('claudygod.mobile-auth-session.v1');
console.log(JSON.parse(stored || '{}'));
// Should show: { accessToken, refreshToken, user }
```

#### 4. Multiple Browser Tabs/Devices
**Symptoms**: Works on one device, 401 on another after login

**Cause**: Tokens stored in separate storage per device/tab

**Solution**: Each device needs its own session. Tokens are not synced across devices.

---

## Network & Connection Issues

### Slow Network / Timeout Errors

**Symptoms**:
```
[Intervention] Slow network is detected...
Fallback font will be used while loading...
```

**Cause**: Poor internet connection, slow server, or large file transfers

**Solutions**:

1. **Increase Timeout** (default 30s):
```typescript
// apps/mobile/services/apiClient.ts
const DEFAULT_TIMEOUT = 60000; // Increase to 60 seconds
```

2. **Implement Retry Logic**:
```typescript
async function fetchWithRetry(url: string, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
    }
  }
}
```

3. **Optimize Images**:
   - Use responsive image sizes
   - Compress images before upload
   - Consider using image CDN with WebP support

4. **Implement Offline Mode**:
   - Cache content feed locally
   - Allow viewing cached content offline
   - Sync when online

---

## UI/Layout Issues

### Images Not Fitting in Container

**Symptoms**:
- Images appear stretched or distorted
- Thumbnail sizes inconsistent
- Video thumbnail not properly constrained

**Cause**: Missing width/height constraints or improper resizeMode

**Solution**: Ensure proper container structure:

```typescript
<View style={{ width: 160, height: 220, overflow: 'hidden', borderRadius: 12 }}>
  <Image 
    source={{ uri: imageUrl }} 
    style={{ width: '100%', height: '100%' }} 
    resizeMode="cover"  // or "contain" depending on need
  />
</View>
```

### Cards Not Properly Sized

**Solution**: Use size configuration, not Tailwind classes:

```typescript
// ✅ CORRECT
const sizes = {
  sm: { w: 140, h: 200 },
  md: { w: 160, h: 220 },
  lg: { w: 200, h: 280 },
};

<View style={{ width: sizes[size].w, height: sizes[size].h }} />

// ❌ WRONG - Tailwind classes don't apply consistent sizing
<View className="w-40 h-40" />
```

### Text Overflow

**Solution**: Use `numberOfLines` prop:

```typescript
<CustomText numberOfLines={2} ellipsizeMode="tail">
  {longTitle}
</CustomText>
```

---

## Authentication Issues

### Session Not Persisting After App Restart

**Symptoms**: User logged in, but after closing and reopening app, needs to login again

**Cause**: Session storage not properly initialized on app launch

**Solution**: Check `_layout.tsx` for session restoration on app start:

```typescript
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await authSessionStorage.restoreSession();
        // Set auth state from restored session
        setIsReady(true);
      } catch {
        setIsReady(true);
      }
    }
    restoreSession();
  }, []);

  if (!isReady) return <SplashScreen />;
  return <Stack />;
}
```

### Email Verification Required

**Symptoms**: After signup, user can't access features

**Cause**: `AUTH_REQUIRE_EMAIL_VERIFICATION=true` in backend (default)

**Solution**:
- Backend sends verification email to user's email
- User clicks link in email
- Or manual verification: Call `POST /v1/auth/verify-email` with token

**Debug**:
```bash
# Check email configuration in .env.production
grep -i "EMAIL" .env.production
# Ensure SMTP credentials are correct
```

---

## Backend Issues

### Database Connection Issues

**Symptoms**: 
```
Error: connect ECONNREFUSED
Error: Client was closed
```

**Cause**: PostgreSQL not running or connection pool exhausted

**Solutions**:

1. **Check Database Connection**:
```bash
# Test connection string
psql $DATABASE_URL -c "SELECT 1;"
```

2. **Check Connection Pool**:
```typescript
// services/api/src/db/pool.ts
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

3. **Verify ENV Variables**:
```bash
echo $DATABASE_URL
# Should output: postgresql://user:pass@host:5432/dbname
```

### Rate Limiting Issues

**Symptoms**: `429 Too Many Requests` response

**Cause**: API rate limit exceeded (default 100 req/min per IP)

**Solution**:

1. **Adjust Rate Limit** (in `app.ts`):
```typescript
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,  // 100 requests per window
  skip: (req) => req.path === '/v1/auth/sign-in',  // Skip auth routes
});
```

2. **Implement Client-Side Queue**:
```typescript
const queue = [];
const processing = false;

async function queueRequest(req) {
  queue.push(req);
  if (!processing) await processQueue();
}
```

### CORS Errors

**Symptoms**:
```
Access to XMLHttpRequest at 'https://api.claudygod.org' has been blocked by CORS policy
```

**Cause**: Origin not in whitelist

**Solution**: Update `CORS_ORIGIN` in `.env.production`:

```bash
CORS_ORIGIN=https://app.claudygod.org,https://admin.claudygod.org,http://localhost:3000
```

---

## Performance Issues

### Slow App Startup

**Symptoms**: App takes >3 seconds to load main screen

**Cause**: Session restoration, large initial data load

**Solution**:

1. **Parallelize Initial Requests**:
```typescript
const [user, config, feed] = await Promise.all([
  getProfile(),
  getAppConfig(),
  getFeed(),
]);
```

2. **Lazy Load Non-Critical Data**:
```typescript
// Load feed immediately, load word-of-day after
const profile = await getProfile();
setTimeout(() => getWordOfDay(), 500);
```

3. **Profile App Performance**:
```typescript
// Use React Profiler
import { Profiler } from 'react';

<Profiler id="home-screen" onRender={logProfile}>
  <HomeScreen />
</Profiler>
```

### Memory Leaks

**Symptoms**: App gets slower over time, eventually crashes

**Cause**: Unsubscribed listeners, unmemoized callbacks

**Solution**:

```typescript
useEffect(() => {
  const unsubscribe = subscribeToData();
  
  return () => {
    unsubscribe();  // Cleanup on unmount
  };
}, []);

// Or use useCallback to prevent unnecessary listener registrations
const handlePress = useCallback(() => {
  // ...
}, []);
```

---

## Common Errors & Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `TypeError: Cannot read property 'accessToken' of undefined` | Session not found | User needs to sign in |
| `ReferenceError: Can't find variable: fetch` | Web API not available | Use platform-specific polyfill |
| `Warning: Each child in a list should have a key prop` | Missing key in maps | Add unique key to each item |
| `Network error: TypeError: Failed to fetch` | CORS or network error | Check CORS policy, check network |
| `ValidationError: "email" is not valid` | Invalid email format | Validate before submission |
| `SyntaxError: Unexpected token < in JSON at position 0` | HTML response instead of JSON | Check API response format |

---

## Health Check

Run this script to verify system health:

```bash
#!/bin/bash

echo "=== ClaudyGod System Health Check ==="

# Check API is running
echo "1. Checking API..."
curl -s https://api.claudygod.org/health | jq . || echo "❌ API unreachable"

# Check database
echo "2. Checking Database..."
psql $DATABASE_URL -c "SELECT 1;" && echo "✅ Database OK" || echo "❌ Database error"

# Check Redis
echo "3. Checking Redis..."
redis-cli -u $REDIS_URL ping && echo "✅ Redis OK" || echo "❌ Redis error"

# Check Auth
echo "4. Checking Auth..."
curl -s -X POST https://api.claudygod.org/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' | jq . || echo "❌ Auth error"

echo "=== Health Check Complete ==="
```

---

## Getting Help

### Logs to Check

1. **Mobile App Logs**:
   - Browser DevTools Console (`F12`)
   - Xcode Console (iOS)
   - Android Studio Logcat (Android)

2. **Backend Logs**:
   - Docker: `docker logs api`
   - File: `services/api/logs/`
   - Structured JSON logs with request ID

3. **Request Inspector**:
   - Browser DevTools Network tab
   - Check headers, body, response
   - Look for `X-Request-ID` for backend correlation

### Debug Mode

Enable verbose logging:

```bash
# Mobile
DEBUG=* npm start

# Backend
NODE_ENV=development npm run dev
```

### Contact & Support

- **Issues**: GitHub Issues (if public)
- **Documentation**: `/root/Tech_projects_000/ClaudyGod-MobileApp/ClaudyGod-MobileApp/README.md`
- **API Docs**: Will be generated from OpenAPI schema
