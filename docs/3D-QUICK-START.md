# 3D Visual Effects - Quick Start Guide

## What's Been Added

New 3D visual effects for the API Hub application:

### Files Created

1. **`src/hooks/useTilt3D.ts`** - Custom React hook for 3D tilt effect
2. **`src/components/ui/Tilt3DCard.tsx`** - Pre-built 3D card component
3. **`src/components/ui/ParallaxSection.tsx`** - Parallax scrolling components
4. **`src/components/demos/3DShowcase.tsx`** - Live demo component
5. **`src/components/ui/3D-Examples.tsx`** - Usage examples
6. **`src/hooks/index.ts`** - Hooks barrel export

### Files Updated

1. **`src/lib/design-system.ts`** - Added 3D animation variants and utilities
2. **`src/lib/api-types.ts`** - Fixed TypeScript import

---

## 30-Second Integration

### Add 3D Card to Your Page

```tsx
import { Tilt3DCard } from '@/components/ui/Tilt3DCard';

<Tilt3DCard variant="glass" intensity="medium" glare>
  <h3>Your Content</h3>
  <p>Interactive 3D card</p>
</Tilt3DCard>
```

### Add Parallax Section

```tsx
import { ParallaxSection, ParallaxLayer } from '@/components/ui/ParallaxSection';

<ParallaxSection>
  <ParallaxLayer speed={0.3}>
    <div>Background - slow</div>
  </ParallaxLayer>
  <ParallaxLayer speed={0.6}>
    <div>Content - medium</div>
  </ParallaxLayer>
  <ParallaxLayer speed={1}>
    <div>Foreground - fast</div>
  </ParallaxLayer>
</ParallaxSection>
```

### View Live Demo

```tsx
import { ThreeDShowcase } from '@/components/demos/3DShowcase';

// Add to any page
<ThreeDShowcase />
```

---

## Component Props Quick Reference

### Tilt3DCard

```tsx
<Tilt3DCard
  variant="glass" | "solid" | "subtle" | "frosted"
  intensity="low" | "medium" | "high"
  glare={true}
  glareOpacity={0.15}
  maxTilt={15}          // degrees
  perspective={1000}     // pixels
  scale={1.02}          // hover scale
  speed={300}           // ms
  disabled={false}
  onClick={() => {}}
  className="custom-class"
>
  {children}
</Tilt3DCard>
```

### ParallaxLayer

```tsx
<ParallaxLayer
  speed={0.5}       // 0.3 = slow, 0.6 = medium, 1+ = fast
  depth={0}         // z-depth for 3D
  className="..."
>
  {children}
</ParallaxLayer>
```

---

## Design System Utilities

```tsx
import {
  tilt3dVariants,
  floatSubtleVariants,
  depthShadow,
  layeredShadows,
  meshGradients,
  gradientColors,
} from '@/lib/design-system';

// Depth shadow
<div style={{ boxShadow: depthShadow() }}>...</div>

// Layered shadow
<div style={{ boxShadow: layeredShadows.lg }}>...</div>

// Mesh gradient background
<div style={{ background: meshGradients.aurora }}>...</div>

// Gradient classes
<div className={`bg-gradient-to-r ${gradientColors.cosmic}`}>...</div>
```

---

## Recommended Integration Points

### 1. Dashboard Cards
Replace existing cards with Tilt3DCard:

```tsx
// Before
<div className="bg-white rounded-lg shadow p-6">
  API Stats
</div>

// After
<Tilt3DCard variant="glass" intensity="medium" glare>
  API Stats
</Tilt3DCard>
```

### 2. Hero Sections
Add parallax to hero sections:

```tsx
<ParallaxSection className="min-h-screen">
  <ParallaxLayer speed={0.3}>
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50" />
  </ParallaxLayer>
  <ParallaxLayer speed={0.6}>
    <h1>Welcome to API Hub</h1>
  </ParallaxLayer>
</ParallaxSection>
```

### 3. Feature Grids
Interactive feature cards:

```tsx
<div className="grid grid-cols-3 gap-6">
  {features.map(feature => (
    <Tilt3DCard key={feature.id} variant="glass" glare>
      <Icon />
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </Tilt3DCard>
  ))}
</div>
```

---

## Performance Tips

1. **Limit Active Cards**: Max 10-15 Tilt3DCards per viewport
2. **Disable on Mobile**: `<Tilt3DCard disabled={isMobile}>`
3. **Reduce Motion**: Respect `prefers-reduced-motion` preference
4. **Parallax Layers**: Keep to 3-5 layers maximum

---

## Browser Support

- Modern browsers with CSS `backdrop-filter`
- CSS 3D transforms
- Framer Motion compatibility
- Graceful degradation to 2D on older browsers

---

## Next Steps

1. View full documentation: `docs/3D-VISUAL-EFFECTS.md`
2. See examples: `src/components/ui/3D-Examples.tsx`
3. Try the showcase: `src/components/demos/3DShowcase.tsx`

---

## Troubleshooting

**Card not tilting?**
- Check `disabled` prop is not set
- Ensure no `pointer-events: none` on parent

**Parallax not smooth?**
- Reduce number of layers
- Add `will-change: transform`

**TypeScript errors?**
- Run `npm install` to ensure types are up to date
- Import types: `import type { Tilt3DOptions } from '@/hooks/useTilt3D'`

---

Built with React 19, Framer Motion 12, and Tailwind CSS 4.
