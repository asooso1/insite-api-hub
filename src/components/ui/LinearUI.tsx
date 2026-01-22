'use client';

import { forwardRef, ReactNode, InputHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import {
  cardVariants,
  buttonVariants,
  modalBackdropVariants,
  modalContentVariants,
  listContainerVariants,
  listItemVariants,
} from '@/lib/design-system';
import { cn } from '@/lib/utils';

// ============================================
// GLASS CARD
// ============================================
interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  variant?: 'default' | 'subtle' | 'frosted' | 'solid';
  hover?: boolean;
  className?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = 'default', hover = true, className, ...props }, ref) => {
    const variants = {
      default: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg shadow-slate-200/20',
      subtle: 'bg-white/40 backdrop-blur-md border border-slate-200/30',
      frosted: 'bg-white/85 backdrop-blur-2xl saturate-150 border border-white/30',
      solid: 'bg-white border border-slate-200 shadow-sm',
    };

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover={hover ? "hover" : undefined}
        whileTap={hover ? "tap" : undefined}
        className={cn(
          'rounded-2xl p-6 transition-colors',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

// ============================================
// GLASS BUTTON
// ============================================
interface GlassButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, onClick, type = 'button' }, ref) => {
    const variantStyles = {
      primary: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25',
      secondary: 'bg-white/70 hover:bg-white/90 backdrop-blur-md border border-slate-200/50 text-slate-700 shadow-sm',
      ghost: 'bg-transparent hover:bg-slate-100/50 text-slate-600',
      danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        variants={buttonVariants}
        initial="initial"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizes[size],
          className
        )}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon}
        {children}
      </motion.button>
    );
  }
);
GlassButton.displayName = 'GlassButton';

// ============================================
// GLASS INPUT
// ============================================
interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl text-sm',
              'bg-white/50 backdrop-blur-sm border border-slate-200/50',
              'placeholder:text-slate-400 text-slate-800',
              'focus:outline-none focus:bg-white/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';

// ============================================
// GLASS MODAL
// ============================================
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GlassModal({ isOpen, onClose, title, description, children, size = 'md' }: GlassModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        variants={modalBackdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        variants={modalContentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          'relative w-full bg-white/90 backdrop-blur-2xl',
          'border border-white/30 rounded-3xl shadow-2xl',
          'overflow-hidden',
          sizes[size]
        )}
      >
        <div className="p-6">
          {title && (
            <h2 className="text-xl font-bold text-slate-900 mb-1">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-slate-500 mb-4">{description}</p>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// ANIMATED LIST
// ============================================
interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={listContainerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div variants={listItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================
// GLASS BADGE
// ============================================
interface GlassBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export function GlassBadge({ children, variant = 'default', size = 'sm' }: GlassBadgeProps) {
  const variants = {
    default: 'bg-slate-100/80 text-slate-600 border-slate-200/50',
    success: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50',
    warning: 'bg-amber-100/80 text-amber-700 border-amber-200/50',
    error: 'bg-red-100/80 text-red-700 border-red-200/50',
    info: 'bg-blue-100/80 text-blue-700 border-blue-200/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full backdrop-blur-sm border',
      variants[variant],
      sizes[size]
    )}>
      {children}
    </span>
  );
}

// ============================================
// SHIMMER SKELETON
// ============================================
interface ShimmerSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function ShimmerSkeleton({ className, variant = 'rectangular' }: ShimmerSkeletonProps) {
  const base = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]';

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div className={cn(base, variants[variant], className)} />
  );
}

// ============================================
// GLASS TOOLTIP
// ============================================
interface GlassTooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function GlassTooltip({ content, children, side = 'top' }: GlassTooltipProps) {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div className={cn(
        'absolute z-50 px-2.5 py-1.5 text-xs font-medium',
        'bg-slate-900/90 backdrop-blur-md text-white rounded-lg',
        'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
        'transition-all duration-200 whitespace-nowrap',
        positions[side]
      )}>
        {content}
      </div>
    </div>
  );
}
