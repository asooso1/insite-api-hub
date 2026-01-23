# 3D Visual Effects Documentation

## Overview

This API Hub application now includes sophisticated 3D visual effects built with **React 19**, **Framer Motion**, and **Tailwind CSS 4**. These effects create depth, motion, and visual intrigue while maintaining performance and accessibility.

## Components & Hooks

### 1. useTilt3D Hook

Custom React hook that creates a 3D tilt effect based on mouse movement.

**Location:** `src/hooks/useTilt3D.ts`

#### Features
- Mouse-reactive 3D rotation
- Configurable tilt angle, perspective, and scale
- Optional glare/shine effect overlay
- Smooth transitions with customizable speed
- GPU-accelerated transforms
- TypeScript support with full type definitions

#### API

```typescript
interface Tilt3DOptions {
  maxTilt?: number;        // Maximum tilt angle (default: 15 degrees)
  perspective?: number;    // CSS perspective value (default: 1000px)
  scale?: number;          // Hover scale factor (default: 1.02)
  speed?: number;          // Transition duration (default: 300ms)
  glare?: boolean;         // Enable glare effect (default: false)
  glareOpacity?: number;   // Max glare opacity (default: 0.2)
  disabled?: boolean;      // Disable effect (default: false)
}
```

#### Usage Example

```tsx
import { useTilt3D } from '@/hooks/useTilt3D';

function MyCard() {
  const tilt = useTilt3D({
    maxTilt: 20,
    glare: true,
    glareOpacity: 0.25
  });

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      onMouseEnter={tilt.onMouseEnter}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* Glare overlay */}
      <div style={tilt.glareStyle} />

      {/* Your content */}
      <h3>Interactive Card</h3>
    </div>
  );
}
```

---

### 2. Tilt3DCard Component

Pre-built card component with 3D tilt effect and glass morphism styling.

**Location:** `src/components/ui/Tilt3DCard.tsx`

#### Features
- Wraps `useTilt3D` hook with sensible defaults
- Multiple visual variants (glass, solid, subtle, frosted)
- Three intensity presets (low, medium, high)
- Dark mode support
- Framer Motion integration for smooth entry animations
- Click handling support

#### Props

```typescript
interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'subtle' | 'frosted';
  intensity?: 'low' | 'medium' | 'high';

  // Tilt3DOptions
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  glareOpacity?: number;
  disabled?: boolean;

  onClick?: () => void;
}
```

#### Intensity Presets

| Preset | maxTilt | scale | speed |
|--------|---------|-------|-------|
| low    | 8°      | 1.01  | 400ms |
| medium | 15°     | 1.02  | 300ms |
| high   | 25°     | 1.05  | 200ms |

#### Usage Examples

**Basic Glass Card**
```tsx
<Tilt3DCard variant="glass" intensity="medium" glare>
  <h3>API Endpoint</h3>
  <p>GET /api/users</p>
</Tilt3DCard>
```

**Grid of Cards**
```tsx
<div className="grid grid-cols-3 gap-6">
  <Tilt3DCard variant="subtle" intensity="low">
    <YourContent />
  </Tilt3DCard>

  <Tilt3DCard variant="glass" intensity="medium" glare>
    <YourContent />
  </Tilt3DCard>

  <Tilt3DCard variant="frosted" intensity="high" glare glareOpacity={0.3}>
    <YourContent />
  </Tilt3DCard>
</div>
```

**Interactive Card with Click**
```tsx
<Tilt3DCard
  variant="glass"
  glare
  onClick={() => navigate('/api/details')}
>
  <div className="space-y-4">
    <h3 className="text-xl font-bold">User Management</h3>
    <p className="text-sm text-slate-600">Click to view details</p>
  </div>
</Tilt3DCard>
```

---

### 3. Parallax Components

Scroll-based parallax effects with multiple depth layers.

**Location:** `src/components/ui/ParallaxSection.tsx`

#### ParallaxSection

Container for parallax effects with scroll tracking.

```tsx
<ParallaxSection className="min-h-screen">
  <ParallaxLayer speed={0.3}>Background</ParallaxLayer>
  <ParallaxLayer speed={0.6}>Content</ParallaxLayer>
  <ParallaxLayer speed={1.2}>Foreground</ParallaxLayer>
</ParallaxSection>
```

#### ParallaxLayer

Individual layer with configurable scroll speed.

```typescript
interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;         // Speed multiplier (default: 1)
  depth?: number;         // Z-depth for 3D (default: 0)
  className?: string;
}
```

**Speed Guide:**
- `0.3` - Slow background layer
- `0.6` - Medium midground layer
- `1.0` - Normal speed (no parallax)
- `1.5+` - Fast foreground layer

#### ParallaxContainer

Pre-configured container with Background, Content, and Foreground layers.

```tsx
<ParallaxContainer>
  <ParallaxContainer.Background>
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900" />
  </ParallaxContainer.Background>

  <ParallaxContainer.Content>
    <h1>Main Content Here</h1>
  </ParallaxContainer.Content>

  <ParallaxContainer.Foreground>
    <div className="floating-elements" />
  </ParallaxContainer.Foreground>
</ParallaxContainer>
```

#### ParallaxImage

Specialized component for parallax images with optional zoom effect.

```tsx
<ParallaxImage
  src="/hero-background.jpg"
  alt="Hero Background"
  speed={0.5}
  zoom={true}
  className="h-screen"
/>
```

---

## Design System Updates

**Location:** `src/lib/design-system.ts`

### New Animation Variants

#### 3D Tilt Variants
```tsx
import { tilt3dVariants } from '@/lib/design-system';

<motion.div variants={tilt3dVariants} whileHover="hover">
  Content
</motion.div>
```

#### Float Animations
```tsx
import { floatSubtleVariants, floatIntenseVariants } from '@/lib/design-system';

// Subtle floating
<motion.div variants={floatSubtleVariants} animate="animate">
  Gently floating element
</motion.div>

// Intense floating
<motion.div variants={floatIntenseVariants} animate="animate">
  Dramatically floating element
</motion.div>
```

#### Flip Card
```tsx
import { flipCardVariants } from '@/lib/design-system';

<motion.div
  variants={flipCardVariants}
  animate={isFlipped ? "back" : "front"}
  style={{ transformStyle: 'preserve-3d' }}
>
  <Front />
  <Back />
</motion.div>
```

### Utility Functions

#### Depth Shadow Generator
```tsx
import { depthShadow } from '@/lib/design-system';

<div style={{ boxShadow: depthShadow('rgba(0, 0, 0, 0.1)', 5) }}>
  Elevated element with 5 shadow layers
</div>
```

#### Layered Shadows
```tsx
import { layeredShadows } from '@/lib/design-system';

<div className="rounded-xl" style={{ boxShadow: layeredShadows.lg }}>
  Card with realistic depth
</div>
```

#### 3D Transform Generator
```tsx
import { transform3D } from '@/lib/design-system';

<div style={{
  transform: transform3D(10, 15, 0, 20, 1.02)
  // rotateX, rotateY, rotateZ, translateZ, scale
}}>
  Custom 3D transform
</div>
```

### Gradient Utilities

#### Mesh Gradients
```tsx
import { meshGradients } from '@/lib/design-system';

<div style={{ background: meshGradients.aurora }}>
  Beautiful mesh gradient background
</div>
```

Available presets:
- `aurora` - Purple/pink aurora effect
- `ocean` - Blue ocean waves
- `sunset` - Orange/pink sunset
- `forest` - Green nature tones

#### Gradient Color Classes
```tsx
import { gradientColors } from '@/lib/design-system';

<div className={`bg-gradient-to-r ${gradientColors.cosmic}`}>
  Vibrant cosmic gradient
</div>
```

Available gradients:
- `primary`, `success`, `warning`, `error`, `info`
- `cosmic`, `fire`, `electric`, `nature`

---

## Performance Considerations

### GPU Acceleration

All 3D effects use GPU-accelerated CSS properties:
- `transform` (instead of `top/left`)
- `opacity`
- `will-change` for smooth animations

### Optimization Tips

1. **Limit Active Tilt Cards**
   - Only render 10-15 Tilt3DCards per viewport
   - Disable tilt on mobile for better performance

2. **Parallax Layers**
   - Keep parallax layers to 3-5 maximum
   - Use `will-change: transform` sparingly

3. **Conditional Rendering**
   ```tsx
   const isMobile = useMediaQuery('(max-width: 768px)');

   <Tilt3DCard disabled={isMobile}>
     Content
   </Tilt3DCard>
   ```

4. **Reduce Motion Preference**
   ```tsx
   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

   <Tilt3DCard disabled={prefersReducedMotion}>
     Content
   </Tilt3DCard>
   ```

---

## Examples & Demos

See comprehensive examples in:
- `src/components/ui/3D-Examples.tsx`

### Quick Start Example

```tsx
'use client';

import { Tilt3DCard } from '@/components/ui/Tilt3DCard';
import {
  ParallaxSection,
  ParallaxLayer
} from '@/components/ui/ParallaxSection';

export default function DashboardPage() {
  return (
    <ParallaxSection className="min-h-screen">
      {/* Background */}
      <ParallaxLayer speed={0.3} className="absolute inset-0">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50" />
      </ParallaxLayer>

      {/* Content */}
      <ParallaxLayer speed={0.6} className="container mx-auto py-24">
        <h1 className="text-5xl font-bold mb-12">API Dashboard</h1>

        <div className="grid grid-cols-3 gap-6">
          {apis.map(api => (
            <Tilt3DCard
              key={api.id}
              variant="glass"
              intensity="medium"
              glare
            >
              <h3>{api.name}</h3>
              <p>{api.description}</p>
            </Tilt3DCard>
          ))}
        </div>
      </ParallaxLayer>

      {/* Decorative foreground */}
      <ParallaxLayer speed={1} className="pointer-events-none">
        <div className="absolute top-40 right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      </ParallaxLayer>
    </ParallaxSection>
  );
}
```

---

## Dark Mode Support

All components fully support dark mode with Tailwind's `dark:` prefix:

```tsx
<Tilt3DCard variant="glass">
  {/* Automatically adapts:
      - Light: bg-white/70 border-white/20
      - Dark: bg-slate-900/70 border-white/10
  */}
  <h3 className="text-slate-900 dark:text-white">
    Adapts to theme
  </h3>
</Tilt3DCard>
```

---

## Browser Support

These effects work on modern browsers with:
- CSS `backdrop-filter` support
- CSS 3D transforms
- Framer Motion compatibility

Graceful degradation:
- Falls back to 2D on unsupported browsers
- Respects `prefers-reduced-motion`
- Mobile-optimized with `disabled` prop

---

## Migration from Existing Code

Replace existing cards:

**Before:**
```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg">
  Content
</div>
```

**After:**
```tsx
<Tilt3DCard variant="glass" intensity="medium" glare>
  Content
</Tilt3DCard>
```

---

## Troubleshooting

### Card not tilting
- Ensure mouse events are not blocked by `pointer-events: none`
- Check if `disabled={true}` is set
- Verify z-index stacking context

### Parallax not smooth
- Add `will-change: transform` to layers
- Reduce number of parallax layers
- Check for conflicting `overflow: hidden` on parents

### TypeScript errors
- Import types: `import type { Tilt3DOptions } from '@/hooks/useTilt3D'`
- Ensure React 19 type definitions are installed

---

## Future Enhancements

Potential additions:
- [ ] 3D card carousel
- [ ] Magnetic cursor follow effect
- [ ] Depth-of-field blur based on scroll
- [ ] Interactive 3D mesh backgrounds
- [ ] Gesture support for mobile (pinch, rotate)

---

## Credits

Built with:
- **React 19** - Component architecture
- **Framer Motion 12** - Animation engine
- **Tailwind CSS 4** - Styling system
- **TypeScript 5** - Type safety

Inspired by:
- Linear.app's interface design
- Apple's spatial computing
- Modern UI/UX trends
