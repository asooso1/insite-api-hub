// Design System - Linear.app Style
// Glassmorphism, smooth transitions, minimal aesthetic

import { Variants } from 'framer-motion';

// ============================================
// COLOR TOKENS
// ============================================
export const colors = {
  // Primary
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Neutral (Slate based)
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// ============================================
// GLASSMORPHISM STYLES
// ============================================
export const glass = {
  // Light mode glass
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  },

  // Dark mode glass
  dark: {
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  },

  // Subtle glass (less opacity)
  subtle: {
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },

  // Frosted glass (more blur)
  frosted: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
};

// Tailwind-compatible class strings
export const glassClasses = {
  card: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg shadow-slate-200/20',
  cardDark: 'bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20',
  subtle: 'bg-white/40 backdrop-blur-md border border-white/15',
  frosted: 'bg-white/85 backdrop-blur-2xl saturate-150 border border-white/30',
  modal: 'bg-white/90 backdrop-blur-2xl border border-white/30 shadow-2xl',
  input: 'bg-white/50 backdrop-blur-sm border border-slate-200/50 focus:bg-white/80 focus:border-primary-400',
};

// ============================================
// ANIMATION VARIANTS (Framer Motion)
// ============================================

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: 'blur(10px)',
    transition: {
      duration: 0.3,
    },
  },
};

// Card/item animations
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// List item stagger
export const listContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Modal animations
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

// Sidebar animations
export const sidebarVariants: Variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  closed: {
    x: -280,
    opacity: 0,
    transition: {
      duration: 0.25,
    },
  },
};

// Button press animation
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// Floating/levitating effect
export const floatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Glow pulse effect
export const glowPulseVariants: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(99, 102, 241, 0.3)',
      '0 0 40px rgba(99, 102, 241, 0.5)',
      '0 0 20px rgba(99, 102, 241, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Skeleton shimmer
export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
  // Font families
  fontFamily: {
    sans: 'var(--font-sans, "Inter", system-ui, sans-serif)',
    mono: 'var(--font-mono, "JetBrains Mono", monospace)',
  },

  // Font sizes
  fontSize: {
    '2xs': '0.625rem',   // 10px
    xs: '0.75rem',       // 12px
    sm: '0.875rem',      // 14px
    base: '1rem',        // 16px
    lg: '1.125rem',      // 18px
    xl: '1.25rem',       // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

// ============================================
// SPACING
// ============================================
export const spacing = {
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  none: '0',
  sm: '0.25rem',     // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.5rem',      // 8px
  lg: '0.75rem',     // 12px
  xl: '1rem',        // 16px
  '2xl': '1.25rem',  // 20px
  '3xl': '1.5rem',   // 24px
  '4xl': '2rem',     // 32px
  full: '9999px',
};

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

  // Colored shadows
  primary: '0 10px 40px -10px rgba(99, 102, 241, 0.4)',
  success: '0 10px 40px -10px rgba(16, 185, 129, 0.4)',
  error: '0 10px 40px -10px rgba(239, 68, 68, 0.4)',
};

// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
  fast: 'all 0.1s ease',
  DEFAULT: 'all 0.2s ease',
  slow: 'all 0.3s ease',
  spring: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};

// ============================================
// Z-INDEX
// ============================================
export const zIndex = {
  dropdown: 50,
  sticky: 60,
  fixed: 70,
  modalBackdrop: 80,
  modal: 90,
  popover: 100,
  tooltip: 110,
};

// ============================================
// 3D ANIMATION VARIANTS (NEW)
// ============================================

// 3D Tilt card animation
export const tilt3dVariants: Variants = {
  initial: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Subtle floating animation
export const floatSubtleVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Aggressive floating animation
export const floatIntenseVariants: Variants = {
  animate: {
    y: [0, -20, 0],
    x: [0, 5, 0, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Parallax scroll-based animation
export const parallaxVariants = {
  // Background layer (slow)
  background: {
    y: (scrollY: number) => scrollY * 0.3,
  },
  // Midground layer (medium)
  midground: {
    y: (scrollY: number) => scrollY * 0.6,
  },
  // Foreground layer (fast)
  foreground: {
    y: (scrollY: number) => scrollY * 1.2,
  },
};

// Depth layer variants for stacked elements
export const depthLayerVariants: Variants = {
  layer1: {
    z: 0,
    scale: 1,
  },
  layer2: {
    z: 20,
    scale: 1.05,
  },
  layer3: {
    z: 40,
    scale: 1.1,
  },
};

// Rotate on scroll
export const rotateOnScrollVariants: Variants = {
  initial: {
    rotate: 0,
  },
  animate: (scrollProgress: number) => ({
    rotate: scrollProgress * 360,
    transition: {
      duration: 0.3,
      ease: 'linear',
    },
  }),
};

// 3D flip card
export const flipCardVariants: Variants = {
  front: {
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  back: {
    rotateY: 180,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// ============================================
// 3D UTILITIES
// ============================================

/**
 * Generate multi-layer depth shadow for 3D effect
 * @param color - Shadow color (default: rgba(0,0,0,0.1))
 * @param layers - Number of shadow layers (default: 5)
 */
export function depthShadow(color = 'rgba(0, 0, 0, 0.1)', layers = 5): string {
  const shadows: string[] = [];
  for (let i = 1; i <= layers; i++) {
    const offset = i * 2;
    const blur = i * 4;
    const opacity = 0.1 / i;
    shadows.push(`0 ${offset}px ${blur}px ${color.replace(/[\d.]+\)$/, `${opacity})`)}`);
  }
  return shadows.join(', ');
}

/**
 * Generate layered shadows for elevated cards
 */
export const layeredShadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.03)',
  md: '0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.05), 0 12px 24px rgba(0, 0, 0, 0.03)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.1), 0 16px 32px rgba(0, 0, 0, 0.08), 0 24px 48px rgba(0, 0, 0, 0.05)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.12), 0 32px 64px rgba(0, 0, 0, 0.1), 0 48px 96px rgba(0, 0, 0, 0.08)',
};

/**
 * Generate CSS perspective string
 */
export function perspective(value: number): string {
  return `perspective(${value}px)`;
}

/**
 * Generate 3D transform string
 */
export function transform3D(
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  translateZ = 0,
  scale = 1
): string {
  return `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) translateZ(${translateZ}px) scale(${scale})`;
}

// ============================================
// GRADIENT UTILITIES
// ============================================

/**
 * Generate mesh gradient for backgrounds
 */
export const meshGradients = {
  aurora: 'radial-gradient(at 40% 20%, hsla(230, 100%, 74%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(280, 100%, 74%, 0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(340, 100%, 76%, 0.3) 0px, transparent 50%)',

  ocean: 'radial-gradient(at 0% 0%, hsla(200, 100%, 70%, 0.3) 0px, transparent 50%), radial-gradient(at 50% 0%, hsla(220, 100%, 70%, 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(240, 100%, 70%, 0.3) 0px, transparent 50%)',

  sunset: 'radial-gradient(at 0% 0%, hsla(20, 100%, 70%, 0.3) 0px, transparent 50%), radial-gradient(at 50% 50%, hsla(340, 100%, 70%, 0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(280, 100%, 70%, 0.3) 0px, transparent 50%)',

  forest: 'radial-gradient(at 20% 30%, hsla(140, 70%, 60%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 20%, hsla(160, 80%, 50%, 0.3) 0px, transparent 50%), radial-gradient(at 50% 80%, hsla(100, 60%, 60%, 0.3) 0px, transparent 50%)',
};

/**
 * Generate animated gradient
 */
export const animatedGradients = {
  shift: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
  shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
};

/**
 * Generate glass gradient overlay
 */
export function glassGradient(opacity = 0.1): string {
  return `linear-gradient(135deg, rgba(255, 255, 255, ${opacity}) 0%, rgba(255, 255, 255, 0) 100%)`;
}

/**
 * Color utilities for gradients
 */
export const gradientColors = {
  primary: 'from-indigo-500 to-purple-600',
  primarySubtle: 'from-indigo-50 to-purple-50',
  success: 'from-emerald-500 to-teal-600',
  warning: 'from-amber-500 to-orange-600',
  error: 'from-red-500 to-pink-600',
  info: 'from-blue-500 to-cyan-600',
  dark: 'from-slate-800 to-slate-900',
  light: 'from-slate-50 to-white',

  // Vibrant gradients
  cosmic: 'from-violet-600 via-purple-600 to-indigo-600',
  fire: 'from-orange-500 via-red-500 to-pink-500',
  electric: 'from-cyan-500 via-blue-500 to-indigo-500',
  nature: 'from-green-500 via-emerald-500 to-teal-500',
};

// ============================================
// 3D MODAL ANIMATION VARIANTS (STYLE-01-3)
// ============================================

/**
 * 3D 모달 애니메이션 variants
 * 모달 오픈 시 perspective 진입 효과와 블러 트랜지션 적용
 */
export const modal3DVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      rotateX: -15,
      y: 60,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 25,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      rotateX: 5,
      y: 30,
      filter: 'blur(5px)',
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const,
      },
    },
  },
} as const;
