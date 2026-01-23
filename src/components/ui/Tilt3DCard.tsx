'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTilt3D, Tilt3DOptions } from '@/hooks/useTilt3D';
import { cn } from '@/lib/utils';

export interface Tilt3DCardProps extends Tilt3DOptions {
  children: ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'subtle' | 'frosted';
  intensity?: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

/**
 * A 3D tilt card component with glass morphism styling
 *
 * Features:
 * - Mouse-reactive 3D tilt effect
 * - Optional glare overlay
 * - Multiple glass variants
 * - Configurable intensity levels
 * - Dark mode support
 * - Framer Motion integration
 *
 * @example
 * ```tsx
 * <Tilt3DCard variant="glass" intensity="medium" glare>
 *   <h3>Amazing Card</h3>
 *   <p>Content here</p>
 * </Tilt3DCard>
 * ```
 */
export const Tilt3DCard = forwardRef<HTMLDivElement, Tilt3DCardProps>(
  (
    {
      children,
      className,
      variant = 'glass',
      intensity = 'medium',
      maxTilt,
      perspective,
      scale,
      speed,
      glare = false,
      glareOpacity,
      disabled = false,
      onClick,
    },
    forwardedRef
  ) => {
    // Intensity presets
    const intensityPresets = {
      low: { maxTilt: 8, scale: 1.01, speed: 400 },
      medium: { maxTilt: 15, scale: 1.02, speed: 300 },
      high: { maxTilt: 25, scale: 1.05, speed: 200 },
    };

    const preset = intensityPresets[intensity];

    const tilt = useTilt3D({
      maxTilt: maxTilt ?? preset.maxTilt,
      perspective: perspective ?? 1000,
      scale: scale ?? preset.scale,
      speed: speed ?? preset.speed,
      glare,
      glareOpacity: glareOpacity ?? 0.15,
      disabled,
    });

    // Variant styles
    const variants = {
      glass: cn(
        'bg-white/70 dark:bg-slate-900/70',
        'backdrop-blur-xl',
        'border border-white/20 dark:border-white/10',
        'shadow-lg shadow-slate-200/20 dark:shadow-black/20'
      ),
      solid: cn(
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-700',
        'shadow-md dark:shadow-black/40'
      ),
      subtle: cn(
        'bg-white/40 dark:bg-slate-900/40',
        'backdrop-blur-md',
        'border border-white/15 dark:border-white/5'
      ),
      frosted: cn(
        'bg-white/85 dark:bg-slate-900/85',
        'backdrop-blur-2xl saturate-150',
        'border border-white/30 dark:border-white/20'
      ),
    };

    return (
      <motion.div
        ref={(node) => {
          // Handle both refs
          (tilt.ref as any).current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        style={tilt.style}
        onMouseEnter={tilt.onMouseEnter}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'relative rounded-2xl p-6',
          'cursor-pointer select-none',
          'transition-colors duration-200',
          variants[variant],
          disabled && 'pointer-events-none opacity-50',
          className
        )}
      >
        {/* Content */}
        <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
          {children}
        </div>

        {/* Glare overlay */}
        {glare && (
          <div
            style={tilt.glareStyle}
            className="pointer-events-none"
            aria-hidden="true"
          />
        )}
      </motion.div>
    );
  }
);

Tilt3DCard.displayName = 'Tilt3DCard';
