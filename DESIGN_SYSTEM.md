# 🎨 ClaudyGod Design System Reference

## Color Palette

### Base Colors
```javascript
const COLORS = {
  background: '#0A0612',          // Deep dark background
  surface: 'rgba(26,20,47,0.50)', // Light surface overlay
  surfaceAlt: 'rgba(38,33,47,0.70)', // Darker surface
  border: 'rgba(167,139,250,0.15)', // Subtle borders
  textPrimary: '#F5F3FF',         // Off-white text
  textSecondary: 'rgba(184,180,212,0.70)', // Muted text
  accent: '#A78BFA',              // Purple accent
  success: '#10B981',             // Green success
  warning: '#F59E0B',             // Amber warning
  danger: '#EF4444',              // Red danger
};
```

### Usage Rules
- **Background**: Page backgrounds, full-screen fills
- **Surface**: Card backgrounds, modals, containers
- **Border**: Card borders, dividers, subtle lines
- **Text Primary**: Main content text, headers
- **Text Secondary**: Subtitles, muted info
- **Accent**: Buttons, highlights, important CTAs
- **Success**: Success states, positive metrics ✓
- **Warning**: Warnings, caution states ⚠️
- **Danger**: Errors, critical alerts ❌

---

## Typography Scale

### Font Sizes & Usage
```
Hero Title      36px bold      - Page headers
Section Header  28px bold      - Major sections
Subsection     16px bold      - Card titles
Body Text      13px regular   - Main content
Caption        12px semi-bold - Labels, stats
Small Label    11px bold      - Tags, badges
```

### Font Weights
- **Bold** (700): Headers, emphasis
- **Semi-bold** (600): Labels, captions
- **Regular** (400): Body content
- **Light** (300): Muted text

---

## Spacing System

### Standard Spaces
```
16px   - Container padding, card margins
12px   - Component gaps, item spacing
8px    - Small gaps, button padding
24px   - Section margins, major breaks
32px   - Large section breaks
```

### Layout Rules
- Use multiples of 4px for all spacing
- 16px padding for main containers
- 12px gap within component groups
- 24px between major sections

---

## Border Radius Scale

```
16px   - Large containers, modals, cards
14px   - Medium cards, input fields
12px   - Small components, badges
8px    - Icons, avatar images
4px    - Tiny UI elements
```

---

## Component Specs

### Metric Cards
```
Width:           Full width (flex: 1)
Height:          140px minimum
Padding:         16px
Border Radius:   14px
Background:      surface
Border:          1px solid border color
Gap (content):   12px

Icon Size:       28px
Label Font:      12px semi-bold, textSecondary
Value Font:      24px bold, textPrimary
Trend Font:      12px, success/danger
```

### Insight Cards
```
Width:           Full width
Height:          Auto (min 80px)
Padding:         16px
Border Radius:   14px
Left Border:     4px colored (type-specific)
Background:      surface with 10% opacity overlay

Colors by Type:
- Warning:       danger (#EF4444)
- Opportunity:   success (#10B981)
- Achievement:   warning (#F59E0B)
- Recommendation: accent (#A78BFA)

Icon Size:       20px
Title Font:      14px bold, textPrimary
Description:     12px regular, textSecondary
CTA Font:        12px semi-bold, accent
```

### Content Cards (SmartContentRail)
```
Sizes:
- sm  (Small):    120×120px
- md  (Medium):   160×160px
- lg  (Large):    200×200px

Components:
- Image:          Full size, border-radius 12px
- Gradient:       Transparent → rgba(10,6,18,0.8)
- Play Button:    Center, 48px diameter, accent
- Stats Row:      Bottom, 8px padding, gap 8px
- Badge:          Top-right, 24px diameter

Press Animation:
- Scale:          0.95 (normal to pressed)
- Duration:       140ms
- Type:           Spring

Typography:
- Title:          13px bold, textPrimary
- Author:         11px regular, textSecondary
- Stats:          10px semi-bold, textSecondary
```

### Buttons

#### Primary Button
```
Background:      accent (#A78BFA)
Text Color:      background (dark)
Height:          44px
Border Radius:   14px
Font:            14px semi-bold
Padding:         12px 20px

Press State:
- Scale:         0.97 (slight press)
- Opacity:       0.9

Disabled:
- Opacity:       0.5
```

#### Secondary Button
```
Background:      surface
Border:          1px solid border
Text Color:      accent
Height:          44px
Border Radius:   14px
Font:            14px semi-bold

Press State:
- Background:    surfaceAlt
- Scale:         0.97
```

#### Ghost Button
```
Background:      transparent
Text Color:      accent
Border:          None
Height:          40px
Font:            13px semi-bold

Press State:
- Background:    rgba(167,139,250,0.1)
- Scale:         0.97
```

---

## Animations & Transitions

### Spring Physics (Preferred)
```javascript
// Press Animation
const springConfig = {
  tension: 300,    // Responsiveness
  friction: 10,    // Bounce damping
  speed: 12,
  bounciness: 8
};

// Press Scale: 0.95 (slight press feedback)
// Fade In: Duration 200ms, delays staggered (0, 80, 120, 160, 200ms)
```

### Best Practices
- Always use spring animations (not linear easing)
- Scale for press feedback: 0.95-0.97
- Stagger animations in lists for flow
- Keep animations <350ms for responsiveness
- Use GPU-accelerated transforms only (opacity, transform)

---

## Icons (Material Icons)

### Icon Sizes
```
Large:   32px    - Primary icons in cards
Medium:  24px    - Standard icon use
Small:   20px    - Labels, captions
Tiny:    16px    - Badges, tags
```

### Icon Names (Examples)
```
Music Navigation:
- headphones → Listening/Hours
- star → Favorites/Likes
- trending-up → Trending
- new-releases → NEW badge

User Actions:
- play-arrow → Play content
- pause → Pause content
- skip-next → Skip
- thumb-up → Like
- share → Share
- add → Add/Create

Navigation:
- home → Home tab
- dashboard → Dashboard tab
- video-library → Videos tab
- live-tv → Live tab
- library → Library tab
- menu → More options

Settings:
- settings → Settings
- bell → Notifications
- lock → Premium/Restrictions
- account-circle → Profile
- logout → Logout
- arrow-forward → Next/CTA
```

---

## Responsive Design Rules

### Safe Areas
```
Padding:         16px left/right on all screens
Max Width:       Full width minus 32px padding
Minimum Touch:   44×44px for all interactive elements
```

### Text Responsiveness
```
Hero (36px):     Full width, may wrap
Section (28px):  Full width, may wrap
Body (13px):     Full width, 2-3 lines max
```

### Image Handling
```
Use aspectRatio: 1 for square images
Use resizeMode: 'cover' for fills
Always provide placeholder color
Lazy load images when possible
```

---

## Dark Theme Implementation

### Text Contrast (WCAG AA Compliant)
- Primary text on dark background: ✓ 13:1 ratio
- Secondary text on dark background: ✓ 7:1 ratio
- Accent on surface: ✓ 6:1 ratio

### Layering (Depth Effect)
```
Level 1: #0A0612    - Darkest (background)
Level 2: 20% opacity - Slightly elevated
Level 3: 50% opacity - Cards, surfaces
Level 4: 70% opacity - Highlighted surfaces
```

### No Pure White
```
Instead of #FFFFFF  use #F5F3FF (warm white)
Reduces eye strain on dark backgrounds
More sophisticated feel
```

---

## State Indicators

### Loading States
- Skeleton loaders with shimmer effect
- Opacity 0.6 for disabled states
- Subtle animation on interactive elements

### Success States
- Green checkmark with success background
- Optional toast notification
- Brief animation on completion

### Error States
- Red left border on affected card
- Clear error message below field
- Suggestion for recovery

### Empty States
- Clear icon indicating type
- Friendly message
- CTA to create/add content

---

## Component Usage Examples

### Using COLORS in Components
```typescript
// Always define at top of file
const COLORS = {
  background: '#0A0612',
  surface: 'rgba(26,20,47,0.50)',
  // ... rest of colors
};

// Use in styles
<View style={{ backgroundColor: COLORS.surface }}>
  <Text style={{ color: COLORS.textPrimary }}>Hello</Text>
</View>

// Use in gradients
<LinearGradient
  colors={[COLORS.accent, COLORS.background] as const}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  {/* content */}
</LinearGradient>
```

### Using Typography
```typescript
// Header
<Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary }}>
  Dashboard
</Text>

// Body text
<Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
  Your content here
</Text>

// Caption/Label
<Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textSecondary }}>
  TRENDING
</Text>
```

### Using Spacing
```typescript
// Container
<View style={{ padding: 16, gap: 12 }}>
  {/* components with 12px gap */}
</View>

// Section break
<View style={{ marginVertical: 24 }} />

// Items in list
<View style={{ gap: 12 }}>
  {items.map(item => <Item key={item.id} />)}
</View>
```

---

## Quick Reference Checklist

When building any new screen, use this checklist:

- [ ] Color palette matches (COLORS object)
- [ ] Typography follows scale (36/28/16/13/12/11px)
- [ ] Spacing uses multiples of 4 (8/12/16/24/32px)
- [ ] Border radius matches hierarchy (16/14/12/8px)
- [ ] Interactive elements are 44×44px minimum
- [ ] Text has proper contrast (WCAG AA)
- [ ] Animations use spring physics
- [ ] Press scales to 0.95-0.97
- [ ] All colors use COLORS const
- [ ] All fonts use proper weights
- [ ] Dark background with warm white text
- [ ] Icons from Material Icons library
- [ ] Responsive padding (16px standard)

---

## Implementation Notes

1. **Always import COLORS** at top of component files
2. **Use `as const`** when passing color arrays to LinearGradient
3. **Define animation configs** at component level, not global
4. **Use Animated.View** for press interactions (not regular View)
5. **Follow spring config** for consistent feel across app
6. **Test on dark backgrounds** - colors may look different
7. **Import only needed icons** from MaterialIcons to reduce bundle

---

**This design system ensures consistency, professionalism, and scalability across the entire ClaudyGod app.**
