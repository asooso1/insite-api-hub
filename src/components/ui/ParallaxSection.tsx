'use client';

import { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;         // Speed multiplier (default: 1)
  depth?: number;         // Z-depth for 3D transform (default: 0)
  className?: string;
}

export interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  offset?: [number, number];  // Scroll offset range (default: [0, 1])
}

/**
 * Individual parallax layer with configurable speed and depth
 *
 * @example
 * ```tsx
 * <ParallaxLayer speed={0.5}>
 *   <h1>Slow moving background</h1>
 * </ParallaxLayer>
 * ```
 */
export function ParallaxLayer({ children, speed = 1, depth = 0, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Calculate transform based on speed
  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);

  return (
    <motion.div
      ref={ref}
      style={{
        y,
        transform: depth !== 0 ? `translateZ(${depth}px)` : undefined,
        willChange: 'transform',
      }}
      className={cn('relative', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax scrolling section with smooth performance
 *
 * Features:
 * - Smooth scroll-based parallax
 * - GPU-accelerated transforms
 * - Multiple depth layers support
 * - Configurable scroll offset
 * - will-change optimization
 *
 * @example
 * ```tsx
 * <ParallaxSection>
 *   <ParallaxLayer speed={0.3}>
 *     <div>Background</div>
 *   </ParallaxLayer>
 *   <ParallaxLayer speed={0.6}>
 *     <div>Midground</div>
 *   </ParallaxLayer>
 *   <ParallaxLayer speed={1}>
 *     <div>Foreground</div>
 *   </ParallaxLayer>
 * </ParallaxSection>
 * ```
 */
export function ParallaxSection({ children, className, offset = [0, 1] }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        'will-change-transform',
        className
      )}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Advanced parallax with custom transform values
 *
 * @example
 * ```tsx
 * <ParallaxAdvanced
 *   scrollYProgress={scrollYProgress}
 *   inputRange={[0, 0.5, 1]}
 *   outputRange={[0, -50, -100]}
 * >
 *   <div>Custom parallax motion</div>
 * </ParallaxAdvanced>
 * ```
 */
export interface ParallaxAdvancedProps {
  children: ReactNode;
  scrollYProgress: MotionValue<number>;
  inputRange?: number[];
  outputRange?: number[];
  property?: 'y' | 'x' | 'scale' | 'opacity' | 'rotate';
  className?: string;
}

export function ParallaxAdvanced({
  children,
  scrollYProgress,
  inputRange = [0, 1],
  outputRange = [0, -100],
  property = 'y',
  className,
}: ParallaxAdvancedProps) {
  const transformValue = useTransform(scrollYProgress, inputRange, outputRange);

  const style = {
    [property]: transformValue,
    willChange: 'transform',
  };

  return (
    <motion.div style={style} className={cn('relative', className)}>
      {children}
    </motion.div>
  );
}

/**
 * Parallax container with background/foreground presets
 *
 * @example
 * ```tsx
 * <ParallaxContainer>
 *   <ParallaxContainer.Background>
 *     <img src="bg.jpg" />
 *   </ParallaxContainer.Background>
 *   <ParallaxContainer.Content>
 *     <h1>Main Content</h1>
 *   </ParallaxContainer.Content>
 *   <ParallaxContainer.Foreground>
 *     <div>Floating elements</div>
 *   </ParallaxContainer.Foreground>
 * </ParallaxContainer>
 * ```
 */
export function ParallaxContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ParallaxSection className={cn('min-h-screen', className)}>
      {children}
    </ParallaxSection>
  );
}

ParallaxContainer.Background = function ParallaxBackground({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ParallaxLayer speed={0.3} className={cn('absolute inset-0 -z-10', className)}>
      {children}
    </ParallaxLayer>
  );
};

ParallaxContainer.Content = function ParallaxContent({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ParallaxLayer speed={0.6} className={cn('relative z-10', className)}>
      {children}
    </ParallaxLayer>
  );
};

ParallaxContainer.Foreground = function ParallaxForeground({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ParallaxLayer speed={1.2} className={cn('relative z-20', className)}>
      {children}
    </ParallaxLayer>
  );
};

/**
 * Smooth parallax effect for images with zoom on scroll
 *
 * @example
 * ```tsx
 * <ParallaxImage
 *   src="/image.jpg"
 *   alt="Hero"
 *   className="h-screen"
 * />
 * ```
 */
export interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number;
  zoom?: boolean;
  className?: string;
}

export function ParallaxImage({ src, alt, speed = 0.5, zoom = true, className }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);
  const scale = zoom ? useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 1, 0.9]) : 1;

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y, scale }}
        className="w-full h-full object-cover will-change-transform"
      />
    </div>
  );
}
