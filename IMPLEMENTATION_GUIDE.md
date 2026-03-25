# Implementation Guide: Professional Code Improvements

## Quick Start: Priority Fixes (Next 48 Hours)

This guide provides step-by-step implementation for the most critical issues identified in the code review.

---

## 1. BACKEND: Add Input Validation to All Routes

### Step 1: Create Validation Schema Library

**File:** `services/api/src/lib/schemas.ts`

```typescript
import { z } from 'zod';

// ============ Shared Schemas ============
export const emailSchema = z.string().email().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[!@#$%^&*]/, 'Password must contain special character');

export const idSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============ Auth Schemas ============
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(2).max(100),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

// ============ Content Schemas ============
export const contentTypeEnum = z.enum(['ARTICLE', 'VIDEO', 'IMAGE', 'PODCAST']);

export const createContentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  body: z.string().min(1).max(10000).optional(),
  contentType: contentTypeEnum,
  imageUrl: z.string().url().optional().or(z.literal('')),
  publishedAt: z.string().datetime().optional(),
  sectionId: idSchema.optional(),
});

export const updateContentSchema = createContentSchema.partial();

export const getContentListSchema = z.object({
  ...paginationSchema.shape,
  contentType: contentTypeEnum.optional(),
  sectionId: idSchema.optional(),
  search: z.string().max(200).optional(),
});

// ============ YouTube Schemas ============
export const syncYouTubeSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(50).default(12),
  forceRefresh: z.coerce.boolean().default(false),
});

// ============ Ads Schemas ============
export const createAdSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  imageUrl: z.string().url(),
  redirectUrl: z.string().url(),
  placement: z.enum(['BANNER', 'INLINE', 'FULLSCREEN']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateAdSchema = createAdSchema.partial();

// ============ Helper Function ============
export const createValidationMiddleware = (schema: z.ZodSchema) => {
  return async (req, res, next) => {
    try {
      req.validated = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new HttpError(400, 'Validation failed', {
            errors: error.flatten().fieldErrors,
          })
        );
      }
      next(error);
    }
  };
};
```

### Step 2: Create Validation Middleware Wrapper

**File:** `services/api/src/middleware/validateRequest.ts`

```typescript
import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '../lib/httpError';

export const validateBody = (schema: ZodSchema): RequestHandler => {
  return async (req, res, next) => {
    try {
      req.validated = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof Error && 'flatten' in error) {
        return next(
          new HttpError(400, 'Request validation failed', {
            errors: (error as any).flatten().fieldErrors,
          })
        );
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema): RequestHandler => {
  return async (req, res, next) => {
    try {
      req.validated = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof Error && 'flatten' in error) {
        return next(
          new HttpError(400, 'Query validation failed', {
            errors: (error as any).flatten().fieldErrors,
          })
        );
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema): RequestHandler => {
  return async (req, res, next) => {
    try {
      req.validated = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof Error && 'flatten' in error) {
        return next(
          new HttpError(400, 'Parameter validation failed', {
            errors: (error as any).flatten().fieldErrors,
          })
        );
      }
      next(error);
    }
  };
};
```

### Step 3: Update Auth Routes with Validation

**File:** `services/api/src/modules/auth/auth.routes.ts`

```typescript
import express from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validateRequest';
import {
  signUpSchema,
  signInSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../lib/schemas';
import * as authService from './auth.service';
import { asyncHandler } from '../../lib/asyncHandler'; // See below

export const authRouter = express.Router();

// @route   POST /v1/auth/sign-up
// @desc    Register new user
// @access  Public
authRouter.post(
  '/sign-up',
  validateBody(signUpSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.validated);
    res.status(201).json(result);
  })
);

// @route   POST /v1/auth/sign-in
// @desc    Authenticate user
// @access  Public
authRouter.post(
  '/sign-in',
  validateBody(signInSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.validated);
    res.status(200).json(result);
  })
);

// @route   POST /v1/auth/email/verify/request
// @desc    Request email verification
// @access  Public
authRouter.post(
  '/email/verify/request',
  validateBody(z.object({ email: emailSchema })),
  asyncHandler(async (req, res) => {
    await authService.resendVerificationEmail(req.validated);
    res.status(200).json({ message: 'Verification email sent' });
  })
);

// @route   POST /v1/auth/email/verify
// @desc    Verify email with code
// @access  Public
authRouter.post(
  '/email/verify',
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.validated);
    res.status(200).json(result);
  })
);

// @route   POST /v1/auth/forgot-password
// @desc    Request password reset email
// @access  Public
authRouter.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.requestPasswordReset(req.validated.email);
    res.status(200).json({ message: 'Password reset email sent' });
  })
);

// @route   POST /v1/auth/reset-password
// @desc    Reset password with token
// @access  Public
authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.validated);
    res.status(200).json(result);
  })
);

// @route   POST /v1/auth/logout
// @desc    Logout user
// @access  Private
authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logoutUser(req.user!.sub);
    res.status(200).json({ message: 'Logged out' });
  })
);
```

### Step 4: Create Async Error Handler Wrapper

**File:** `services/api/src/lib/asyncHandler.ts`

```typescript
import type { RequestHandler } from 'express';

/**
 * Wraps async route handlers to automatically catch errors
 * Without this, unhandled promise rejections will crash the server
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

---

## 2. BACKEND: Add Request ID Tracking & Structured Logging

### Step 1: Install Logger Dependency

```bash
cd services/api
npm install winston winston-daily-rotate-file
```

### Step 2: Create Logger Configuration

**File:** `services/api/src/lib/logger.ts`

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/env';

const isDevelopment = env.NODE_ENV === 'development';

const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// File transports in production
if (!isDevelopment) {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    })
  );
}

export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'claudygod-api' },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
    }),
  ],
});

export type Logger = typeof logger;
```

### Step 3: Add Request ID & Logging Middleware

**File:** `services/api/src/middleware/requestTracking.ts`

```typescript
import crypto from 'crypto';
import type { RequestHandler } from 'express';
import { logger } from '../lib/logger';

export const requestTrackingMiddleware: RequestHandler = (req, res, next) => {
  // Generate request ID
  const requestId = req.header('x-request-id') || crypto.randomUUID();
  req.id = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log request
  logger.info(
    {
      type: 'http.request',
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.header('user-agent'),
    },
    `${req.method} ${req.path}`
  );

  // Log response
  const originalJson = res.json;
  res.json = function (body) {
    logger.info(
      {
        type: 'http.response',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: Date.now(),
      },
      `${req.method} ${req.path} - ${res.statusCode}`
    );
    return originalJson.call(this, body);
  };

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      validated?: any;
    }
  }
}
```

### Step 4: Update App.ts with Logging

**File:** `services/api/src/app.ts` (update the beginning)

```typescript
import { requestTrackingMiddleware } from './middleware/requestTracking';
import { logger } from './lib/logger';

// ... existing imports ...

const app = express();

// Trust proxy (important for X-Forwarded-For in production)
app.set('trust proxy', 1);

// Request tracking and logging
app.use(requestTrackingMiddleware);

// ... rest of middleware ...

// Error handler (at the end, make sure it logs with requestId)
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    logger.error(
      {
        type: 'http.error',
        requestId: req.id,
        statusCode,
        message,
        error: error instanceof Error ? error.stack : error,
      },
      `Error: ${message}`
    );

    res.status(statusCode).json({
      error: message,
      requestId: req.id,
      details: process.env.NODE_ENV !== 'production' ? error.details : undefined,
    });
  }
);
```

---

## 3. BACKEND: Add Rate Limiting to Auth Endpoints

### Step 1: Install Rate Limiting Package

```bash
cd services/api
npm install express-rate-limit
```

### Step 2: Create Rate Limit Configuration

**File:** `services/api/src/middleware/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../lib/redis';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Strict rate limiter for auth attempts
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts, please try again later',
  skip: (req) => process.env.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  },
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:password-reset:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset attempts per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Email verification limiter
export const emailVerificationLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:email-verify:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 verification attempts per hour
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Step 3: Update Auth Routes with Rate Limiting

**File:** `services/api/src/modules/auth/auth.routes.ts`

```typescript
import { authLimiter, passwordResetLimiter, emailVerificationLimiter } from '../../middleware/rateLimiter';

authRouter.post(
  '/sign-in',
  authLimiter, // Add rate limiter
  validateBody(signInSchema),
  asyncHandler(async (req, res) => {
    // ...
  })
);

authRouter.post(
  '/forgot-password',
  passwordResetLimiter, // Add rate limiter
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    // ...
  })
);

authRouter.post(
  '/email/verify/request',
  emailVerificationLimiter, // Add rate limiter
  validateBody(emailVerifyRequestSchema),
  asyncHandler(async (req, res) => {
    // ...
  })
);
```

---

## 4. ADMIN WEB: Setup TypeScript & Type Safety

### Step 1: Upgrade Vue Project Config

**File:** `admin/web/vite.config.js` (rename to `vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
});
```

### Step 2: Create TypeScript Config

**File:** `admin/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noImplicitAny": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules"]
}
```

### Step 3: Create Type Definitions

**File:** `admin/web/src/types/index.ts`

```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  refreshToken: string;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  body?: string;
  contentType: 'ARTICLE' | 'VIDEO' | 'IMAGE' | 'PODCAST';
  imageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, any>;
  requestId?: string;
}
```

### Step 4: Create Composable for API Calls

**File:** `admin/web/src/composables/useFetch.ts`

```typescript
import { ref, Ref } from 'vue';
import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types';

interface UseFetchOptions {
  immediate?: boolean;
}

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {}
) {
  const data: Ref<T | null> = ref(null);
  const loading = ref(false);
  const error: Ref<ApiError | null> = ref(null);

  const fetchData = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get<T>(url);
      data.value = response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error.value = err.response?.data || {
          error: 'Network error',
        };
      } else {
        error.value = { error: 'Unknown error' };
      }
    } finally {
      loading.value = false;
    }
  };

  if (options.immediate !== false) {
    fetchData();
  }

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

### Step 5: Migrate App.jsx to App.vue with Types

**File:** `admin/web/src/App.vue`

```vue
<template>
  <div class="app">
    <div v-if="loading" class="loader">Loading...</div>
    <AuthScreen v-else-if="!isLoggedIn" @login="handleLogin" />
    <AdminShell v-else>
      <!-- App content -->
    </AdminShell>

    <!-- Error notification -->
    <div v-if="error" class="error-notification">
      {{ error.error }}
      <button @click="error = null">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue';
import type { User, AuthResponse } from './types';
import { http } from './app/http';

const token = ref<string | null>(localStorage.getItem('auth_token'));
const user = ref<User | null>(null);
const loading = ref(true);
const error = ref<{ error: string } | null>(null);
const inactivityTimeout = ref<number | null>(null);

const isLoggedIn = computed(() => !!token.value && !!user.value);

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await http.post<AuthResponse>('/v1/auth/sign-in', {
      email,
      password,
    });
    token.value = response.data.token;
    user.value = response.data.user;
    localStorage.setItem('auth_token', token.value);
    http.defaults.headers.common.Authorization = `Bearer ${token.value}`;
    resetInactivityTimer();
  } catch (err) {
    error.value = { error: 'Login failed' };
  }
};

const handleLogout = () => {
  token.value = null;
  user.value = null;
  localStorage.removeItem('auth_token');
  delete http.defaults.headers.common.Authorization;
};

const resetInactivityTimer = () => {
  if (inactivityTimeout.value) {
    clearTimeout(inactivityTimeout.value);
  }
  inactivityTimeout.value = window.setTimeout(handleLogout, 30 * 60 * 1000);
};

onMounted(() => {
  loading.value = false;
  if (token.value) {
    resetInactivityTimer();
  }
});

onBeforeUnmount(() => {
  if (inactivityTimeout.value) {
    clearTimeout(inactivityTimeout.value);
  }
});
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.error-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ef4444;
  color: white;
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 9999;
}
</style>
```

---

## 5. MOBILE: Add Error Boundary & Token Refresh

### Step 1: Create Error Boundary Component

**File:** `apps/mobile/components/ErrorBoundary.tsx`

```typescript
import React from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error boundary caught:', error);
    // Send to error tracking service
    // Sentry.captureException(error);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <SafeAreaView className="flex-1 bg-red-50">
          <ScrollView className="flex-1 p-4">
            <Text className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </Text>
            <Text className="text-gray-700 mb-4">
              {this.state.error.message}
            </Text>
            {__DEV__ && (
              <View className="bg-gray-200 p-4 rounded mb-4">
                <Text className="font-mono text-xs text-gray-800">
                  {this.state.error.stack}
                </Text>
              </View>
            )}
            <Button
              title="Try Again"
              onPress={this.resetError}
              color="#dc2626"
            />
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
```

### Step 2: Create API Interceptor with Token Refresh

**File:** `apps/mobile/services/api.ts`

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiUrl } from '../lib/config';

interface TokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

export const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post<TokenResponse>(`${apiUrl}/v1/auth/refresh`, {
          refreshToken,
        });

        await SecureStore.setItemAsync('auth_token', data.token);
        await SecureStore.setItemAsync('refresh_token', data.refreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        originalRequest.headers.Authorization = `Bearer ${data.token}`;

        processQueue(null, data.token);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Clear tokens and navigate to login
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
        // Emit logout event or navigate
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
```

### Step 3: Wrap App with Error Boundary

**File:** `apps/mobile/app/_layout.tsx`

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RootLayoutNavigator } from './_navigator';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutNavigator />
    </ErrorBoundary>
  );
}
```

---

## Next Steps

1. **Implement validation schemas** (1-2 hours)
2. **Add logging middleware** (1 hour)
3. **Setup rate limiting** (30 minutes)
4. **Migrate admin to TypeScript** (3-4 hours)
5. **Add error handling to mobile** (2 hours)

**Total Estimated Effort:** 8-10 hours

After completing these steps, your application will be significantly more robust and production-ready.

---

## Testing the Improvements

### Backend Validation Test
```bash
curl -X POST http://localhost:4000/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"123"}' \
# Should return 400 with validation errors
```

### Rate Limiting Test
```bash
# Run 6 times in quick succession
for i in {1..6}; do
  curl -X POST http://localhost:4000/v1/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!"}'
done
# Last request should return 429 (Too Many Requests)
```

---

**Document Created:** March 25, 2026  
**Ready to Implement:** Yes  
**Estimated Timeline:** 1-2 weeks for full implementation
