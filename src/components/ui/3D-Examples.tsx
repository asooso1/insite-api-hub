'use client';

/**
 * 3D Visual Effects Examples
 *
 * This file demonstrates how to use the new 3D components:
 * - Tilt3DCard
 * - ParallaxSection
 * - ParallaxLayer
 * - ParallaxContainer
 *
 * Usage examples for reference - not meant to be imported directly
 */

import { Tilt3DCard } from './Tilt3DCard';
import {
  ParallaxSection,
  ParallaxLayer,
  ParallaxContainer,
  ParallaxImage,
} from './ParallaxSection';

// ============================================
// TILT 3D CARD EXAMPLES
// ============================================

export function Tilt3DCardExample1() {
  return (
    <Tilt3DCard variant="glass" intensity="medium" glare>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        API Endpoint
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Interactive 3D card with glare effect
      </p>
    </Tilt3DCard>
  );
}

export function Tilt3DCardExample2() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Low intensity */}
      <Tilt3DCard variant="subtle" intensity="low">
        <div className="space-y-2">
          <div className="w-12 h-12 bg-indigo-500 rounded-lg" />
          <h4 className="font-semibold">Subtle Effect</h4>
          <p className="text-sm text-slate-600">Low intensity tilt</p>
        </div>
      </Tilt3DCard>

      {/* Medium intensity with glare */}
      <Tilt3DCard variant="glass" intensity="medium" glare>
        <div className="space-y-2">
          <div className="w-12 h-12 bg-purple-500 rounded-lg" />
          <h4 className="font-semibold">Glass Effect</h4>
          <p className="text-sm text-slate-600">Medium tilt + glare</p>
        </div>
      </Tilt3DCard>

      {/* High intensity */}
      <Tilt3DCard variant="frosted" intensity="high" glare glareOpacity={0.3}>
        <div className="space-y-2">
          <div className="w-12 h-12 bg-pink-500 rounded-lg" />
          <h4 className="font-semibold">Intense Effect</h4>
          <p className="text-sm text-slate-600">High intensity + strong glare</p>
        </div>
      </Tilt3DCard>
    </div>
  );
}

export function Tilt3DCardExample3() {
  return (
    <Tilt3DCard
      variant="glass"
      intensity="medium"
      glare
      className="max-w-md"
      onClick={() => console.log('Card clicked!')}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              User API
            </h3>
            <p className="text-xs text-slate-500">GET /api/users</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Success Rate</span>
            <span className="font-semibold text-emerald-600">99.9%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-[99.9%] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
          </div>
        </div>
      </div>
    </Tilt3DCard>
  );
}

// ============================================
// PARALLAX SECTION EXAMPLES
// ============================================

export function ParallaxExample1() {
  return (
    <ParallaxSection className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <ParallaxLayer speed={0.3}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-purple-100/50" />
      </ParallaxLayer>

      <ParallaxLayer speed={0.6} className="container mx-auto px-4 py-24">
        <h1 className="text-6xl font-bold text-slate-900">
          Parallax Scrolling
        </h1>
        <p className="text-xl text-slate-600 mt-4">
          Multiple layers moving at different speeds
        </p>
      </ParallaxLayer>

      <ParallaxLayer speed={1.2} className="absolute bottom-10 right-10">
        <div className="w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
      </ParallaxLayer>
    </ParallaxSection>
  );
}

export function ParallaxExample2() {
  return (
    <ParallaxContainer className="bg-slate-900">
      <ParallaxContainer.Background>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 opacity-50" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </ParallaxContainer.Background>

      <ParallaxContainer.Content>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            API Hub Dashboard
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Manage and monitor your APIs with beautiful 3D interfaces
          </p>
        </div>
      </ParallaxContainer.Content>

      <ParallaxContainer.Foreground>
        <div className="absolute top-20 left-10 w-24 h-24 bg-indigo-500/30 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl" />
      </ParallaxContainer.Foreground>
    </ParallaxContainer>
  );
}

export function ParallaxImageExample() {
  return (
    <div className="space-y-0">
      <ParallaxImage
        src="/hero-bg.jpg"
        alt="Hero Background"
        speed={0.5}
        zoom
        className="h-screen"
      />
      <div className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold">Content Section</h2>
      </div>
    </div>
  );
}

// ============================================
// COMBINED EXAMPLE
// ============================================

export function Combined3DExample() {
  return (
    <ParallaxSection className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Background layer */}
      <ParallaxLayer speed={0.2} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 dark:from-indigo-950/50 dark:to-purple-950/50" />
      </ParallaxLayer>

      {/* Content layer */}
      <ParallaxLayer speed={0.5} className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-12 text-center">
            3D Visual Effects Gallery
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Tilt3DCard variant="glass" intensity="low" glare>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Authentication
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  OAuth 2.0 & JWT tokens
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard variant="frosted" intensity="medium" glare>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Rate Limiting
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Advanced throttling
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard variant="glass" intensity="high" glare glareOpacity={0.25}>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Analytics
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Real-time monitoring
                </p>
              </div>
            </Tilt3DCard>
          </div>
        </div>
      </ParallaxLayer>

      {/* Foreground layer with decorative elements */}
      <ParallaxLayer speed={1} className="pointer-events-none">
        <div className="absolute top-40 right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </ParallaxLayer>
    </ParallaxSection>
  );
}

// ============================================
// USAGE NOTES
// ============================================

/*

## Basic Tilt3DCard Usage:

```tsx
import { Tilt3DCard } from '@/components/ui/Tilt3DCard';

<Tilt3DCard variant="glass" intensity="medium" glare>
  <YourContent />
</Tilt3DCard>
```

## Parallax Scrolling:

```tsx
import { ParallaxSection, ParallaxLayer } from '@/components/ui/ParallaxSection';

<ParallaxSection>
  <ParallaxLayer speed={0.3}>
    <BackgroundContent />
  </ParallaxLayer>
  <ParallaxLayer speed={0.6}>
    <MainContent />
  </ParallaxLayer>
  <ParallaxLayer speed={1}>
    <ForegroundContent />
  </ParallaxLayer>
</ParallaxSection>
```

## Advanced Custom Hook:

```tsx
import { useTilt3D } from '@/hooks/useTilt3D';

const tilt = useTilt3D({ maxTilt: 20, glare: true });

<div ref={tilt.ref} style={tilt.style} {...tilt}>
  <div style={tilt.glareStyle} />
  <YourContent />
</div>
```

## Design System Utilities:

```tsx
import {
  tilt3dVariants,
  floatSubtleVariants,
  depthShadow,
  meshGradients,
  gradientColors
} from '@/lib/design-system';

// Use with Framer Motion
<motion.div variants={tilt3dVariants} whileHover="hover">
  Content
</motion.div>

// Apply depth shadows
<div style={{ boxShadow: depthShadow('rgba(0,0,0,0.1)', 5) }}>
  Elevated content
</div>

// Mesh gradients
<div style={{ background: meshGradients.aurora }}>
  Beautiful background
</div>
```

*/
