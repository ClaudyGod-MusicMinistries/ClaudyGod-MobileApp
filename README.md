# ClaudyGod - Music Ministry & Worship Streaming Platform

Modern, professional worship streaming application built with React Native, Expo, and TypeScript.

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ClaudyGod-MusicMinistries/ClaudyGod-MobileApp.git
cd ClaudyGod-MobileApp

# Install dependencies
make install

# Start development
make dev
```

## Project Structure

```
ClaudyGod-MobileApp/
├── apps/mobile/                 # React Native mobile app (Expo)
│   ├── app/                     # Expo Router screens
│   ├── components/              # Reusable components
│   ├── services/                # API services
│   ├── theme/                   # Design system tokens
│   └── util/                    # Utilities
├── services/api/                # Backend API
├── admin/web/                   # Admin panel
└── ops/                         # Operations & deployment
```

## Development Commands

### Setup & Installation
```bash
make install        # Install all dependencies
make setup          # Full setup (install + build)
make clean          # Clean build artifacts
make clean-all      # Remove all dependencies
```

### Development
```bash
make dev            # Start mobile dev server
make dev-web        # Start web development
make dev-ios        # Start iOS development
make dev-android    # Start Android development
```

### Building
```bash
make build          # Build for all platforms
make build-web      # Build web bundle
make build-ios      # Build iOS app
make build-android  # Build Android APK
```

### Code Quality
```bash
make lint           # Run ESLint
make lint-fix       # Fix linting issues
make typecheck      # Run TypeScript check
make test           # Run test suite
```

### Other Commands
```bash
make help           # Show all available commands
make logs           # Show app logs
```

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform & tools
- **TypeScript** - Type-safe JavaScript
- **NativeWind** - Tailwind CSS for React Native
- **Expo Router** - File-based routing

### Design & UI
- **Linear Gradient** - Gradient effects
- **Reanimated** - Smooth animations
- **Vector Icons** - Material icons support

### State & Data
- **Supabase** - Backend & authentication
- **AsyncStorage** - Local data persistence

### Development
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Jest** - Testing framework

## Environment Setup

### Environment Variables

Create `.env.development` in `apps/mobile/`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Features

### Core Functionality
✅ Music/Audio Streaming
✅ Video Content
✅ Live Sessions
✅ User Playlists
✅ Favorites/Saved Content
✅ User Profiles
✅ Authentication

### Design System
✅ Professional shadows & elevation
✅ Consistent spacing (8px grid)
✅ Smooth 60fps animations
✅ WCAG 2.1 AA Accessibility
✅ Dark mode support
✅ Responsive layouts

## Performance

- **Animations**: 60fps smooth on all devices
- **Load Time**: App launch < 3 seconds
- **Memory**: Stable, no leaks
- **Accessibility**: WCAG 2.1 AA compliant
- **Touch Targets**: 48px minimum (WCAG compliant)

## Testing

### Run Tests
```bash
make test
```

### Manual Testing
- Test on real devices (not emulator)
- Check animations for smoothness
- Verify touch responsiveness
- Test with screen readers (accessibility)

## Deployment

### iOS App Store
```bash
make build-ios
# Follow Expo EAS Build process
```

### Google Play Store
```bash
make build-android
# Follow Expo EAS Build process
```

## Troubleshooting

### Issue: Module not found errors
**Solution**: Run `npm install` in `apps/mobile/`

### Issue: TypeScript errors
**Solution**: Run `make typecheck` to see detailed errors

### Issue: Animation stuttering
**Solution**: 
- Test on real device (not emulator)
- Check `useNativeDriver: true` in animations
- Profile with React DevTools

### Issue: Dependencies conflict
**Solution**: Run `make clean-all` then `make install`

## Git Workflow

```bash
make status         # Check git status
make pull           # Pull latest changes
make push           # Push to main branch
```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Run linter: `make lint-fix`
4. Run tests: `make test`
5. Commit: `git commit -m "feat: your feature"`
6. Push: `make push`

## Code Quality Standards

- **TypeScript**: Full type coverage
- **Linting**: ESLint strict mode
- **Testing**: Unit tests for critical code
- **Accessibility**: WCAG 2.1 AA minimum
- **Performance**: 60fps animations, < 100MB app size

## Release Checklist

Before shipping:
- [ ] `make lint` passes
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Performance verified (60fps)
- [ ] Accessibility verified
- [ ] Privacy policy updated
- [ ] Version number bumped

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review code comments
3. Check environment configuration
4. Run with `make logs` to see detailed output

## License

© 2024 ClaudyGod Music Ministries. All rights reserved.

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [NativeWind Docs](https://nativewind.dev)

---

**Status**: Production Ready ✅  
**Version**: 1.0.0  
**Last Updated**: 2024
