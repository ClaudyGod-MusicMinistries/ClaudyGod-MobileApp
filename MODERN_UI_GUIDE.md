# Modern UI Component Library

## Overview

This comprehensive modern UI library provides beautiful, animated components for both mobile and admin applications. All components feature smooth animations, gradient designs, and responsive layouts.

## Mobile Components

### 1. **Card.tsx** - Modern Card Component
Beautiful card component with multiple variants for displaying content.

**Features:**
- 4 variants: `elevated`, `filled`, `outlined`, `gradient`
- Smooth press animations
- Shadow effects and hover states
- Fully customizable styling

**Usage:**
```typescript
import { Card } from '@/components/ui/Card';

<Card variant="elevated" padding={16}>
  <Text>Beautiful Content</Text>
</Card>
```

### 2. **Header.tsx** - Animated Header
Modern header with gradient background and scroll animations.

**Features:**
- Gradient backgrounds
- Animated title on scroll
- Left and right action areas
- SafeAreaView integration

**Usage:**
```typescript
import { Header } from '@/components/ui/Header';

<Header 
  title="Dashboard"
  subtitle="Welcome back"
  gradient={['#667eea', '#764ba2']}
/>
```

### 3. **ModernButton.tsx** - Animated Button
Beautiful button with multiple variants and smooth animations.

**Features:**
- 5 variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
- 3 sizes: `sm`, `md`, `lg`
- Gradient support
- Scale and opacity animations
- Icon support

**Usage:**
```typescript
import { ModernButton } from '@/components/ui/ModernButton';

<ModernButton
  label="Get Started"
  variant="primary"
  size="lg"
  onPress={() => console.log('Pressed')}
  gradient={['#667eea', '#764ba2']}
/>
```

### 4. **StatCard.tsx** - Enhanced Statistics Card
Displays metrics with gradient backgrounds and trend indicators.

**Features:**
- Gradient overlays
- Trend indicators (up/down)
- Icon support
- Staggered animations
- Custom gradient colors

**Usage:**
```typescript
import { StatCard } from '@/components/ui/StatCard';

<StatCard
  label="Total Users"
  value="12,543"
  trend="up"
  trendValue="12.5%"
  gradient={['#667eea', '#764ba2']}
/>
```

### 5. **ModernInput.tsx** - Beautiful Text Input
Modern text input with animations and validation.

**Features:**
- 3 variants: `outlined`, `filled`, `flat`
- Focus animations
- Error state handling
- Icon support
- Smooth transitions

**Usage:**
```typescript
import { ModernInput } from '@/components/ui/ModernInput';

<ModernInput
  label="Email"
  placeholder="Enter your email"
  variant="outlined"
  error={email.error}
/>
```

### 6. **AnimatedScrollView.tsx** - Parallax Scroll
Animated scroll view with custom scroll handling.

**Features:**
- OnScroll callbacks
- Type-safe event handling
- Smooth scrolling
- Performance optimized

**Usage:**
```typescript
import { AnimatedScrollView } from '@/components/ui/AnimatedScrollView';

<AnimatedScrollView
  onScroll={(offset) => console.log(offset)}
  fadeEdges={true}
>
  <Content />
</AnimatedScrollView>
```

### 7. **SkeletonLoader.tsx** - Loading Skeleton
Skeleton loaders with shimmer animation.

**Features:**
- Main component + subcomponents (Card, Avatar, HeroCard)
- Smooth shimmer animation
- Customizable dimensions
- Easy composition

**Usage:**
```typescript
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

<SkeletonLoader.Card />
<SkeletonLoader.Avatar size={48} />
```

## Admin Components

### 1. **DashboardLayout.tsx** - Main Layout
Complete dashboard layout with sidebar and header.

**Features:**
- Beautiful gradient header
- Fixed sidebar navigation
- Glass morphism effects
- Responsive design
- Dark/light theme support

**Usage:**
```typescript
import { DashboardLayout } from '@/components/DashboardLayout';

<DashboardLayout
  title="Dashboard"
  description="Welcome back!"
>
  {/* Content */}
</DashboardLayout>
```

### 2. **DashboardCard.tsx** - Statistics Card
Beautiful statistics card with trend indicators.

**Features:**
- Gradient icons
- Trend indicators
- Custom gradients
- Hover animations
- Responsive layout

**Usage:**
```typescript
import { DashboardCard } from '@/components/DashboardCard';

<DashboardCard
  title="Total Users"
  value="12,543"
  icon={<PeopleIcon />}
  trend={{ direction: 'up', percentage: 12.5 }}
  gradient={['#667eea', '#764ba2']}
/>
```

### 3. **ModernTable.tsx** - Data Table
Beautiful, responsive data table component.

**Features:**
- Custom column rendering
- Action buttons (Edit, Delete, More)
- Smooth row hover effects
- Responsive design
- Gradient header

**Usage:**
```typescript
import { ModernTable } from '@/components/ModernTable';

<ModernTable
  columns={columns}
  rows={data}
  onEdit={(row) => handleEdit(row)}
  onDelete={(row) => handleDelete(row)}
/>
```

### 4. **Dashboard.tsx** - Full Dashboard Example
Complete dashboard page showing all components working together.

**Features:**
- Statistics cards grid
- User data table
- Sample data
- Responsive layout
- Beautiful composition

## Design System

### Color Palette
- **Primary**: Beautiful gradient-based primary color
- **Secondary**: Complementary secondary color
- **Accent**: Highlight color for interactions
- **Success**: Green for positive indicators
- **Danger**: Red for destructive actions
- **Surface**: Main background color with transparency

### Typography
- **Headlines**: Bold, large font weights (700-800)
- **Body**: Regular weight (500-600)
- **Small**: Upper case with letter spacing for labels

### Spacing
- Base unit: 8px
- Consistent padding/margin using theme spacing
- Responsive adjustments for different screen sizes

### Shadows & Elevation
- Multiple shadow levels (shadows[4], [8], [12])
- Subtle shadows for depth
- Backdrop blur for glass morphism

### Animations
- Spring animations for interactive elements
- Smooth timing functions (cubic-bezier)
- Staggered animations for better UX
- GPU-accelerated transforms

## Best Practices

1. **Use semantic variants**: Choose appropriate component variants for your use case
2. **Maintain consistency**: Use theme colors throughout your app
3. **Optimize performance**: Use `useNativeDriver: true` for animations
4. **Responsive design**: Use breakpoints for mobile/tablet/desktop
5. **Accessibility**: Include proper labels and error messages
6. **Gradients**: Use theme-based gradients for consistency

## Theme Integration

All components integrate with the `useAppTheme()` hook for seamless theme switching.

```typescript
const theme = useAppTheme();
// theme.colors, theme.spacing, theme.radius, etc.
```

## Future Enhancements

- [ ] Dark mode variants
- [ ] Custom animation presets
- [ ] Component composition library
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Additional variants and states

---

**Version**: 1.0.0
**Last Updated**: March 26, 2026
**Created by**: Claudy Team
