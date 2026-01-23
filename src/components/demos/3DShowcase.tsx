'use client';

/**
 * 3D Visual Effects Showcase
 *
 * Drop this component anywhere in your app to see the 3D effects in action
 *
 * Usage:
 * import { ThreeDShowcase } from '@/components/demos/3DShowcase';
 *
 * <ThreeDShowcase />
 */

import { Tilt3DCard } from '@/components/ui/Tilt3DCard';
import { ParallaxSection, ParallaxLayer } from '@/components/ui/ParallaxSection';
import { Activity, Zap, Shield, Code, Database, Cloud } from 'lucide-react';

export function ThreeDShowcase() {
  const features = [
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Track API performance metrics in real-time',
      gradient: 'from-blue-500 to-cyan-500',
      stats: '99.9% uptime',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized endpoints with sub-100ms response',
      gradient: 'from-yellow-500 to-orange-500',
      stats: '< 50ms avg',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'OAuth 2.0, JWT, and API key authentication',
      gradient: 'from-emerald-500 to-teal-500',
      stats: 'SOC 2 certified',
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'Comprehensive docs and SDK libraries',
      gradient: 'from-purple-500 to-pink-500',
      stats: '15+ languages',
    },
    {
      icon: Database,
      title: 'Scalable Storage',
      description: 'Distributed database with automatic sharding',
      gradient: 'from-indigo-500 to-purple-500',
      stats: '10TB+ capacity',
    },
    {
      icon: Cloud,
      title: 'Global CDN',
      description: 'Edge locations in 50+ countries worldwide',
      gradient: 'from-rose-500 to-pink-500',
      stats: '50+ regions',
    },
  ];

  return (
    <ParallaxSection className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background layer */}
      <ParallaxLayer speed={0.2} className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/5 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </ParallaxLayer>

      {/* Content layer */}
      <ParallaxLayer speed={0.5} className="relative z-10">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              3D Visual Effects
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                In Action
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Interactive cards with mouse-reactive 3D tilt, glare effects, and smooth parallax scrolling.
              Hover over the cards below to experience the effect.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const intensity = index % 3 === 0 ? 'low' : index % 3 === 1 ? 'medium' : 'high';
              const variant = index % 4 === 0 ? 'glass' : index % 4 === 1 ? 'frosted' : index % 4 === 2 ? 'subtle' : 'glass';

              return (
                <Tilt3DCard
                  key={feature.title}
                  variant={variant}
                  intensity={intensity}
                  glare
                  glareOpacity={0.15}
                  className="h-full"
                >
                  <div className="space-y-4">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}
                      style={{ transform: 'translateZ(30px)' }}
                    >
                      <Icon className="w-full h-full text-white" strokeWidth={2} />
                    </div>

                    {/* Title */}
                    <h3
                      className="text-xl font-bold text-slate-900 dark:text-white"
                      style={{ transform: 'translateZ(20px)' }}
                    >
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                      style={{ transform: 'translateZ(15px)' }}
                    >
                      {feature.description}
                    </p>

                    {/* Stats badge */}
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      style={{ transform: 'translateZ(10px)' }}
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {feature.stats}
                      </span>
                    </div>
                  </div>
                </Tilt3DCard>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Built with React 19, Framer Motion, and Tailwind CSS 4
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                GPU Accelerated
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                TypeScript
              </div>
              <div className="px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs font-semibold">
                Accessible
              </div>
            </div>
          </div>
        </div>
      </ParallaxLayer>

      {/* Foreground decorative elements */}
      <ParallaxLayer speed={0.8} className="pointer-events-none absolute inset-0">
        <div className="absolute top-32 right-10 sm:right-32 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-32 left-10 sm:left-32 w-40 h-40 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl" />
      </ParallaxLayer>
    </ParallaxSection>
  );
}

/**
 * Compact showcase for dashboard integration
 */
export function ThreeDShowcaseCompact() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Interactive 3D Cards
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Hover over cards to see the effect
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tilt3DCard variant="glass" intensity="low" glare>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Low Intensity
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Subtle tilt effect (8°)
            </p>
          </div>
        </Tilt3DCard>

        <Tilt3DCard variant="frosted" intensity="medium" glare>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Medium Intensity
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Balanced effect (15°)
            </p>
          </div>
        </Tilt3DCard>

        <Tilt3DCard variant="glass" intensity="high" glare glareOpacity={0.25}>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              High Intensity
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Dramatic effect (25°)
            </p>
          </div>
        </Tilt3DCard>
      </div>
    </div>
  );
}
