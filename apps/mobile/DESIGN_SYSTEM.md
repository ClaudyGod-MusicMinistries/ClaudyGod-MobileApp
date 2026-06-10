# ClaudyGod Design System - World-Class UI/UX Guide

## Overview

This document outlines the modernized design system for ClaudyGod, inspired by premium streaming apps like Spotify, YouTube, and Apple Music. The system emphasizes **visual hierarchy, smooth animations, professional polish, and consistent spacing**.

---

## 📐 Design Tokens

All design tokens are defined in `theme/designSystem.ts` for consistency:

### Spacing Scale (8px base unit)
```
xs: 4px    | sm: 8px    | md: 12px   | lg: 16px
xl: 24px   | 2xl: 32px  | 3xl: 48px
```

### Border Radius
```
xs: 4px    | sm: 8px    | md: 12px   | lg: 16px
xl: 20px   | 2xl: 24px  | full: 999px (pills)
```

### Shadows (Professional depth)
```
none → xs → sm → md → lg → xl → 2xl
```
Each level increases elevation and soft-shadow blur for premium look.

### Animation Timing
```
fast: 150ms        | base: 250ms (default)
moderate: 350ms    | slow: 500ms
```

### Color Palette (Dark Mode Optimized)
- **Primary**: #1ED760 (Spotify green)
- **Secondary**: #FF3B30 (Alert red)
- **Accent**: #22D3EE (Cyan)
- **Surface**: #0F1118 (Card background)
- **Canvas**: #05060D (App background)

---

## 🎨 Component Hierarchy

### 1. Premium Cards (New Component Library)

#### Simple Card
Basic card with subtle borders and shadows.
```tsx
import { SimpleCard } from '../components/ui/PremiumCard';

<SimpleCard>
  <View>Your content here</View>
</SimpleCard>
```

#### Elevated Card
Higher elevation with stronger shadows - for featured content.
```tsx
import { ElevatedCard } from '../components/ui/PremiumCard';

<ElevatedCard onPress={() => console.log('Pressed')}>
  <View>Featured content</View>
</ElevatedCard>
```

#### Glass Card
Modern frosted-glass effect with backdrop blur.
```tsx
import { GlassCard } from '../components/ui/PremiumCard';

<GlassCard>
  <View>Overlay content</View>
</GlassCard>
```

---

### 2. Buttons (Enhanced)

Buttons now feature smooth scale animations and dynamic shadows:

```tsx
import { AppButton } from '../components/ui/AppButton';

// Primary (gradient, glow effect)
<AppButton 
  title="Start Listening"
  variant="primary"
  size="lg"
  fullWidth
/>

// Secondary (subtle background)
<AppButton 
  title="Browse All"
  variant="secondary"
  size="md"
/>

// Outline (bordered)
<AppButton 
  title="Learn More"
  variant="outline"
/>

// Ghost (text only)
<AppButton 
  title="Skip"
  variant="ghost"
/>
```

---

### 3. Featured Cards

Displays hero/featured content with:
- Animated play button
- Dynamic gradient overlay
- Badge support
- Smooth scale on press

```tsx
import { FeaturedCard } from '../components/ui/FeaturedCard';

<FeaturedCard
  imageUrl="https://..."
  title="New Release"
  subtitle="By Artist Name"
  badge="NEW"
  onPress={() => navigate('player')}
  height={280}
/>
```

**Features:**
- Play button grows on press
- Shadow increases with interaction
- 3-layer gradient overlay
- Professional badge styling

---

### 4. Content Cards (Modern Grid/Rail)

Reusable cards for music, videos, and playlists:

```tsx
import { ModernContentCard } from '../components/ui/ModernContentCard';

<ModernContentCard
  imageUrl="https://..."
  title="Song Title"
  subtitle="Artist Name"
  author="Creator"
  plays={15000}
  likes={2500}
  duration="3:45"
  onPress={() => play()}
  onPlayPress={() => togglePlay()}
  size="md"  // sm | md | lg
/>
```

**Sizes:**
- `sm`: 96x96px - compact lists
- `md`: 124x124px - standard grids (default)
- `lg`: 160x160px - featured rails

---

### 5. Section Headers (Improved)

Better visual hierarchy with improved typography and action buttons:

```tsx
import { SectionHeader } from '../components/ui/SectionHeader';

<SectionHeader
  eyebrow="FEATURED"
  title="Now Trending"
  actionLabel="View All"
  onAction={() => navigate('trending')}
/>
```

**Styling:**
- Eyebrow: Uppercase, letter-spacing 1.2px
- Title: Larger, tighter letter-spacing (-0.3px)
- Action button: Animated scale on press, soft shadow

---

## 🎬 Animation Specifications

### Micro-interactions

All interactive elements follow this pattern:

1. **Press In** (150ms):
   - Scale to 0.98
   - Shadow increases
   - Opacity slightly decreases

2. **Press Out** (250ms):
   - Scale back to 1
   - Shadow normalizes
   - Opacity returns to 1

### Timing Standards
```
Fast interactions:     150ms  (buttons, small elements)
Standard:              250ms  (cards, modals)
Moderate:              350ms  (page transitions)
Slow:                  500ms  (large animations)
```

### Easing
All animations use `ease-out` for natural feel:
- Press in: Quick response
- Press out: Smooth return

---

## 📏 Layout Best Practices

### Spacing Guidelines

1. **Screen Margins**: 16px (lg) on all sides
2. **Section Gaps**: 20-24px between sections
3. **Element Gaps**: 12-16px within sections
4. **Card Padding**: 16px (md) for standard content

### Content Rail Structure
```
Screen Margin (16px)
├─ Section Header (with 20px bottom margin)
├─ Horizontal FlatList
│  ├─ Item spacing: 12px
│  └─ First/Last item margins: 16px
└─ Bottom spacing: 24px
```

### Card Grid Structure
```
Screen Margin (16px)
├─ 2-column grid (or 3 on tablet)
├─ Column gap: 12px
├─ Row gap: 16px
└─ No extra margins on grid items
```

---

## 🎨 Gradient Reference

### Hero Gradients (Linear, 45°)
```
Default:  #B794F6 → #7C3AED (purple)
Warm:     #F59E0B → #DC2626 (red/orange)
Cool:     #06B6D4 → #3B82F6 (cyan/blue)
Vibrant:  #EC4899 → #8B5CF6 (pink/purple)
```

### Overlay Gradients
```
Light overlay:  rgba(255,255,255,0.15) → transparent
Dark overlay:   transparent → rgba(0,0,0,0.3)
Card subtle:    rgba(183,148,246,0.05) → rgba(124,58,237,0.03)
```

---

## 🌙 Dark Mode (Primary)

All components are dark-mode optimized:

- **Background**: #05060D
- **Surface**: #0F1118 (cards)
- **Elevated**: #1B132A (modals, overlays)
- **Text**: #F7F2FF (white)
- **Text Secondary**: #C6BEDB (muted)
- **Border**: #2B223D (subtle)

Light mode colors are maintained but dark is primary design target.

---

## ✨ Component Usage Patterns

### Hero Section (Home Screen)
```tsx
<View style={{ marginBottom: 24 }}>
  <FeaturedCard
    imageUrl={featured.image}
    title={featured.title}
    subtitle={featured.artist}
    onPress={handlePlay}
  />
</View>
```

### Content Rails (Home Screen)
```tsx
<View style={{ marginBottom: 24 }}>
  <SectionHeader
    title="For You"
    actionLabel="See All"
    onAction={navigateToPlaylist}
  />
  <FlatList
    data={items}
    horizontal
    scrollEnabled
    renderItem={({ item }) => (
      <ModernContentCard {...item} size="md" />
    )}
    contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
  />
</View>
```

### Info Sections (Reusable)
```tsx
<ElevatedCard padding="lg">
  <CustomText variant="heading">Section Title</CustomText>
  <CustomText variant="body" style={{ marginTop: 12 }}>
    Description text here
  </CustomText>
</ElevatedCard>
```

---

## 🚀 Performance Optimization

### Animation Performance
- Use `useNativeDriver: true` for all animations
- Keep shadow calculations minimal
- Batch animations with `Animated.parallel()`
- Use `optimizedAnimations: true` on heavy lists

### Image Loading
- Always provide fallback `backgroundColor` on Image
- Use `resizeMode="cover"` for consistent aspect ratios
- Cache images with appropriate resolution

### Card Rendering
```tsx
// Use FlatList with proper optimization
<FlatList
  data={items}
  renderItem={/* ... */}
  keyExtractor={item => item.id}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
/>
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 600px (default)
- **Tablet**: 600-1024px
- **Desktop**: > 1024px

### Grid Adjustments
```
Mobile:   2 columns (12px gap)
Tablet:   3 columns (16px gap)
Desktop:  4-5 columns (20px gap)
```

---

## 🎯 Implementation Checklist

When styling new screens:

- [ ] Use `designSystem` tokens for spacing/radius/shadows
- [ ] Apply proper margin (16px) to screen edges
- [ ] Use `SectionHeader` for section titles
- [ ] Wrap content in appropriate card variants
- [ ] Add animations to interactive elements
- [ ] Test on dark mode (primary)
- [ ] Verify touch targets are >= 48px
- [ ] Check contrast ratios (WCAG AA minimum)
- [ ] Test animations on lower-end devices

---

## 🔧 Design System Customization

To modify design tokens:

1. **Colors**: Update `constants/color.ts`
2. **Spacing/Radius**: Update `tailwind.config.js`
3. **Shadows/Animations**: Update `theme/designSystem.ts`
4. **Typography**: Update `components/CustomText.tsx`

Always maintain backwards-compatibility by adding new tokens rather than replacing existing ones.

---

## 📚 Reference Components

### Full Featured Experience
- `FeaturedCard`: Hero section
- `ModernContentCard`: Content grid/rail
- `SectionHeader`: Section titles
- `ElevatedCard`: Info sections
- `AppButton`: All CTAs

### Usage Example (Complete Screen)
```tsx
export default function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.canvas }}>
      <View style={{ paddingHorizontal: 16 }}>
        {/* Hero Section */}
        <FeaturedCard {...featuredData} />

        {/* Content Section */}
        <SectionHeader title="For You" />
        <FlatList
          data={forYouItems}
          horizontal
          renderItem={({ item }) => <ModernContentCard {...item} />}
        />

        {/* Call-to-Action */}
        <ElevatedCard style={{ marginTop: 24 }}>
          <AppButton title="Explore More" variant="primary" fullWidth />
        </ElevatedCard>
      </View>
    </ScrollView>
  );
}
```

---

## 📞 Support & Questions

For design system updates or new component additions:
1. Update `theme/designSystem.ts` first
2. Create component in `components/ui/`
3. Document usage in this file
4. Apply to screens incrementally

---

**Last Updated**: 2026-06-10
**Version**: 1.0 - Core Design System Release
