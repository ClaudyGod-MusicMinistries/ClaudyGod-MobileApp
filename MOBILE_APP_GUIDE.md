# Mobile App Architecture & UI Improvements

## Overview
The ClaudyGod mobile app is built with React Native using Expo, leveraging modern styling with Tailwind CSS (NativeWind) and a component-based architecture.

## Key Fixes Applied

### 1. Authentication Token Restoration [CRITICAL]
**Issue**: Mobile app was receiving 401 Unauthorized errors on API calls
**Root Cause**: `authSessionStorage.restoreSession()` was looking for individual token keys instead of parsing the stored JSON session blob

**File**: `apps/mobile/lib/authSessionStorage.ts`
**Fix**: Updated the function to properly parse the session stored under key `claudygod.mobile-auth-session.v1`

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
    // Fallback to old key format
    const accessToken = await this.getItem('accessToken');
    const refreshToken = await this.getItem('refreshToken');
    return { accessToken, refreshToken };
  }
}
```

**Impact**: All subsequent API calls will now include proper Authorization headers with the Bearer token.

### 2. UI Component Improvements

#### PosterCard Component (`apps/mobile/components/ui/PosterCard.tsx`)
**Improvements**:
- ✅ Fixed image aspect ratio (140x200 → 160x220 → 200x280)
- ✅ Improved gradient overlay for better text readability
- ✅ Added live indicator with pulsing dot
- ✅ Enhanced badge styling with live/featured variants
- ✅ Better shadow and border styling for professional appearance
- ✅ Increased play button size for better UX
- ✅ Added support for live view count display

#### MediaCard Component (`apps/mobile/components/mediaCard.tsx`)
**Improvements**:
- ✅ Proper image container constraints (no distortion)
- ✅ Professional shadow and border styling
- ✅ Better gradient overlay for text readability
- ✅ Badge styling with live indicator
- ✅ View count display for live content
- ✅ Enhanced typography with proper weighting
- ✅ Consistent spacing and padding

### 3. Header & Navigation
**Components**:
- `BrandedHeaderCard.tsx` - Branded header with logo and actions
- `SectionHeader.tsx` - Section titles with action buttons
- `CustomText.tsx` - Supports variants: `hero`, `heading`, `title`, `subtitle`, `body`, `caption`, `label`

## Component Hierarchy

```
App
├── (Tabs)
│   ├── Home Screen
│   │   ├── BrandedHeaderCard
│   │   ├── CinematicHeroCard (Featured Content)
│   │   ├── QuickLinks
│   │   ├── SponsoredCard
│   │   └── MediaRails
│   │       └── PosterCard[] | MediaCard[]
│   ├── Videos Screen
│   ├── Music/Player Screen
│   ├── Live Screen
│   ├── Search Screen
│   └── Profile Screen
├── Auth Stack
│   ├── Sign In
│   ├── Sign Up
│   ├── Forgot Password
│   └── Verify Email
└── Details/Player Screens
    ├── Audio Player
    ├── Video Player
    └── Live Session Detail
```

## Styling System

### Theme (`util/colorScheme.ts`)
- **Dark Mode**: Primary colors with high contrast
- **Light Mode**: Softer palette with subtle backgrounds
- **Color Scale**: Primary (purple), Success (green), Warning (amber), Danger (red)

### Design Tokens (`styles/designTokens.ts`)
```typescript
spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
radius: { sm: 4, md: 8, lg: 12, xl: 16, pill: 999 }
typography: { hero, heading, title, subtitle, body, caption, label }
shadows: { soft, card, elevated }
```

### Responsive Design
```typescript
const { width } = useWindowDimensions();
const isTV = width >= 1200;
const isTablet = width >= 768 && !isTV;
const isMobile = width < 768;
```

## Services & Hooks

### API Services (`services/`)
- `apiClient.ts` - Low-level fetch wrapper with timeout & error handling
- `api.ts` - Public/authenticated fetch wrappers
- `authService.ts` - Authentication and session management
- `contentService.ts` - Content fetching and feed management
- `userFlowService.ts` - User-specific operations (profile, library, engagement)
- `liveService.ts` - Live streaming functionality
- `supabaseAnalytics.ts` - Analytics and tracking

### Custom Hooks (`hooks/`)
- `useContentFeed()` - Fetch and manage content feed
- `useMobileAppConfig()` - Get app configuration
- `useWordOfDay()` - Get daily word
- `useAuth()` - Authentication state and operations
- `useToast()` - Toast notifications

## Data Flow

### Feed Loading Example
```
Component → useContentFeed() hook
        ↓
    contentService.fetchMobileFeed()
        ↓
    apiFetchWithMobileSession('/v1/mobile/feed')
        ↓
    authService reads stored tokens
        ↓
    apiClient adds Authorization header
        ↓
    Backend validates JWT
        ↓
    Returns personalized content
        ↓
    State update → Component re-render
        ↓
    PosterCards/MediaCards rendered
```

## Performance Optimization

### Image Handling
- **Lazy Loading**: Images loaded on-demand via ScrollView virtualization
- **Resizing**: Native `resizeMode="cover"` for optimal fit
- **Memory**: Image caching handled by React Native
- **Placeholder**: Skeleton loaders while images load

### State Management
- **Context API**: ToastContext, AuthContext for global state
- **AsyncStorage**: User sessions and preferences
- **React Query**: (Consider for better caching) Could improve data fetching

### Bundle Size
- **Code Splitting**: Components lazy-loaded per route
- **Tree Shaking**: Unused code removed in production builds
- **Treeshaking Icons**: Only used Material icons bundled

## Common Issues & Solutions

### 401 Unauthorized Errors ✅ FIXED
**Symptoms**: 
- "GET https://api.claudygod.org/v1/me/library 401 (Unauthorized)"
- "POST https://api.claudygod.org/v1/me/engagement/play-events 401"

**Fix Applied**: Updated `authSessionStorage.restoreSession()` to properly parse stored session JSON

**Verification**: Check Network tab in DevTools - Authorization header should be present

### Image Not Fitting Container
**Symptoms**: Images appear stretched or distorted

**Solution**:
- Ensure Image component has explicit width/height
- Use `resizeMode="cover"` for consistent aspect ratio
- Wrap in View with `overflow: 'hidden'`

```typescript
<View style={{ width: size.w, height: size.h, overflow: 'hidden' }}>
  <Image 
    source={{ uri: imageUrl }} 
    style={{ width: '100%', height: '100%' }} 
    resizeMode="cover"
  />
</View>
```

### Slow Network Issues
**Symptoms**: Fonts not loading, slow content loading

**Solution**:
- Implement retry logic with exponential backoff
- Show skeleton loaders during data fetch
- Use image CDN with compression

## Development Best Practices

### Component Creation Checklist
- [ ] Create in appropriate subfolder (`ui/`, `sections/`, `layout/`, etc)
- [ ] Use TypeScript interfaces for props
- [ ] Use `useAppTheme()` for colors and spacing
- [ ] Implement responsive design
- [ ] Add PropTypes or JSDoc comments
- [ ] Export from `index.ts` if re-exported
- [ ] Test on mobile, tablet, and TV sizes

### API Integration Checklist
- [ ] Use `apiFetchWithMobileSession()` for authenticated requests
- [ ] Use `publicFetch()` for public APIs
- [ ] Handle 401 errors (token refresh handled automatically)
- [ ] Implement error boundary
- [ ] Show loading state (skeleton or spinner)
- [ ] Show error message if request fails
- [ ] Validate response schema

### Performance Checklist
- [ ] Memoize expensive calculations
- [ ] Use `useMemo()` for hook values
- [ ] Use `useCallback()` for function props
- [ ] Implement virtualization for long lists
- [ ] Optimize images (compress, right size)
- [ ] Use native performance tools (`Profiler` in DevTools)

## Next Steps for Enhancement

### UI/UX
1. **Dark Mode Toggle**: Allow user to switch themes
2. **Animation Improvements**: Add transition animations for navigation
3. **Gesture Support**: Swipe gestures for dismissed cards
4. **Custom Fonts**: Load branded fonts from assets
5. **Improved Accessibility**: ARIA labels and focus management

### Features
1. **Search**: Implement full-text search across content
2. **Bookmarks**: Save favorite content
3. **Sharing**: Deep links for sharing content
4. **Offline Mode**: Offline viewing for downloaded content
5. **Push Notifications**: Real-time notifications for live events

### Performance
1. **Code Splitting**: Lazy load screen components
2. **Image Compression**: Serve images in multiple sizes
3. **API Caching**: Implement React Query for better caching
4. **Background Sync**: Sync data when online
5. **Worklets**: Use React Native Reanimated for smooth animations

### Testing
1. **Unit Tests**: Service and utility functions
2. **Component Tests**: Jest & React Test Library
3. **E2E Tests**: Detox for user flows
4. **Performance Tests**: Measure app startup time
5. **Visual Tests**: Screenshot tests for UI consistency

## File Structure Best Practices

```
apps/mobile/
├── app/                    # Page components (routes)
│   ├── (tabs)/            # Tab navigation routes
│   ├── auth/              # Auth flows
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── sections/         # Page section components
│   ├── layout/           # Layout wrappers
│   ├── media/            # Media players
│   └── auth/             # Auth components
├── services/             # API services
├── hooks/                # Custom React hooks
├── context/              # React Context
├── lib/                  # Utilities & helpers
├── util/                 # Utility functions
├── styles/              # Design tokens
├── theme/               # Theme configuration
├── types/               # TypeScript types
├── constants/           # Constants & config
└── assets/              # Images & fonts
```

## Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [NativeWind](https://www.nativewind.dev)
- [React Navigation](https://reactnavigation.org)
- [Zod Validation](https://zod.dev)
