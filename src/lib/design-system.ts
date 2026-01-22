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
